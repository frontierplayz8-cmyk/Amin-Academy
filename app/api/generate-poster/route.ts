import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Utility function for exponential backoff
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Collect all available API keys for rotation
const apiKeys = [
    process.env.GEMINI_API_KEY_CHAT,
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_PAPER,
].filter(Boolean) as string[];

export async function POST(req: Request) {
    if (apiKeys.length === 0) {
        return NextResponse.json({ error: "Gemini API Keys are missing in environment variables." }, { status: 500 });
    }

    try {
        const {
            text_prompt,
            style,
            color_palette,
            aspect_ratio,
            use_ai_suggestions = false
        } = await req.json();

        // For Canvas-based generation, we can optionally use AI for design suggestions
        if (use_ai_suggestions) {
            return await generateAIDesignSuggestions(text_prompt, style, color_palette, aspect_ratio);
        }

        // Return success for client-side Canvas generation
        return NextResponse.json({
            useClientSide: true,
            message: "Use PosterCanvas component for client-side generation",
            config: {
                title: text_prompt,
                style,
                colorPalette: color_palette,
                aspectRatio: aspect_ratio
            }
        });

    } catch (error: any) {
        console.error("Poster Generation Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

async function generateAIDesignSuggestions(
    topic: string,
    style: string,
    colorPalette: string,
    aspectRatio: string
) {
    // Working text models for design suggestions
    const models = [
        "gemini-2.5-flash",
        "gemini-flash-latest",
    ];

    let result: any;
    let attemptCount = 0;
    const maxAttempts = 3;
    const errorLog: string[] = [];

    const prompt = `You are a professional poster designer for Amin Academy. Generate detailed design suggestions for a poster with the following requirements:

Topic: ${topic}
Style: ${style}
Color Palette: ${colorPalette}
Aspect Ratio: ${aspectRatio}

Provide specific recommendations for:
1. Title text (catchy, educational, max 60 characters)
2. Subtitle (optional, complementary, max 40 characters)
3. Main content (2-3 key points or a brief description, max 150 characters)
4. Visual elements to emphasize
5. Typography recommendations

Respond in JSON format:
{
  "title": "...",
  "subtitle": "...",
  "content": "...",
  "visualElements": ["...", "..."],
  "typography": "..."
}`;

    while (attemptCount < maxAttempts) {
        const currentModel = models[attemptCount % models.length];
        const currentKey = apiKeys[attemptCount % apiKeys.length];

        try {
            const genAI = new GoogleGenerativeAI(currentKey);
            const model = genAI.getGenerativeModel({
                model: currentModel,
                generationConfig: {
                    temperature: 0.8,
                    maxOutputTokens: 1024,
                }
            });

            result = await model.generateContent(prompt);
            console.log(`✅ AI suggestions generated with ${currentModel}`);
            break;
        } catch (err: any) {
            const errStatus = err.status || 500;
            const errMessage = err.message || 'Unknown error';
            errorLog.push(`${currentModel}: ${errStatus} - ${errMessage}`);

            console.warn(`⚠️ Attempt ${attemptCount + 1}/${maxAttempts} failed`);

            if (errStatus === 429 && attemptCount < maxAttempts - 1) {
                const delayMs = 1000 * Math.pow(2, attemptCount);
                await sleep(delayMs);
            }

            attemptCount++;
        }
    }

    if (!result) {
        // Fallback to basic suggestions if AI fails
        return NextResponse.json({
            useClientSide: true,
            aiSuggestions: {
                title: topic,
                subtitle: `${style.charAt(0).toUpperCase() + style.slice(1)} Design`,
                content: "Educational excellence at Amin Academy",
                visualElements: ["Clean layout", "Professional typography"],
                typography: "Modern sans-serif fonts"
            },
            fallback: true,
            message: "Using fallback suggestions (AI unavailable)"
        });
    }

    try {
        const response = await result.response;
        const textContent = response.text();

        // Try to parse JSON from response
        const jsonMatch = textContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const suggestions = JSON.parse(jsonMatch[0]);
            return NextResponse.json({
                useClientSide: true,
                aiSuggestions: suggestions,
                message: "AI-powered design suggestions generated"
            });
        }
    } catch (parseError) {
        console.error("Failed to parse AI response:", parseError);
    }

    // Fallback if parsing fails
    return NextResponse.json({
        useClientSide: true,
        aiSuggestions: {
            title: topic,
            subtitle: "",
            content: "Professional academic poster design",
            visualElements: [],
            typography: "Clean and modern"
        },
        fallback: true,
        message: "Using fallback suggestions (parsing failed)"
    });
}
