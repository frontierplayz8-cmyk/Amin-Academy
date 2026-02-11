import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { sanitizeObject } from "@/lib/sanitize";

const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_CHAT;
const genAI = new GoogleGenerativeAI(apiKey!);

export async function POST(req: Request) {
    if (!apiKey) {
        return NextResponse.json({ message: "API Key Missing", success: false }, { status: 500 });
    }

    try {
        const body = await req.json();
        const { text, context } = sanitizeObject(body);

        if (!text) {
            return NextResponse.json({ message: "No text provided", success: false }, { status: 400 });
        }

        const systemPrompt = `You are an expert BISE (Board of Intermediate and Secondary Education) Exam Paper Architect.
        Your task is to REPHRASE the provided text into professional, board-standard terminology for a ${context} exam.
        - Rules:
        1. Maintain the original meaning perfectly.
        2. Use formal, academic language suitable for Pakistani board exams.
        3. If the input is in Urdu or has Urdu parts, rephrase the Urdu professionally as well.
        4. Keep it concise and clear.
        5. Return ONLY the rephrased text. No conversational filler.`;

        const keys = [
            process.env.GEMINI_API_KEY,
            process.env.GEMINI_API_KEY_CHAT,
            process.env.GEMINI_API_KEY_PAPER
        ].filter(Boolean) as string[];

        const models = [
            "gemini-2.0-flash",
            "gemini-1.5-flash",
            "gemini-1.5-flash-8b"
        ];

        let result: any;
        let attempts = 0;
        const maxRetries = models.length * keys.length;

        while (attempts < maxRetries) {
            try {
                const key = keys[attempts % keys.length];
                const modelName = models[attempts % models.length];
                const currentGenAI = new GoogleGenerativeAI(key);
                const model = currentGenAI.getGenerativeModel({
                    model: modelName,
                    systemInstruction: systemPrompt
                });

                result = await model.generateContent(text);
                break;
            } catch (error: any) {
                console.error(`[ARCHITECT_IMPROVE] Attempt ${attempts + 1} failed:`, error.message);
                const isThrottled = error.message?.includes('429') || error.status === 429;
                const isNotFound = error.message?.includes('404') || error.status === 404;

                if ((isThrottled || isNotFound) && attempts < maxRetries - 1) {
                    attempts++;
                    if (isThrottled) await new Promise(resolve => setTimeout(resolve, 1000));
                    continue;
                }
                throw error;
            }
        }

        const rephrasedText = result.response.text().trim();

        return NextResponse.json({
            success: true,
            improvedText: rephrasedText
        });

    } catch (error: any) {
        console.error("Architect AI Error:", error);
        return NextResponse.json({
            success: false,
            message: "AI Improvement Service Error",
            error: error.message
        }, { status: 500 });
    }
}
