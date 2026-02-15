import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const url = req.nextUrl.searchParams.get("url");

    if (!url) {
        return NextResponse.json({ error: "Missing URL parameter" }, { status: 400 });
    }

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);

        const blob = await response.blob();
        const headers = new Headers();
        headers.set("Content-Type", blob.type);
        headers.set("Access-Control-Allow-Origin", "*");

        return new NextResponse(blob, { headers });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
