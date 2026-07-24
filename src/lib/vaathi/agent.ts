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

  let llm: any;

  if (groqApiKey) {
    const groqModel = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
    llm = new ChatGroq({
      model: groqModel,
      apiKey: groqApiKey,
      temperature: 0.7,
      maxTokens: 4096,
    });
  } else {
    const modelName = process.env.GEMINI_MODEL || "gemini-flash-latest";
    llm = new ChatGoogleGenerativeAI({
      model: modelName,
      apiKey: googleApiKey,
      temperature: 0.7,
      maxOutputTokens: 4096,
    });
  }

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
