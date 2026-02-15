const { GoogleGenerativeAI } = require("@google/generative-ai");

// Load .env.local manually if not in Next.js context
const fs = require('fs');
const path = require('path');
const envPath = path.resolve(__dirname, '.env.local');

const envConfig = require('dotenv').config({ path: envPath }).parsed;
const apiKey = envConfig.GEMINI_API_KEY_IMAGE_GENERATION || process.env.GEMINI_API_KEY_IMAGE_GENERATION;

if (!apiKey) {
    console.error("Error: GEMINI_API_KEY_IMAGE_GENERATION is missing.");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // arbitrary model to get client
        // Actually SDK doesn't expose listModels directly on genAI instance easily in some versions?
        // Let's use the REST API approach via fetch to be sure, using the key.

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        if (data.models) {
            console.log("Available Models:");
            data.models.forEach(m => {
                if (m.name.includes("image") || m.name.includes("gemini")) {
                    console.log(`- ${m.name} (${m.displayName})`);
                    console.log(`  Description: ${m.description}`);
                    console.log(`  Supported Methods: ${m.supportedGenerationMethods}`);
                    console.log('---');
                }
            });
        } else {
            console.log("No models found or error:", data);
        }
    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
