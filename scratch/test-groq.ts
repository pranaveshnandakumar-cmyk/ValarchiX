import fs from 'fs';
import path from 'path';
import { createVaathiAgent, formatMessages } from '../src/lib/vaathi/agent';

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

async function testGroqLocal() {
  console.log("=== TESTING VAATHI AGENT WITH GROQ API KEY ===");
  console.log("GROQ_API_KEY:", process.env.GROQ_API_KEY ? "LOADED (" + process.env.GROQ_API_KEY.slice(0, 10) + "...)" : "NOT FOUND");

  const agent = createVaathiAgent();
  const query = "I need ₹50 lakhs in 10 years, how much SIP?";

  try {
    const messages = formatMessages([{ role: "user", content: query }]);
    const startTime = Date.now();
    const result = await agent.invoke({ messages });
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    const toolMessages = result.messages.filter((m: any) => m.constructor?.name === "ToolMessage" || m._getType?.() === "tool");
    const aiMessages = result.messages.filter((m: any) => m._getType?.() === "ai" && m.content);
    const finalMsg = aiMessages[aiMessages.length - 1];

    console.log(`\n✅ GROQ SUCCESS! (Execution time: ${elapsed}s)`);
    console.log(`Tools Called:`, toolMessages.map((t: any) => t.name || "tool"));

    let content = "";
    if (typeof finalMsg?.content === "string") content = finalMsg.content;
    else if (Array.isArray(finalMsg?.content)) content = finalMsg.content.map((p: any) => p.text || String(p)).join("");
    else content = String(finalMsg?.content || "");

    console.log(`\nGroq AI Response Output:\n`, content.slice(0, 400));
  } catch (err: any) {
    console.error("❌ Groq Test Failed:", err.message || err);
  }
}

testGroqLocal();
