'use server'

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, DynamicRetrievalMode } from "@google/generative-ai";
import * as puter from "puter";

// Load feature-specific key
const apiKey = process.env.GEMINI_API_KEY_PAPER || process.env.GEMINI_API_KEY;

export async function generateTestInternet(config: any) {
    if (!apiKey) throw new Error("GEMINI_API_KEY_PAPER Missing. Please check your environment variables.");

    const genAI = new GoogleGenerativeAI(apiKey);
    const systemPrompt = config.systemPrompt;
    const userPrompt = "Generate the complete exam paper based on the system instructions. Focus on high accuracy and professional Urdu script. Return raw JSON.";

    const safetySettings = [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ];

    const modelBattery = [
        { name: "gemini-2.0-flash" },
        { name: "gemini-2.0-flash-001" },
        { name: "gemini-2.5-flash" },
    ];

    let errorDetails: string[] = [];

    for (const node of modelBattery) {
        const modelName = node.name;
        try {
            if (modelName === "PUTER_AI") {
                const puterLib = puter as any;
                if (!puterLib.ai && !puterLib.default?.ai) {
                    errorDetails.push("PUTER_AI: Library not initialized correctly.");
                    continue;
                }
                const ai = puterLib.ai || puterLib.default.ai;
                const response = await ai.chat(`${systemPrompt}\n\n${userPrompt}`, { model: 'claude-3-5-sonnet' });
                return response.toString();
            }

            const model = genAI.getGenerativeModel({
                model: modelName,
                tools: [{ googleSearch: {} } as any], // Cast to any to bypass SDK type definition lag
                safetySettings,
                generationConfig: {
                    temperature: 0.1, // Ultra-low temperature for strict extraction
                    maxOutputTokens: 8192,
                }
            });

            const fullPrompt = `INSTRUCTIONS:\n${systemPrompt}\n\nUSER REQUEST:\n${userPrompt}`;

            const result = await model.generateContent(fullPrompt);
            const response = await result.response;
            const text = response.text();

            if (!text || text.length < 50) {
                throw new Error("Validation failure: AI response too short.");
            }

            return text;

        } catch (error: any) {
            const msg = error.message || "Unknown error";
            errorDetails.push(`${modelName}: ${msg}`);
            continue;
        }
    }

    throw new Error(`CRITICAL ENGINE FAILURE:\n${errorDetails.join("\n")}`);
}
