import fs from 'fs';
import path from 'path';
import { createVaathiAgent, formatMessages } from '../src/lib/vaathi/agent';

// Load .env.local
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

async function testFullVaathi() {
  console.log("=== STARTING FULL VAATHI AGENT VERIFICATION ===");
  console.log("Model in use:", process.env.GEMINI_MODEL || "gemini-flash-latest");
  console.log("API Key loaded:", process.env.GOOGLE_API_KEY ? "YES (starts with " + process.env.GOOGLE_API_KEY.slice(0, 8) + "...)" : "NO");

  const agent = createVaathiAgent();

  const testQueries = [
    {
      name: "1. SIP Calculation",
      query: "Calculate SIP for ₹5000/month at 12% for 10 years"
    },
    {
      name: "2. FD vs Mutual Fund Comparison",
      query: "I have ₹1 Lakh. Compare 7% FD vs 12% Mutual Fund for 5 years at 30% tax slab and 6% inflation"
    },
    {
      name: "3. Tax Regime Comparison",
      query: "I earn ₹12 LPA and have ₹1.5L in 80C. Which tax regime is better for me?"
    },
    {
      name: "4. Retirement Planning",
      query: "I am 30 years old, want to retire at 50 with monthly expense of ₹50,000. How much corpus do I need?"
    },
    {
      name: "5. Non-Finance Question (Guardrail Check)",
      query: "Who won the FIFA World Cup in 2022?"
    }
  ];

  for (const test of testQueries) {
    console.log(`\n----------------------------------------`);
    console.log(`RUNNING TEST: ${test.name}`);
    console.log(`User Query: "${test.query}"`);
    console.log(`----------------------------------------`);

    try {
      const messages = formatMessages([{ role: "user", content: test.query }]);
      const startTime = Date.now();
      const result = await agent.invoke({ messages });
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

      const toolMessages = result.messages.filter((m: any) => m.constructor?.name === "ToolMessage" || m._getType?.() === "tool");
      const aiMessages = result.messages.filter((m: any) => m._getType?.() === "ai" && m.content);
      const finalMsg = aiMessages[aiMessages.length - 1];

      console.log(`STATUS: SUCCESS (${elapsed}s)`);
      console.log(`Tools Called (${toolMessages.length}):`, toolMessages.map((t: any) => t.name || t.tool_call_id || "tool"));
      
      let content = "";
      if (typeof finalMsg?.content === "string") content = finalMsg.content;
      else if (Array.isArray(finalMsg?.content)) content = finalMsg.content.map((p: any) => p.text || String(p)).join("");
      else content = String(finalMsg?.content || "");

      console.log(`Response Snippet:\n`, content.slice(0, 300) + (content.length > 300 ? "..." : ""));
    } catch (err: any) {
      console.error(`STATUS: FAILED ❌`, err.message || err);
    }
  }

  console.log("\n=== VAATHI VERIFICATION COMPLETE ===");
}

testFullVaathi();
