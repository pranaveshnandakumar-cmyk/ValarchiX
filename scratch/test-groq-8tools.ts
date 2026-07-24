import fs from 'fs';
import path from 'path';
import { ChatGroq } from '@langchain/groq';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import {
  sipCalculator,
  lumpsumCalculator,
  compoundInterestCalc,
  fdVsMfCompare,
  goalPlanner,
  retirementCalc,
  taxCompare,
  ppfCalc
} from '../src/lib/vaathi/tools';
import { VAATHI_SYSTEM_PROMPT } from '../src/lib/vaathi/system-prompt';

const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim();
    }
  }
}

async function testGroq8Tools() {
  console.log("=== TESTING GROQ WITH 8 CORE TOOLS ===");
  const apiKey = process.env.GROQ_API_KEY;

  const llm = new ChatGroq({
    model: "llama-3.3-70b-versatile",
    apiKey: apiKey,
    temperature: 0.7,
    maxTokens: 4096,
  });

  const agent = createReactAgent({
    llm,
    tools: [
      sipCalculator,
      lumpsumCalculator,
      compoundInterestCalc,
      fdVsMfCompare,
      goalPlanner,
      retirementCalc,
      taxCompare,
      ppfCalc
    ],
  });

  const query = "I need ₹50 lakhs in 10 years, how much SIP?";
  console.log(`Query: "${query}"`);

  try {
    const startTime = Date.now();
    const result = await agent.invoke({
      messages: [
        new SystemMessage(VAATHI_SYSTEM_PROMPT),
        new HumanMessage(query)
      ]
    });
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    const toolMessages = result.messages.filter((m: any) => m.constructor?.name === "ToolMessage" || m._getType?.() === "tool");
    const aiMessages = result.messages.filter((m: any) => m._getType?.() === "ai" && m.content);
    const finalMsg = aiMessages[aiMessages.length - 1];

    console.log(`\n✅ SUCCESS WITH GROQ! (Execution time: ${elapsed}s)`);
    console.log(`Tools Called:`, toolMessages.map((t: any) => t.name || "tool"));

    let content = "";
    if (typeof finalMsg?.content === "string") content = finalMsg.content;
    else if (Array.isArray(finalMsg?.content)) content = finalMsg.content.map((p: any) => p.text || String(p)).join("");
    else content = String(finalMsg?.content || "");

    console.log(`\nAI Response Output:\n`, content);
  } catch (err: any) {
    console.error("❌ Groq Test Failed:", err.message || err);
  }
}

testGroq8Tools();
