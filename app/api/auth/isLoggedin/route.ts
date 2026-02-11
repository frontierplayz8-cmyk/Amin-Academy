import { NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"

export const GET = async (req: Request) => {
    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ message: 'Not Logged in', success: false }, { status: 401 })
        }

        const token = authHeader.split('Bearer ')[1]
        const decodedToken = await adminAuth.verifyIdToken(token)
        const uid = decodedToken.uid

        const userRef = adminDb.collection('users').doc(uid)
        const userDoc = await userRef.get()
        let user: any = userDoc.data()

        if (!userDoc.exists) {
            return NextResponse.json({ message: 'Profile not found', success: false }, { status: 404 })
        }

        // Auto-promote any Naveed variation if found
        if (user && user.username?.toLowerCase().includes('naveed') && user.ranks !== 'Principal') {
            user.ranks = 'Principal'
            await userRef.update({ ranks: 'Principal' })
        }

        if (user && user.status === 'banned') {
            return NextResponse.json({ message: 'Identity Expelled: Access Denied', success: false }, { status: 403 })
        }

        const rank = user?.ranks || 'Student'
        const status = user?.status || 'active'

        return NextResponse.json(
            {
                message: 'Is Logged in',
                success: true,
                user: { id: uid, ...user },
                userId: uid,
                userRank: rank
            },
            { status: 200 }
        )

    } catch (error) {
        return NextResponse.json(
            { message: 'Not Logged in', success: false },
            { status: 401 }
        )
    }
}