import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1]
        const decodedToken = await adminAuth.verifyIdToken(token)
        const uid = decodedToken.uid

        const userDoc = await adminDb.collection('users').doc(uid).get()
        const user = userDoc.data()

        if (!userDoc.exists) {
            return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
        }

        if (user?.ranks !== 'Student') {
            return NextResponse.json({ success: false, message: "Unauthorized access" }, { status: 403 });
        }

        const studentQuery = await adminDb.collection('students')
            .where('email', '==', user.email)
            .limit(1)
            .get()

        const studentProfile = !studentQuery.empty ? { id: studentQuery.docs[0].id, ...studentQuery.docs[0].data() } : null

        return NextResponse.json({
            success: true,
            user: { id: uid, ...user },
            profile: studentProfile
        });

    } catch (error: any) {
        return NextResponse.json({
            success: false,
            message: "Internal server error",
            error: error.message,
            code: error.code
        }, { status: 500 });
    }
}
