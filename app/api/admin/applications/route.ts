import { NextRequest, NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"

export const GET = async (req: NextRequest) => {
    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.split('Bearer ')[1]
        const decodedToken = await adminAuth.verifyIdToken(token)
        const uid = decodedToken.uid

        // Check if requester is Principal
        const principalDoc = await adminDb.collection('users').doc(uid).get()
        const principal = principalDoc.data()

        if (!principalDoc.exists || principal?.ranks !== 'Principal') {
            return NextResponse.json({ message: 'Forbidden: Principals only' }, { status: 403 })
        }

        const snapshot = await adminDb.collection('teacher_applications').orderBy('submittedAt', 'desc').get()
        const applications = snapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data()
        }))

        return NextResponse.json({ success: true, applications })
    } catch (error: any) {
        console.error("Fetch Applications Error:", error)
        return NextResponse.json({ message: error.message }, { status: 500 })
    }
}
