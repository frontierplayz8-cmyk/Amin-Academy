import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const apiKey = process.env.GEMINI_API_KEY_VOICE || process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey!);

export async function POST(req: Request) {
    if (!apiKey) {
        return NextResponse.json({ message: "API Key Missing" }, { status: 500 });
    }

    try {
        const { messages, context } = await req.json();
        const { grade, subject, topic } = context;

        const systemPrompt = `Expert tutor (VOICE). Student: ${grade}, Topic: ${topic}.
        - Rule: Max 15 words. Concise. Bilingual (English/Roman Urdu).
        - Instructions: Answer briefly, ask ONE short Q. No lectures.`;

        const mappedHistory = messages.slice(0, -1).map((m: any) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
        }));

        const truncatedHistory = mappedHistory.slice(-4);
        const firstUserIndex = truncatedHistory.findIndex((m: any) => m.role === 'user');
        const history = firstUserIndex === -1 ? [] : truncatedHistory.slice(firstUserIndex);
        const lastMessage = messages[messages.length - 1]?.content || `Let's start studying ${topic}.`;

        const keys = [
            process.env.GEMINI_API_KEY_VOICE,
            process.env.GEMINI_API_KEY,
            process.env.GEMINI_API_KEY_CHAT
        ].filter(Boolean) as string[];

        const getGenAIForAttempt = (attempt: number) => {
            const key = keys[attempt % keys.length];
            return new GoogleGenerativeAI(key);
        };

        const generateWithModel = async (modelName: string, attempt: number) => {
            const currentGenAI = getGenAIForAttempt(attempt);
            const model = currentGenAI.getGenerativeModel({
                model: modelName,
                systemInstruction: systemPrompt
            }, { apiVersion: 'v1beta' });

            const chat = model.startChat({ history });
            return await chat.sendMessageStream(lastMessage);
        };

        let result: any;
        let attempts = 0;
        const maxRetries = 3; // 4 attempts total

        while (attempts < maxRetries) {
            try {
                // gemini-2.5-flash-lite is the optimized model for this environment
                const modelToUse = "gemini-2.5-flash-lite";
                result = await generateWithModel(modelToUse, attempts);
                break;
            } catch (err: any) {
                const is429 = err.message?.includes('429') || err.status === 429;
                if (is429 && attempts < maxRetries - 1) {
                    attempts++;
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    continue;
                }
                throw err;
            }
        }

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

        if (error.message?.includes('429') || error.status === 429) {
            return NextResponse.json({
                message: "Rate limit reached. Please wait a moment.",
                isThrottled: true
            }, { status: 429 });
        }

        return NextResponse.json({
            message: "The AI Tutor is currently unavailable.",
            error: error.message
        }, { status: 500 });
    }
}
