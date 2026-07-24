import { NextRequest } from "next/server";
import { evaluatePreLLMGuardrail } from "@/lib/vaathi/guardrails";
import { checkSemanticCache } from "@/lib/vaathi/cache";
import { executeSinglePassVaathi } from "@/lib/vaathi/agent";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Messages array is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const latestMessage = messages[messages.length - 1]?.content || "";

    // PIPELINE STEP 1: Pre-LLM Guardrail Check (0 Tokens Spent!)
    const guardrail = evaluatePreLLMGuardrail(latestMessage);
    if (guardrail.intercepted && guardrail.content) {
      return createSSEResponse({
        content: guardrail.content,
        toolsUsed: []
      });
    }

    // PIPELINE STEP 2: Semantic Response Cache Check (0 Tokens Spent, 0ms Latency!)
    const cacheHit = checkSemanticCache(latestMessage);
    if (cacheHit) {
      return createSSEResponse({
        content: cacheHit.answer,
        toolsUsed: cacheHit.toolsUsed || []
      });
    }

    // PIPELINE STEP 3: Single-Pass 1-Call LLM Execution (80% Token & API Call Reduction)
    const candidateModels = [
      "llama-3.1-8b-instant",
      "llama-3.3-70b-versatile",
      "gemini-flash-latest"
    ];

    let result: { content: string; toolsUsed: string[] } | null = null;
    let lastErr: any;

    for (const modelName of candidateModels) {
      try {
        result = await executeSinglePassVaathi(messages, modelName);
        break; // Success!
      } catch (err: any) {
        lastErr = err;
        const is429 = err.status === 429 || String(err).includes("429") || String(err).includes("Rate limit") || String(err).includes("Quota exceeded");
        if (is429) {
          console.warn(`429 Rate limit on ${modelName}, trying fallback model...`);
          continue;
        }
        throw err;
      }
    }

    if (!result) {
      throw lastErr || new Error("All AI service models are currently busy. Please retry in a few seconds.");
    }

    return createSSEResponse(result);

  } catch (error: any) {
    console.error("Vaathi API route error:", error);
    const errorMessage = error.message || String(error) || "An unexpected error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

/** Helper to format SSE Stream Response */
function createSSEResponse(payload: { content: string; toolsUsed: string[] }) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      if (payload.toolsUsed && payload.toolsUsed.length > 0) {
        const toolData = JSON.stringify({ type: "tools_used", tools: payload.toolsUsed });
        controller.enqueue(encoder.encode(`data: ${toolData}\n\n`));
      }

      if (payload.content) {
        const contentData = JSON.stringify({ type: "content", content: payload.content });
        controller.enqueue(encoder.encode(`data: ${contentData}\n\n`));
      }

      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
