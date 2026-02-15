import { config } from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Load environment variables from .env.local
config({ path: ".env.local" });

// Collect all available API keys
const apiKeys = [
    process.env.GEMINI_API_KEY_IMAGE_GENERATION,
    process.env.GEMINI_API_KEY_CHAT,
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_VOICE,
    process.env.GEMINI_API_KEY_PAPER,
    process.env.GEMINI_API_KEY_QUIZ,
    process.env.GEMINI_API_KEY_PAST_PAPER
].filter(Boolean) as string[];

console.log(`\n🔑 Found ${apiKeys.length} API keys configured\n`);

// Models to test
const modelsToTest = [
    "gemini-2.5-flash-image",
    "gemini-3-pro-image-preview",
    "gemini-2.0-flash-exp-image-generation",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-flash-latest",
];

async function testModel(modelName: string, apiKey: string, keyIndex: number) {
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: modelName });

        // Try a simple text generation
        const result = await model.generateContent("Test");
        const response = await result.response;
        const text = response.text();

        console.log(`✅ ${modelName} (Key ${keyIndex + 1}): Working - Response length: ${text.length} chars`);
        return true;
    } catch (err: any) {
        const status = err.status || 'unknown';
        const message = err.message || 'Unknown error';
        console.log(`❌ ${modelName} (Key ${keyIndex + 1}): ${status} - ${message.substring(0, 100)}`);
        return false;
    }
}

async function main() {
    console.log("🧪 Testing Gemini Models...\n");
    console.log("=".repeat(80));

    if (apiKeys.length === 0) {
        console.error("❌ No API keys found! Please check your .env.local file.");
        process.exit(1);
    }

    // Test each model with the first API key
    console.log("\n📋 Testing models with first API key:\n");
    for (const modelName of modelsToTest) {
        await testModel(modelName, apiKeys[0], 0);
    }

    // If multiple keys, test the first model with each key
    if (apiKeys.length > 1) {
        console.log("\n\n📋 Testing first model with all API keys:\n");
        for (let i = 0; i < apiKeys.length; i++) {
            await testModel(modelsToTest[0], apiKeys[i], i);
        }
    }

    console.log("\n" + "=".repeat(80));
    console.log("\n✨ Test complete!\n");
}

main().catch(console.error);
