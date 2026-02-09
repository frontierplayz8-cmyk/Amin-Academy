import { NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"

export const PATCH = async (req: Request) => {
    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.split('Bearer ')[1]
        const decodedToken = await adminAuth.verifyIdToken(token)
        const uid = decodedToken.uid

        const { id, username, email, bio } = await req.json()

        // Security check: Ensure user is updating their own profile
        if (id !== uid) {
            return NextResponse.json({ message: "Forbidden: You can only update your own profile" }, { status: 403 });
        }

        const userRef = adminDb.collection('users').doc(id)
        const userDoc = await userRef.get()

        if (!userDoc.exists) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        const updateData: any = {}
        if (email) updateData.email = email
        if (username) updateData.username = username
        if (bio !== undefined) updateData.bio = bio

        await userRef.update(updateData)

        return NextResponse.json({
            success: true,
            message: "Profile updated!",
            user: {
                id,
                ...updateData
            }
        });

    } catch (error: any) {
        console.error("PATCH_UPDATE_ERROR:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}