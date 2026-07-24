import fs from 'fs';
import path from 'path';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { vaathiTools } from '../src/lib/vaathi/tools';
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

async function testSpeed() {
  console.log("=== TESTING GEMINI FLASH LATEST SPEED ===");
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

  const llm = new ChatGoogleGenerativeAI({
    model: "gemini-1.5-flash-latest",
    apiKey: apiKey,
    temperature: 0.7,
    maxOutputTokens: 2048,
  });

  const agent = createReactAgent({
    llm,
    tools: vaathiTools,
  });

  const query = "I need ₹50 lakhs in 10 years, how much SIP?";

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

    console.log(`\n⚡ BLAZING SPEED SUCCESS! (${elapsed}s)`);
    console.log(`Tools Called:`, toolMessages.map((t: any) => t.name || "tool"));

    let content = "";
    if (typeof finalMsg?.content === "string") content = finalMsg.content;
    else if (Array.isArray(finalMsg?.content)) content = finalMsg.content.map((p: any) => p.text || String(p)).join("");
    else content = String(finalMsg?.content || "");

    console.log(`\nAI Response Output:\n`, content.slice(0, 300));
  } catch (err: any) {
    console.error("❌ Speed Test Failed:", err.message || err);
  }
}

testSpeed();
