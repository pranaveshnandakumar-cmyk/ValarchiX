import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { HumanMessage, SystemMessage, AIMessage, BaseMessage } from "@langchain/core/messages";
import { VAATHI_SYSTEM_PROMPT } from "./system-prompt";
import { vaathiTools } from "./tools";

/**
 * Create the valarchi Vaathi agent
 * Uses Gemini 2.5 Flash with ReAct pattern + calculator tools
 */
export function createVaathiAgent() {
  const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  const llm = new ChatGoogleGenerativeAI({
    model: modelName,
    apiKey: apiKey,
    temperature: 0.7,
    maxOutputTokens: 4096,
  });

  const agent = createReactAgent({
    llm,
    tools: vaathiTools,
  });

  return agent;
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
