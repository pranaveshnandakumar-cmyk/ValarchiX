import { NextRequest } from "next/server";
import { createVaathiAgent, executeSinglePassVaathi, formatMessages } from "@/lib/vaathi/agent";
import { AIMessage } from "@langchain/core/messages";

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

    const groqKey = process.env.GROQ_API_KEY;
    const googleKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

    if (!groqKey && (!googleKey || googleKey === "your_gemini_api_key_here")) {
      return new Response(
        JSON.stringify({ 
          error: "No AI API key configured. Please add GROQ_API_KEY, GOOGLE_API_KEY, or GEMINI_API_KEY to your environment variables." 
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const formattedMessages = formatMessages(messages);

    // Stream the response using SSE with single-pass 1-call LLM execution (0.6s)
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
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
              break; // Single LLM call succeeded!
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

          // Emit tool badges if tools were executed
          if (result.toolsUsed && result.toolsUsed.length > 0) {
            const toolData = JSON.stringify({ type: "tools_used", tools: result.toolsUsed });
            controller.enqueue(encoder.encode(`data: ${toolData}\n\n`));
          }

          // Emit response text
          if (result.content) {
            const contentData = JSON.stringify({ type: "content", content: result.content });
            controller.enqueue(encoder.encode(`data: ${contentData}\n\n`));
          }

          // Signal completion
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
          controller.close();
        } catch (error: any) {
          console.error("Vaathi agent error:", error);
          const errorMessage = error.message || String(error) || "An unexpected error occurred";
          const errorData = JSON.stringify({ type: "error", error: errorMessage });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("Vaathi API route error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
