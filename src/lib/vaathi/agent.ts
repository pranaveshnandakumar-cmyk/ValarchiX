import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatGroq } from "@langchain/groq";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { HumanMessage, SystemMessage, AIMessage, BaseMessage } from "@langchain/core/messages";
import { VAATHI_SYSTEM_PROMPT } from "./system-prompt";
import { vaathiTools } from "./tools";

/**
 * Create the valarchi Vaathi agent
 * Supports Groq (llama-3.3-70b-versatile) and Google Gemini with ReAct pattern + 25 calculator tools
 */
export function createVaathiAgent() {
  const groqApiKey = process.env.GROQ_API_KEY;
  const googleApiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

  if (groqApiKey) {
    const groqModel = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
    const groqLlm = new ChatGroq({
      model: groqModel,
      apiKey: groqApiKey,
      temperature: 0.7,
      maxTokens: 4096,
    });

    if (googleApiKey) {
      const geminiLlm = new ChatGoogleGenerativeAI({
        model: process.env.GEMINI_MODEL || "gemini-flash-latest",
        apiKey: googleApiKey,
        temperature: 0.7,
        maxOutputTokens: 4096,
      });

      return createReactAgent({
        llm: groqLlm.withFallbacks([geminiLlm]),
        tools: vaathiTools.slice(0, 10),
      });
    }

    return createReactAgent({
      llm: groqLlm,
      tools: vaathiTools.slice(0, 10),
    });
  }

  if (googleApiKey) {
    const geminiLlm = new ChatGoogleGenerativeAI({
      model: process.env.GEMINI_MODEL || "gemini-flash-latest",
      apiKey: googleApiKey,
      temperature: 0.7,
      maxOutputTokens: 4096,
    });

    return createReactAgent({
      llm: geminiLlm,
      tools: vaathiTools,
    });
  }

  throw new Error("No AI API key found. Please add GROQ_API_KEY or GOOGLE_API_KEY.");
}

/**
 * Convert chat messages from client format to LangChain format
 */
export function formatMessages(
  messages: Array<{ role: string; content: string }>
): BaseMessage[] {
  const formatted: BaseMessage[] = [new SystemMessage(VAATHI_SYSTEM_PROMPT)];

  for (const msg of messages) {
    if (msg.role === "user") {
      formatted.push(new HumanMessage(msg.content));
    } else if (msg.role === "assistant") {
      formatted.push(new AIMessage(msg.content));
    }
  }

  return formatted;
}
