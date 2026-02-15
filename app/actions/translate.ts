'use server'

import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY_PAPER || process.env.GEMINI_API_KEY;

export async function translateText(text: string, targetLang: string, sourceLang: string = 'auto'): Promise<string> {
    if (!apiKey) {
        console.error("GEMINI_API_KEY_PAPER or GEMINI_API_KEY is missing");
        throw new Error("Translation service not configured");
    }

    if (!text || !text.trim()) return "";

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `
        You are a professional translator. 
        Translate the following text from ${sourceLang === 'auto' ? 'detected language' : sourceLang} to ${targetLang}.
        
        IMPORTANT:
        - Return ONLY the translated text. 
        - Do not include any explanations, notes, or markdown formatting (unless the original text has it).
        - Maintain the original tone and meaning.
        - If the text is already in ${targetLang}, return it exactly as is.
        
        Text to translate:
        "${text}"
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text().trim();
    } catch (error) {
        console.error("Translation error:", error);
        throw new Error("Failed to translate text");
    }
}
