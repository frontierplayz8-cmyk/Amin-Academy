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

        const principalDoc = await adminDb.collection('users').doc(uid).get()
        const principal = principalDoc.data()

        if (!principalDoc.exists || principal?.ranks !== 'Principal') {
            return NextResponse.json({ message: 'Forbidden: Principals only' }, { status: 403 })
        }

        const { userId, newRank, salary, designation, joiningDate } = await req.json()

        if (!userId || !newRank) {
            return NextResponse.json({ message: 'User ID and new rank are required' }, { status: 400 })
        }

        const allowedRanks = ['Student', 'Teacher', 'Principal']
        if (!allowedRanks.includes(newRank)) {
            return NextResponse.json({ message: 'Invalid rank' }, { status: 400 })
        }

        const updateData: any = { ranks: newRank }

        // Add teacher specific details if provided
        if (newRank === 'Teacher') {
            if (salary) updateData.salary = salary
            if (designation) updateData.designation = designation
            if (joiningDate) updateData.joiningDate = joiningDate
        }

        const userRef = adminDb.collection('users').doc(userId)
        const userDoc = await userRef.get()

        if (!userDoc.exists) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 })
        }

        await userRef.update(updateData)
        const updatedUser = (await userRef.get()).data()

        return NextResponse.json({
            success: true,
            message: `User ${updatedUser?.username} promoted to ${newRank}`,
            user: { id: userId, ...updatedUser }
        }, { status: 200 })

    } catch (error) {
        console.error("Promotion Error:", error)
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
    }
}
