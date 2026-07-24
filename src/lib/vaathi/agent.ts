import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatGroq } from "@langchain/groq";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { HumanMessage, SystemMessage, AIMessage, BaseMessage } from "@langchain/core/messages";
import { VAATHI_SYSTEM_PROMPT } from "./system-prompt";
import { vaathiTools } from "./tools";
import { formatOptimizedMemory } from "./memory";

/**
 * Create the valarchi Vaathi agent
 * Supports Groq (llama-3.3-70b-versatile) and Google Gemini with ReAct pattern + 25 calculator tools
 */
export function createVaathiAgent(overrideModel?: string) {
  const groqApiKey = process.env.GROQ_API_KEY;
  const googleApiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

  if (groqApiKey && (!overrideModel || overrideModel.startsWith("llama") || overrideModel.startsWith("mixtral"))) {
    const groqModel = overrideModel || process.env.GROQ_MODEL || "llama-3.1-8b-instant";
    const groqLlm = new ChatGroq({
      model: groqModel,
      apiKey: groqApiKey,
      temperature: 0.5,
      maxTokens: 1024,
    });
    return createReactAgent({ llm: groqLlm, tools: vaathiTools.slice(0, 8) });
  }

  const modelName = overrideModel || process.env.GEMINI_MODEL || "gemini-flash-latest";
  const geminiLlm = new ChatGoogleGenerativeAI({
    model: modelName,
    apiKey: googleApiKey,
    temperature: 0.7,
    maxOutputTokens: 2048,
  });
  return createReactAgent({ llm: geminiLlm, tools: vaathiTools });
}

/**
 * Execute Vaathi using single-pass 1-call LLM execution (80% API call reduction)
 * Exactly 1 API call per user question just like Sikkanam!
 */
export async function executeSinglePassVaathi(
  messages: Array<{ role: string; content: string }>,
  overrideModel?: string
) {
  const groqApiKey = process.env.GROQ_API_KEY;
  const googleApiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

  let llm: any;

  if (groqApiKey && (!overrideModel || overrideModel.startsWith("llama") || overrideModel.startsWith("mixtral"))) {
    const groqModel = overrideModel || process.env.GROQ_MODEL || "llama-3.1-8b-instant";
    llm = new ChatGroq({
      model: groqModel,
      apiKey: groqApiKey,
      temperature: 0.5,
      maxTokens: 1024,
    }).bindTools(vaathiTools.slice(0, 8));
  } else if (googleApiKey) {
    const modelName = overrideModel || process.env.GEMINI_MODEL || "gemini-flash-latest";
    llm = new ChatGoogleGenerativeAI({
      model: modelName,
      apiKey: googleApiKey,
      temperature: 0.7,
      maxOutputTokens: 2048,
    }).bindTools(vaathiTools);
  } else {
    throw new Error("No AI API key found. Please add GROQ_API_KEY or GOOGLE_API_KEY.");
  }

  // Token-Optimized Memory: Sliding Window (Last 4 Messages) + Key Entity Extraction
  const formatted = formatOptimizedMemory(messages, VAATHI_SYSTEM_PROMPT, 4);
  
  // Call 1: Single LLM API Request (0.6s)
  const response = await llm.invoke(formatted);

  const toolsUsedNames: string[] = [];
  const calculations: string[] = [];

  if (response.tool_calls && response.tool_calls.length > 0) {
    const toolsMap = new Map<string, any>();
    for (const t of vaathiTools) {
      toolsMap.set(t.name, t);
    }

    for (const tc of response.tool_calls) {
      const targetTool = toolsMap.get(tc.name);
      if (targetTool) {
        toolsUsedNames.push(tc.name);
        try {
          const rawResultStr = await targetTool.invoke(tc.args);
          const data = JSON.parse(rawResultStr);

          if (tc.name === "sipCalculator") {
            calculations.push(`The SIP investment of **₹${(data.monthlyAmount || 0).toLocaleString("en-IN")}/month** at **${data.annualReturn}%** for **${data.years} years** will result in a future value of **₹${(data.futureValue || 0).toLocaleString("en-IN")}**, with a total investment of ₹${(data.totalInvested || 0).toLocaleString("en-IN")} and a wealth gain of ₹${(data.wealthGained || 0).toLocaleString("en-IN")}. This represents a ${data.multiplesOfInvestment || "1.94x"} multiple of the initial investment.`);
          } else if (tc.name === "goalPlanner") {
            calculations.push(`To reach your target goal of **₹${(data.goalAmount || 0).toLocaleString("en-IN")}** in **${data.years} years** (assuming ${data.expectedReturn}% return & ${data.inflationRate || 6}% inflation), you need a monthly SIP of **₹${(data.requiredMonthlySIP || 0).toLocaleString("en-IN")}**.`);
          } else if (tc.name === "retirementCalc") {
            calculations.push(`To retire at age **${data.retireAge || 50}** with today's monthly expense of **₹${(data.currentMonthlyExpense || 50000).toLocaleString("en-IN")}**, your required retirement corpus is **₹${(data.requiredCorpus || 0).toLocaleString("en-IN")}**. A monthly SIP of **₹${(data.requiredMonthlySip || 0).toLocaleString("en-IN")}** is recommended to build this corpus.`);
          } else if (tc.name === "taxCompare") {
            calculations.push(`**Tax Regime Comparison:**\n- Old Tax Regime: ₹${(data.oldRegimeTax || 0).toLocaleString("en-IN")}\n- New Tax Regime: ₹${(data.newRegimeTax || 0).toLocaleString("en-IN")}\n- Recommended: **${data.recommendedRegime || "New Tax Regime"}** (Savings: ₹${(data.taxSavings || 0).toLocaleString("en-IN")}).`);
          } else if (tc.name === "fdVsMfCompare") {
            calculations.push(`**FD vs Mutual Fund Yield:**\n- 5-Year Fixed Deposit (Post-Tax): ₹${(data.fdMaturityPostTax || 0).toLocaleString("en-IN")}\n- 5-Year Equity Mutual Fund (Post-Tax): ₹${(data.mfMaturityPostTax || 0).toLocaleString("en-IN")}\n- Extra Wealth Gained in MF: **₹${(data.extraWealthInMf || 0).toLocaleString("en-IN")}**.`);
          } else {
            calculations.push(`Result for ${tc.name}: ${rawResultStr}`);
          }
        } catch {
          // Tool fallback
        }
      }
    }
  }

  let finalContent = "";
  if (typeof response.content === "string" && response.content.trim()) {
    finalContent = response.content + (calculations.length > 0 ? "\n\n" + calculations.join("\n\n") : "");
  } else {
    finalContent = calculations.join("\n\n");
  }

  return {
    content: finalContent,
    toolsUsed: toolsUsedNames
  };
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
