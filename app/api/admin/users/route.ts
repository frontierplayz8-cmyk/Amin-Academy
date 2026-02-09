import { NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"

export const GET = async (req: Request) => {
    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.split('Bearer ')[1]
        const decodedToken = await adminAuth.verifyIdToken(token)
        const uid = decodedToken.uid

        const userDoc = await adminDb.collection('users').doc(uid).get()
        const currentUser = userDoc.data()

        if (!userDoc.exists || currentUser?.ranks !== 'Principal') {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
        }

        const usersSnapshot = await adminDb.collection('users').orderBy('createdAt', 'desc').get()
        const users = usersSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }))

        return NextResponse.json({
            success: true,
            users
        }, { status: 200 })

    } catch (error) {
        console.error("Fetch Users Error:", error)
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
    }
}
