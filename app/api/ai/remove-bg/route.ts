import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const apiKey = process.env.REMOVE_BG;

    if (!apiKey) {
        return NextResponse.json({
            error: "REMOVE_BG API Key is missing."
        }, { status: 500 });
    }

    try {
        const { image } = await req.json();

        if (!image) {
            return NextResponse.json({ error: "No image provided" }, { status: 400 });
        }

        console.log("✂️ Removing Background via remove.bg API...");

        // remove.bg expects base64 without the data:image/png;base64, prefix
        const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

        const response = await fetch("https://api.remove.bg/v1.0/removebg", {
            method: "POST",
            headers: {
                "X-Api-Key": apiKey,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                image_file_b64: base64Data,
                size: "auto",
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`remove.bg API Error: ${response.status} - ${errorText}`);
        }

        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Output = `data:image/png;base64,${buffer.toString("base64")}`;

        console.log("✅ Background Removed successfully");

        return NextResponse.json({
            success: true,
            image: base64Output
        });

    } catch (error: any) {
        console.error("Remove BG Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
