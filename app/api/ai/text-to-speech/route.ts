import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { text, voiceId } = await req.json();
        const keys = [
            process.env.GEMINI_API_KEY,
            process.env.GEMINI_API_KEY_CHAT,
            process.env.GEMINI_API_KEY_VOICE
        ].filter(Boolean) as string[];

        const modelName = "gemini-2.5-flash-preview-tts";
        const payload = {
            contents: [{ parts: [{ text: text }] }],
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

        let response: any;
        let attempts = 0;
        const maxRetries = keys.length;

        while (attempts < maxRetries) {
            try {
                const apiKeyToUse = keys[attempts % keys.length];
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKeyToUse}`;

                response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (response.ok) break;

                const errorText = await response.text();
                console.error(`[TTS] Attempt ${attempts + 1} failed:`, errorText);

                if ((response.status === 429 || response.status === 404) && attempts < maxRetries - 1) {
                    attempts++;
                    if (response.status === 429) await new Promise(resolve => setTimeout(resolve, 1000));
                    continue;
                }

                return NextResponse.json({ message: "Gemini Audio API Error", error: errorText }, { status: response.status });
            } catch (error: any) {
                console.error(`[TTS] Request error on attempt ${attempts + 1}:`, error.message);
                if (attempts < maxRetries - 1) {
                    attempts++;
                    continue;
                }
                throw error;
            }
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
