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

        if (!userDoc.exists) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 })
        }

        return NextResponse.json({
            success: true,
            user: { id: userDoc.id, ...userDoc.data() }
        })

    } catch (error) {
        console.error("Profile Fetch Error:", error)
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
    }
}

export const PATCH = async (req: Request) => {
    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.split('Bearer ')[1]
        const decodedToken = await adminAuth.verifyIdToken(token)
        const uid = decodedToken.uid

        const body = await req.json()
        const { username, bio, imageUrl } = body

        const updates: any = {}
        if (username) updates.username = username
        if (bio !== undefined) updates.bio = bio
        if (imageUrl) updates.imageUrl = imageUrl
        updates.updatedAt = new Date().toISOString()

        await adminDb.collection('users').doc(uid).update(updates)

        return NextResponse.json({
            success: true,
            message: 'Profile updated successfully'
        })

    } catch (error) {
        console.error("Profile Update Error:", error)
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
    }
}
