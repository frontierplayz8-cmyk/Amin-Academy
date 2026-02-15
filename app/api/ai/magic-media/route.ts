import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
    try {
        const { text_prompt, style } = await req.json();

        // 1. Validate Keys (Only need Gemini Chat for enhancement)
        const geminiKey = process.env.GEMINI_API_KEY_CHAT;

        if (!geminiKey) {
            return NextResponse.json(
                { error: "Configuration Error: Missing GEMINI_API_KEY_CHAT." },
                { status: 500 }
            );
        }

        // 2. Enhance Prompt with Gemini 1.5 Pro
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

        let enhancedPrompt = text_prompt;

        // Simple style mapping for the prompt enhancer
        const styleModifiers: any = {
            "Nano Banana": "hyper-realistic, 8k resolution, ray tracing, highly detailed, photorealistic, cinematic lighting, sharp focus, masterpiece",
            "Neon Cyberpunk": "cyberpunk, neon lights, futuristic city, high contrast, vibrant colors",
            "Watercolor": "watercolor painting, soft edges, artistic, pastel colors, paper texture",
            "Oil Painting": "oil painting, textured brushstrokes, classical art style, expressive",
            "3D Render": "3D render, blender, octave render, unreal engine 5, plastic texture, claymation",
            "Pop Art": "pop art, halftone dots, bold outlines, comic book style, Andy Warhol style"
        };

        const modifier = styleModifiers[style] || "high quality, detailed";

        try {
            const promptResult = await model.generateContent(`
                Enhance this image generation prompt to be descriptive and optimized for Flux/Stable Diffusion text-to-image.
                Original Prompt: "${text_prompt}"
                Style: "${modifier}"
                
                Keep it under 100 words. Return ONLY the enhanced prompt text.
            `);
            enhancedPrompt = promptResult.response.text().trim();
        } catch (e) {
            console.warn("Prompt enhancement failed, using original.", e);
            enhancedPrompt = `${text_prompt}, ${modifier}`;
        }

        // 3. Generate Image via Pollinations.ai (Free, Unlimited)
        // We return the URL directly so the client browser fetches it. 
        // This avoids server-side timeouts and allows for faster perceived performance.
        const seed = Math.floor(Math.random() * 1000000);
        // Using 'image.pollinations.ai' for direct image return with nologo
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=1024&height=1024&model=flux&seed=${seed}&nologo=true`;

        console.log(`🎨 Generated Pollinations URL: ${imageUrl}`);

        return NextResponse.json({
            success: true,
            images: [imageUrl], // Return URL directly
            prompt: enhancedPrompt
        });

    } catch (error: any) {
        console.error("Magic Media Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to generate image" },
            { status: 500 }
        );
    }
}
