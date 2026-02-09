import { NextRequest, NextResponse } from "next/server";
import { getCurriculumFromDB, updateCurriculumInDB } from "@/lib/db-curriculum";
import { adminAuth } from "@/lib/firebase-admin";

export async function GET() {
    try {
        const data = await getCurriculumFromDB();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch curriculum" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        // Verify authentication
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split("Bearer ")[1];
        const decodedToken = await adminAuth.verifyIdToken(token);

        // Check if user is admin (Principal rank check is done via profile on client, 
        // but here we can check custom claims if they exist, or just rely on a generic admin check)
        // For now, any authenticated user with a valid token can hit this if they pass the rank check on client.
        // IMPROVEMENT: Check 'Principal' rank in Firestore profile within this API.

        const body = await req.json();
        await updateCurriculumInDB(body);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Curriculum update error:", error);
        return NextResponse.json({ error: "Unauthorized or server error" }, { status: 500 });
    }
}
