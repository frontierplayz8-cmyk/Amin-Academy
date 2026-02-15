import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { sanitizeObject } from "@/lib/sanitize";

const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_CHAT || process.env.GEMINI_API_KEY_PAPER;
const genAI = new GoogleGenerativeAI(apiKey!);

export async function POST(req: Request) {
    if (!apiKey) {
        return NextResponse.json({ message: "AI Integration Offline (Missing Key)", success: false }, { status: 500 });
    }

    try {
        const body = await req.json();
        const { sectionType, action, prompt, context, currentContent, quantity } = sanitizeObject(body);

        if (!sectionType || !prompt) {
            return NextResponse.json({ message: "Incomplete request data", success: false }, { status: 400 });
        }

        const systemPrompt = `You are an expert BISE (Board of Intermediate and Secondary Education) Exam Paper Designer.
        Your task is to ${action === 'ADD_CONTENT' ? 'GENERATE NEW' : action === 'REPLACE_CONTENT' ? 'REPLACE' : 'IMPROVE/REPHRASE'} content for a ${sectionType} section in a ${context} exam.
        
        Rules:
        1. Format: Return ONLY valid JSON that matches the required schema. No Markdown blocks, no explanations.
        2. Language: Respect the context. If it's an Urdu paper, generate content in Urdu.
        3. Standard: Follow professional board examination standards (Pakistani style).
        4. Action Specifics:
           - ADD_CONTENT: Generate exactly ${quantity || 1} new items.
           - REPLACE_CONTENT: Replace existing content with ${quantity || 1} better items.
           - IMPROVE_CONTENT: Keep the core content but refine the professional tone, academic accuracy, and formatting. Do not change the quantity unless requested.
        5. Schema for ${sectionType}:
           - mcq_group: { questions: [{ en: string, ur: string, options: [{ en: string, ur: string }] }] }
           - subjective_q: { items: any[] } // depends on content type
           - short-questions-lessons: { items: string[] }
           - poetry-explanation: { items: [{ couplet: { en: string, ur: string }, context: string }] }
        
        Prompt: ${prompt}
        Quantity context: ${quantity || 'Original'}
        Current section content: ${JSON.stringify(currentContent).substring(0, 3000)}
        
        Generate exactly the requested content based on the action.`;

        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        const result = await model.generateContent(systemPrompt);
        const responseText = result.response.text();
        const parsed = JSON.parse(responseText);

        return NextResponse.json({
            success: true,
            data: parsed
        });

    } catch (error: any) {
        console.error("AI Section Action Error:", error);
        return NextResponse.json({
            success: false,
            message: "AI failed to process section request",
            error: error.message
        }, { status: 500 });
    }
}
