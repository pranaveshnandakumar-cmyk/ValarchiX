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

async function testGemini2() {
  console.log("=== TESTING GEMINI 2.0 FLASH WITH ALL 25 TOOLS ===");
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

  const llm = new ChatGoogleGenerativeAI({
    model: "gemini-2.0-flash",
    apiKey: apiKey,
    temperature: 0.7,
    maxOutputTokens: 4096,
  });

  const agent = createReactAgent({
    llm,
    tools: vaathiTools,
  });

  try {
    const startTime = Date.now();
    const result = await agent.invoke({
      messages: [
        new SystemMessage(VAATHI_SYSTEM_PROMPT),
        new HumanMessage("I need ₹50 lakhs in 10 years, how much SIP?")
      ]
    });
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    const toolMessages = result.messages.filter((m: any) => m.constructor?.name === "ToolMessage" || m._getType?.() === "tool");
    const aiMessages = result.messages.filter((m: any) => m._getType?.() === "ai" && m.content);
    const finalMsg = aiMessages[aiMessages.length - 1];

    console.log(`\n✅ GEMINI 2.0 FLASH SUCCESS! (${elapsed}s)`);
    console.log(`Tools Called:`, toolMessages.map((t: any) => t.name || "tool"));

    let content = "";
    if (typeof finalMsg?.content === "string") content = finalMsg.content;
    else if (Array.isArray(finalMsg?.content)) content = finalMsg.content.map((p: any) => p.text || String(p)).join("");
    else content = String(finalMsg?.content || "");

    console.log(`\nGemini Output:\n`, content);
  } catch (err: any) {
    console.error("❌ Gemini 2.0 Failed:", err.message || err);
  }
}

testGemini2();
