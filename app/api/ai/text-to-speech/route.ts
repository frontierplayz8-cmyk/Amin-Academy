import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { text, voiceId } = await req.json();
        const keys = [
            process.env.GEMINI_API_KEY,
            process.env.GEMINI_API_KEY_CHAT,
            process.env.GEMINI_API_KEY_VOICE
        ].filter(Boolean) as string[];

        // Use a semi-random key for TTS to avoid collision with chat/voice
        const apiKeyToUse = keys[Math.floor(Math.random() * keys.length)];
        // Use gemini-2.5-flash-preview-tts (confirmed working for standard AUDIO modality)
        const modelName = "gemini-2.5-flash-preview-tts";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKeyToUse}`;


        const payload = {
            contents: [
                {
                    parts: [
                        { text: text }
                    ]
                }
            ],
            generationConfig: {
                responseModalities: ["AUDIO"],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: {
                            voiceName: voiceId || "Leda"
                        }
                    }
                }
            }
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json({ message: "Gemini Audio API Error", error: errorText }, { status: response.status });
        }

        const data = await response.json();

        // Extract audio from response
        if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts) {
            const part = data.candidates[0].content.parts[0];
            if (part.inlineData && part.inlineData.mimeType.includes("audio")) {
                const audioBase64 = part.inlineData.data;
                const audioBuffer = Buffer.from(audioBase64, 'base64');

                return new NextResponse(audioBuffer, {
                    headers: {
                        "Content-Type": "audio/wav",
                    },
                });
            }
        }

        return NextResponse.json({ message: "No audio generated" }, { status: 500 });

    } catch (error: any) {
        return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
    }
}
