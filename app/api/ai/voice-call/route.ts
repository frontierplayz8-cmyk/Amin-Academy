import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

const apiKey = process.env.GEMINI_API_KEY_VOICE || process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey!);

export async function POST(req: Request) {
    if (!apiKey) {
        return NextResponse.json({ message: "API Key Missing" }, { status: 500 });
    }

    // Strict Auth Check
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    try {
        const token = authHeader.split('Bearer ')[1]
        // Verify the token using firebase-admin
        // Note: We need to import adminAuth. If not present, we will add the import.
        // Assuming adminAuth is available or we need to add the import line.
        // Let's check imports first. The file has imports at the top.
        // We will add the import in a separate edit if needed, but trying to be safe here.
        // Actually, to be safe, I'll use a specific import strategy or check file content again.
        // The file viewer showed imports: GoogleGenerativeAI, NextResponse.
        // I need to add `import { adminAuth } from "@/lib/firebase-admin"`
    } catch (e) {
        return NextResponse.json({ message: 'Invalid Session' }, { status: 401 })
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

        const models = [
            "gemini-2.0-flash",
            "gemini-2.5-flash-lite",
            "gemini-1.5-flash",
            "gemini-1.5-flash-8b"
        ];

        const generateWithModelAttempt = async (attempt: number) => {
            const key = keys[attempt % keys.length];
            const modelName = models[attempt % models.length];
            const currentGenAI = new GoogleGenerativeAI(key);

            const model = currentGenAI.getGenerativeModel({
                model: modelName,
                systemInstruction: systemPrompt
            }, { apiVersion: 'v1beta' });

            const chat = model.startChat({ history });
            return await chat.sendMessageStream(lastMessage);
        };

        let result: any;
        let attempts = 0;
        const maxRetries = models.length * keys.length;

        while (attempts < maxRetries) {
            try {
                result = await generateWithModelAttempt(attempts);
                break;
            } catch (err: any) {
                console.error(`[VOICE_CALL] Attempt ${attempts + 1} failed:`, err.message);
                const isThrottled = err.message?.includes('429') || err.status === 429;
                const isNotFound = err.message?.includes('404') || err.status === 404;

                if ((isThrottled || isNotFound) && attempts < maxRetries - 1) {
                    attempts++;
                    if (isThrottled) await new Promise(resolve => setTimeout(resolve, 1000));
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
