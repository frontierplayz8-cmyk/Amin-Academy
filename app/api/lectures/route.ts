import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";

// GET: Fetch all lectures (with search/filter)
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const subject = searchParams.get("subject");
        const topic = searchParams.get("topic");
        const search = searchParams.get("search");

        const adminDb = getAdminDb();
        if (!adminDb) {
            return NextResponse.json({ success: false, error: "Database not initialized" }, { status: 503 });
        }
        let lecturesRef: any = adminDb.collection('lectures');

        if (subject && subject !== "All Subjects") {
            lecturesRef = lecturesRef.where('subject', '==', subject);
        }
        if (topic && topic !== "All Topics") {
            lecturesRef = lecturesRef.where('topic', '==', topic);
        }

        const snapshot = await (lecturesRef as any).orderBy('createdAt', 'desc').get();
        let lectures = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));

        // Simple in-memory search for title/description/topic
        if (search) {
            const lowSearch = search.toLowerCase();
            lectures = lectures.filter((l: any) =>
                l.title?.toLowerCase().includes(lowSearch) ||
                l.description?.toLowerCase().includes(lowSearch) ||
                l.topic?.toLowerCase().includes(lowSearch)
            );
        }

        return NextResponse.json({ success: true, lectures });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// POST: Create a new lecture
export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json();

        // Basic validation
        if (!body.title || !body.subject || !body.videoUrl) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        const lectureData = {
            ...body,
            createdAt: new Date().toISOString()
        }

        const adminDb = getAdminDb();
        if (!adminDb) {
            return NextResponse.json({ success: false, error: "Database not initialized" }, { status: 503 });
        }
        const newLectureRef = await adminDb.collection('lectures').add(lectureData);

        return NextResponse.json({ success: true, lecture: { id: newLectureRef.id, ...lectureData } }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// DELETE: Remove a lecture
export async function DELETE(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.split(' ')[1]
        const adminAuth = getAdminAuth()
        const adminDb = getAdminDb()

        if (!adminAuth || !adminDb) {
            return NextResponse.json({ success: false, error: "Database not initialized" }, { status: 503 });
        }

        const decodedToken = await adminAuth.verifyIdToken(token)
        const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get()
        const userData = userDoc.data()

        if (userData?.ranks !== 'Principal') {
            return NextResponse.json({ success: false, error: "Unauthorized: Only Principals can purge content nodes" }, { status: 403 })
        }

        const { searchParams } = new URL(req.url);
        const lectureId = searchParams.get("id");

        if (!lectureId) {
            return NextResponse.json({ success: false, error: "Missing lecture ID" }, { status: 400 });
        }

        await adminDb.collection('lectures').doc(lectureId).delete();

        return NextResponse.json({ success: true, message: "Lecture purged from library" });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
