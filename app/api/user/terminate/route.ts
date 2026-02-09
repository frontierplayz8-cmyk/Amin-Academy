import { NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"

export const DELETE = async (req: Request) => {
    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.split('Bearer ')[1]
        const decodedToken = await adminAuth.verifyIdToken(token)
        const uid = decodedToken.uid

        // Delete Firestore user document
        await adminDb.collection('users').doc(uid).delete()

        // Delete Auth user
        await adminAuth.deleteUser(uid)

        return NextResponse.json(
            { message: 'Account terminated successfully', success: true },
            { status: 200 }
        )

    } catch (error: any) {
        console.error("Account Termination Error:", error)
        return NextResponse.json(
            { message: "Failed to terminate account", success: false },
            { status: 500 }
        )
    }
}
