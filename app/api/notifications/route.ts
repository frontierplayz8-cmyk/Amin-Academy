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

        // "principal_admin" is the virtual ID for principal alerts
        // Otherwise use the user's UID
        const { searchParams } = new URL(req.url)
        const isAdmin = searchParams.get('admin') === 'true'
        const targetId = isAdmin ? 'principal_admin' : uid

        const snapshot = await adminDb.collection('notifications')
            .where('userId', '==', targetId)
            .orderBy('timestamp', 'desc')
            .limit(20)
            .get()

        const notifications = snapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data()
        }))

        return NextResponse.json({ success: true, notifications })
    } catch (error: any) {
        console.error("Fetch Notifications Error:", error)
        return NextResponse.json({ message: error.message }, { status: 500 })
    }
}

export const PATCH = async (req: NextRequest) => {
    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.split('Bearer ')[1]
        const decodedToken = await adminAuth.verifyIdToken(token)
        const uid = decodedToken.uid

        const { notificationId } = await req.json()

        if (!notificationId) {
            return NextResponse.json({ message: 'Notification ID required' }, { status: 400 })
        }

        await adminDb.collection('notifications').doc(notificationId).update({ status: 'read' })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error("Update Notification Error:", error)
        return NextResponse.json({ message: error.message }, { status: 500 })
    }
}
