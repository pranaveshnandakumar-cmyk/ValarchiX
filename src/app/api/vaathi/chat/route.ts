import { NextRequest } from "next/server";
import { createVaathiAgent, formatMessages } from "@/lib/vaathi/agent";
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

    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      return new Response(
        JSON.stringify({ 
          error: "Gemini API key not configured. Please add GOOGLE_API_KEY or GEMINI_API_KEY to your environment variables." 
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const agent = createVaathiAgent();
    const formattedMessages = formatMessages(messages);

    // Stream the agent's response using SSE
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const result = await agent.invoke({
            messages: formattedMessages,
          });

          // Extract final AI message text robustly
          const aiMessages = result.messages.filter(
            (msg: any) => (msg instanceof AIMessage || msg._getType?.() === "ai") && msg.content
          );

          if (aiMessages.length > 0) {
            const finalMessage = aiMessages[aiMessages.length - 1];
            let content = "";
            if (typeof finalMessage.content === "string") {
              content = finalMessage.content;
            } else if (Array.isArray(finalMessage.content)) {
              content = finalMessage.content
                .map((p: any) => (typeof p === "string" ? p : p?.text || ""))
                .join("");
            } else {
              content = String(finalMessage.content || "");
            }

            // Stream content in chunks for a typing effect
            const words = content.split(" ");
            for (let i = 0; i < words.length; i++) {
              const chunk = (i === 0 ? "" : " ") + words[i];
              const data = JSON.stringify({ type: "content", content: chunk });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }

          // Send tool usage info if any tools were called
          const toolMessages = result.messages.filter(
            (msg: any) => msg.constructor?.name === "ToolMessage"
          );
          if (toolMessages.length > 0) {
            const toolNames = toolMessages.map((t: any) => t.name || "calculator");
            const toolData = JSON.stringify({ 
              type: "tools_used", 
              tools: [...new Set(toolNames)] 
            });
            controller.enqueue(encoder.encode(`data: ${toolData}\n\n`));
          }

          // Signal completion
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
          controller.close();
        } catch (error: any) {
          console.error("Vaathi agent error:", error);
          const errorData = JSON.stringify({ 
            type: "error", 
            error: error.message || "An unexpected error occurred" 
          });
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
