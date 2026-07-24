const fs = require('fs');
const path = require('path');

// Read .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const match = envContent.match(/GOOGLE_API_KEY=(.+)/);
const apiKey = match ? match[1].trim() : '';

console.log("Using API key starting with:", apiKey.substring(0, 8) + "...");

async function listModels() {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await res.json();
    console.log("API Response Status:", res.status);
    if (data.models) {
      console.log("Available models:");
      data.models.forEach(m => {
        if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
          console.log(" -", m.name);
        }
      });
    } else {
      console.log("Full Response:", JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

listModels();
