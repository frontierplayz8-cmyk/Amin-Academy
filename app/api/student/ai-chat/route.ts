import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { sanitizeObject } from "@/lib/sanitize";

export async function POST(req: Request) {
    const keys = [
        process.env.GEMINI_API_KEY_CHAT,
        process.env.GEMINI_API_KEY,
        process.env.GEMINI_API_KEY_VOICE,
        process.env.GEMINI_API_KEY_PAPER
    ].filter(Boolean) as string[];

    if (keys.length === 0) {
        return NextResponse.json({ message: "API Key Missing" }, { status: 500 });
    }

    try {
        const body = await req.json();
        const { messages, context } = sanitizeObject(body);
        const { grade, subject, topic } = context;

        const systemPrompt = `Expert tutor for Amin Academy. Student: ${grade}, Subject: ${subject}, Topic: ${topic}.
        - Scaffolding: Lead to answers with probing Qs.
        - Practice: One MCQ at a time if requested.
        - Math formatting: ALWAYS use LaTeX for math. Use $...$ for inline and $$...$$ for block math.
        - Tone: Warm, natural, bilingual (English/Roman Urdu).
        - Concise: Max 3 sentences. Stay on ${topic}.`;

        const models = [
            "gemini-2.0-flash",
            "gemini-2.5-flash-lite",
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
                const genAI = new GoogleGenerativeAI(key);

                const model = genAI.getGenerativeModel({
                    model: modelName,
                    systemInstruction: systemPrompt
                });

                const mappedHistory = messages.slice(0, -1).map((m: any) => ({
                    role: m.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: m.content }],
                }));

                const truncatedHistory = mappedHistory.slice(-10);
                const firstUserIndex = truncatedHistory.findIndex((m: any) => m.role === 'user');
                const history = firstUserIndex === -1 ? [] : truncatedHistory.slice(firstUserIndex);

                const chat = model.startChat({
                    history: history,
                });

                const lastMessage = messages[messages.length - 1].content;
                const resultStream = await chat.sendMessageStream(lastMessage);

                const stream = new ReadableStream({
                    async start(controller) {
                        try {
                            const encoder = new TextEncoder();
                            for await (const chunk of resultStream.stream) {
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
                    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
                });
            } catch (error: any) {
                console.error(`[STUDY_CHAT_JSON] Attempt ${attempts + 1} failed:`, error.message);
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

        return NextResponse.json({ message: result });

    } catch (error: any) {
        console.error("Student AI Chat Error:", error);
        return NextResponse.json({
            message: "The AI Tutor is currently busy. Please try again in a moment.",
            error: error.message
        }, { status: 500 });
    }
}
