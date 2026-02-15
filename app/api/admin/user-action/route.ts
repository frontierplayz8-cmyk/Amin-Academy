import { NextResponse } from "next/server"
import admin, { adminAuth, adminDb } from "@/lib/firebase-admin"

export const PATCH = async (req: Request) => {
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

        const { userId, action } = await req.json()

        if (!userId || !action) {
            return NextResponse.json({ message: 'User ID and action are required' }, { status: 400 })
        }

        const userRef = adminDb.collection('users').doc(userId)
        const userDoc = await userRef.get()

        if (!userDoc.exists) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 })
        }

        if (action === 'ban') {
            await userRef.update({ status: 'banned', bannedAt: new Date().toISOString() })
            return NextResponse.json({ success: true, message: 'User banned successfully' })
        } else if (action === 'unban') {
            await userRef.update({ status: 'active', bannedAt: admin.firestore.FieldValue.delete() })
            return NextResponse.json({ success: true, message: 'User unbanned successfully' })
        } else {
            return NextResponse.json({ message: 'Invalid action' }, { status: 400 })
        }

    } catch (error) {
        console.error("User Action Error:", error)
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
    }
}

export const DELETE = async (req: Request) => {
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

        const { searchParams } = new URL(req.url)
        const userId = searchParams.get('userId')

        if (!userId) {
            return NextResponse.json({ message: 'User ID is required' }, { status: 400 })
        }

        // Delete from Auth
        try {
            await adminAuth.deleteUser(userId)
        } catch (e) {
            console.error("Auth Delete Error (continuing to DB):", e)
        }

        // Delete from Firestore
        await adminDb.collection('users').doc(userId).delete()

        return NextResponse.json({ success: true, message: 'User purged successfully' })

    } catch (error) {
        console.error("User Delete Error:", error)
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
    }
}
