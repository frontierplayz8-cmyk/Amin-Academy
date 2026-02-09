
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

// Load .env.local from the root directory
const envPath = path.join(process.cwd(), ".env.local");
dotenv.config({ path: envPath });

async function verifyAI() {
    console.log("🚀 Initializing Multi-Key Gemini Verification...\n");

    if (!fs.existsSync(envPath)) {
        console.error("❌ .env.local not found!");
        process.exit(1);
    }

    // 1. Extract all Gemini keys from .env.local
    const envContent = fs.readFileSync(envPath, "utf-8");
    const keyLines = envContent.split("\n")
        .map(line => line.trim())
        .filter(line => line.startsWith("GEMINI_API_KEY"));

    if (keyLines.length === 0) {
        console.error("❌ No GEMINI_API_KEY variables found in .env.local");
        process.exit(1);
    }

    const modelsToTest = [
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gemini-2.0-flash-thinking-preview"
    ];

    console.log("⚠️  Note: 429 error = Project Free Tier quota exhausted (1500 RPD / 10 RPM).");
    console.log("⚠️  Note: 404 error = Model name mismatch or not enabled for this specific key.\n");

    for (const line of keyLines) {
        const [keyName, keyValue] = line.split("=").map(s => s.trim());
        if (!keyValue) continue;

        console.log(`🔑 Testing Key: ${keyName} (${keyValue.substring(0, 12)}...)`);
        const genAI = new GoogleGenerativeAI(keyValue);

        for (const modelName of modelsToTest) {
            const variants = [modelName, `models/${modelName}`];
            let found = false;
            let lastError = "";

            for (const variant of variants) {
                try {
                    const model = genAI.getGenerativeModel({ model: variant });
                    const result = await model.generateContent("Test");
                    const response = await result.response;
                    if (response.text()) {
                        console.log(`   ✅ ${modelName}: [OK] (via ${variant})`);
                        found = true;
                        break;
                    }
                } catch (err: any) {
                    lastError = err.message || "Unknown";
                    if (lastError.includes("429")) {
                        console.log(`   ❌ ${modelName}: [QUOTA HIT 429]`);
                        found = true;
                        break;
                    }
                    if (lastError.includes("403")) {
                        console.log(`   ❌ ${modelName}: [PERMISSION 403]`);
                        found = true;
                        break;
                    }
                }
            }

            if (!found) {
                console.log(`   ❌ ${modelName}: [NOT FOUND 404]`);
            }
        }
        console.log("");
    }

    console.log("✨ Verification Complete.");
}

verifyAI();
