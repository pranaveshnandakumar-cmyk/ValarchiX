const fs = require('fs');
const path = require('path');
const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { createReactAgent } = require('@langchain/langgraph/prebuilt');
const { HumanMessage, SystemMessage } = require('@langchain/core/messages');
const { vaathiTools } = require('../src/lib/vaathi/tools');
const { VAATHI_SYSTEM_PROMPT } = require('../src/lib/vaathi/system-prompt');

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const match = envContent.match(/GOOGLE_API_KEY=(.+)/);
const apiKey = match ? match[1].trim() : '';

process.env.GOOGLE_API_KEY = apiKey;

async function testAgent() {
  console.log("Testing agent with gemini-flash-latest...");
  try {
    const llm = new ChatGoogleGenerativeAI({
      model: "gemini-flash-latest",
      apiKey: apiKey,
      temperature: 0.7,
    });

    const agent = createReactAgent({
      llm,
      tools: vaathiTools,
    });

    const result = await agent.invoke({
      messages: [
        new SystemMessage(VAATHI_SYSTEM_PROMPT),
        new HumanMessage("Calculate SIP for ₹5000/month at 12% for 10 years")
      ]
    });

    console.log("Agent result message count:", result.messages.length);
    const lastMsg = result.messages[result.messages.length - 1];
    console.log("Final Response:\n", lastMsg.content);
  } catch (err) {
    console.error("Agent FAILED:", err);
  }
}

testAgent();
