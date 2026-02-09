import { NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"

export const DELETE = async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.split('Bearer ')[1]
        const decodedToken = await adminAuth.verifyIdToken(token)
        const principalId = decodedToken.uid

        const principalDoc = await adminDb.collection('users').doc(principalId).get()
        const principal = principalDoc.data()

        if (!principalDoc.exists || principal?.ranks !== 'Principal') {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
        }

        const { id: userId } = await params

        if (userId === principalId) {
            return NextResponse.json({ message: 'Cannot terminate your own node' }, { status: 400 })
        }

        // Delete from Firestore
        await adminDb.collection('users').doc(userId).delete()

        // Delete from Auth
        try {
            await adminAuth.deleteUser(userId)
        } catch (authError) {
            console.warn("User already deleted from Auth or not found", authError)
        }

        return NextResponse.json({
            success: true,
            message: 'Faculty node terminated and purged'
        }, { status: 200 })

    } catch (error) {
        console.error("Staff Termination Error:", error)
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
    }
}
