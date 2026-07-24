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

async function testMultiGroqBind() {
  console.log("=== TESTING BIND TOOLS MULTI-MODEL FALLBACK ===");
  const apiKey = process.env.GROQ_API_KEY;
  const tools = vaathiTools.slice(0, 5);

  const m1 = new ChatGroq({ model: "llama-3.3-70b-versatile", apiKey, temperature: 0.5, maxTokens: 1024 });
  const m2 = new ChatGroq({ model: "llama-3.1-8b-instant", apiKey, temperature: 0.5, maxTokens: 1024 });
  const m3 = new ChatGroq({ model: "llama3-70b-8192", apiKey, temperature: 0.5, maxTokens: 1024 });

  const llmWithFallback = m1.bindTools(tools).withFallbacks([
    m2.bindTools(tools),
    m3.bindTools(tools)
  ]);

  const agent = createReactAgent({
    llm: llmWithFallback,
    tools,
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

    console.log(`\n✅ BOUND MULTI-GROQ FALLBACK SUCCESS! (${elapsed}s)`);
    let content = typeof finalMsg?.content === "string" ? finalMsg.content : String(finalMsg?.content || "");
    console.log(`AI Output:\n`, content);
  } catch (err: any) {
    console.error("❌ Bound Multi-Groq Failed:", err.message || err);
  }
}

testMultiGroqBind();
