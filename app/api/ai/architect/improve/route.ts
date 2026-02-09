import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_CHAT;
const genAI = new GoogleGenerativeAI(apiKey!);

export async function POST(req: Request) {
    if (!apiKey) {
        return NextResponse.json({ message: "API Key Missing", success: false }, { status: 500 });
    }

    try {
        const { text, context } = await req.json();

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

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: systemPrompt
        });

        const result = await model.generateContent(text);
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
