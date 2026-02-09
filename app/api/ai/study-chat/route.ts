import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const apiKey = process.env.GEMINI_API_KEY_CHAT || process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey!);

export async function POST(req: Request) {
    if (!apiKey) {
        return NextResponse.json({ message: "API Key Missing" }, { status: 500 });
    }

    try {
        const { messages, context } = await req.json();
        const { grade, subject, topic } = context;

        const systemPrompt = `Expert tutor for Amin Academy. Student: ${grade}, Subject: ${subject}, Topic: ${topic}.
        - Scaffolding: Lead to answers with probing Qs.
        - Practice: One MCQ at a time if requested.
        - Tone: Warm, natural, bilingual (English/Roman Urdu).
        - Concise: Max 3 sentences. Stay on ${topic}.`;

        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            systemInstruction: systemPrompt
        });

        const mappedHistory = messages.slice(0, -1).map((m: any) => ({
            role: m.role === 'ai' ? 'model' : 'user',
            parts: [{ text: m.content }],
        }));

        const truncatedHistory = mappedHistory.slice(-8);
        const firstUserIndex = truncatedHistory.findIndex((m: any) => m.role === 'user');
        const history = firstUserIndex === -1 ? [] : truncatedHistory.slice(firstUserIndex);
        const lastMessage = messages[messages.length - 1]?.content || `Let's start studying ${topic}.`;

        const keys = [
            process.env.GEMINI_API_KEY_CHAT,
            process.env.GEMINI_API_KEY,
            process.env.GEMINI_API_KEY_VOICE
        ].filter(Boolean) as string[];

        const getModelForAttempt = (attempt: number) => {
            const key = keys[attempt % keys.length];
            const currentGenAI = new GoogleGenerativeAI(key);
            const modelName = "gemini-2.5-flash-lite";
            return currentGenAI.getGenerativeModel({
                model: modelName,
                systemInstruction: systemPrompt
            }, { apiVersion: 'v1beta' });
        };

        let result: any;
        let attempts = 0;
        const maxRetries = 3;

        while (attempts < maxRetries) {
            try {
                const model = getModelForAttempt(attempts);
                const chat = model.startChat({ history });
                result = await chat.sendMessageStream(lastMessage);
                break;
            } catch (error: any) {
                const is429 = error.message?.includes('429') || error.status === 429;
                if (is429 && attempts < maxRetries - 1) {
                    attempts++;
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    continue;
                }
                throw error;
            }
        }

        if (!result) throw new Error("AI Generation Failed");

        const stream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();
                try {
                    for await (const chunk of result.stream) {
                        const chunkText = chunk.text();
                        controller.enqueue(encoder.encode(chunkText));
                    }
                } catch (err) {
                    controller.error(err);
                } finally {
                    controller.close();
                }
            },
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Transfer-Encoding": "chunked",
            },
        });

    } catch (error: any) {
        console.error("Study Chat Error:", error);

        // Handle Gemini Rate Limits (429)
        if (error.message?.includes('429') || error.status === 429) {
            return NextResponse.json({
                message: "Rate limit reached. Please wait a few seconds.",
                isThrottled: true
            }, { status: 429 });
        }

        return NextResponse.json({
            message: "The AI Tutor is currently busy.",
            error: error.message
        }, { status: 500 });
    }
}
