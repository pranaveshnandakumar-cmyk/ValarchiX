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

async function testMultiGroq() {
  console.log("=== TESTING MULTI-MODEL GROQ FALLBACK CHAIN ===");
  const apiKey = process.env.GROQ_API_KEY;

  const m1 = new ChatGroq({ model: "llama-3.3-70b-versatile", apiKey, temperature: 0.5, maxTokens: 1024 });
  const m2 = new ChatGroq({ model: "llama-3.1-8b-instant", apiKey, temperature: 0.5, maxTokens: 1024 });
  const m3 = new ChatGroq({ model: "llama3-70b-8192", apiKey, temperature: 0.5, maxTokens: 1024 });

  const llm = m1.withFallbacks([m2, m3]);

  const agent = createReactAgent({
    llm,
    tools: vaathiTools.slice(0, 5),
  });

  try {
    const startTime = Date.now();
    const result = await agent.invoke({
      messages: [
        new SystemMessage(VAATHI_SYSTEM_PROMPT),
        new HumanMessage("teach me personal finance")
      ]
    });
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    const aiMessages = result.messages.filter((m: any) => m._getType?.() === "ai" && m.content);
    const finalMsg = aiMessages[aiMessages.length - 1];

    console.log(`\n✅ MULTI-GROQ SUCCESS! (${elapsed}s)`);
    let content = typeof finalMsg?.content === "string" ? finalMsg.content : String(finalMsg?.content || "");
    console.log(`AI Output:\n`, content);
  } catch (err: any) {
    console.error("❌ Multi-Groq Failed:", err.message || err);
  }
}

testMultiGroq();
