import fs from 'fs';
import path from 'path';
import { ChatGroq } from '@langchain/groq';
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

async function test8bGroq() {
  console.log("=== TESTING GROQ WITH llama-3.1-8b-instant ===");
  const apiKey = process.env.GROQ_API_KEY;

  const llm = new ChatGroq({
    model: "llama-3.1-8b-instant",
    apiKey: apiKey,
    temperature: 0.7,
    maxTokens: 4096,
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

    console.log(`\n✅ SUCCESS WITH llama-3.1-8b-instant! (${elapsed}s)`);
    console.log(`Tools Called:`, toolMessages.map((t: any) => t.name || "tool"));

    let content = "";
    if (typeof finalMsg?.content === "string") content = finalMsg.content;
    else if (Array.isArray(finalMsg?.content)) content = finalMsg.content.map((p: any) => p.text || String(p)).join("");
    else content = String(finalMsg?.content || "");

    console.log(`\nAI Response Output:\n`, content);
  } catch (err: any) {
    console.error("❌ Failed with llama-3.1-8b-instant:", err.message || err);
  }
}

test8bGroq();
