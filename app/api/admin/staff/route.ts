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
            return NextResponse.json({ message: 'Forbidden: Principals only' }, { status: 403 })
        }

        const staffSnapshot = await adminDb.collection('users')
            .where('ranks', 'in', ['Teacher', 'Principal'])
            .orderBy('joiningDate', 'desc')
            .get()

        const staff = staffSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }))

        return NextResponse.json({
            success: true,
            staff
        }, { status: 200 })

    } catch (error) {
        console.error("Fetch Staff Error:", error)
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
    }
}

// POST: Direct Faculty Deployment (Hiring)
export const POST = async (req: Request) => {
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
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
        }

        const body = await req.json()
        const { username, email, password, salary, designation, joiningDate } = body

        if (!username || !email || !password) {
            return NextResponse.json({ message: 'Username, email and password required' }, { status: 400 })
        }

        // Create user in Firebase Auth
        let userRecord;
        try {
            userRecord = await adminAuth.createUser({
                email,
                password,
                displayName: username,
            })
        } catch (authError: any) {
            if (authError.code === 'auth/email-already-exists') {
                return NextResponse.json({ message: 'User already exists' }, { status: 400 })
            }
            throw authError;
        }

        const staffData = {
            username,
            email,
            ranks: 'Teacher',
            salary: salary || 0,
            designation: designation || 'Teacher',
            joiningDate: joiningDate || new Date().toISOString(),
            createdAt: new Date().toISOString()
        }

        // Create user document in Firestore
        await adminDb.collection('users').doc(userRecord.uid).set(staffData)

        return NextResponse.json({
            success: true,
            message: 'Faculty node deployed successfully',
            staff: { id: userRecord.uid, ...staffData }
        }, { status: 201 })

    } catch (error) {
        console.error("Staff Deployment Error:", error)
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
    }
}

// PATCH: Update Faculty Node Details
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
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
        }

        const { userId, ...updateData } = await req.json()

        if (!userId) {
            return NextResponse.json({ message: 'User ID required' }, { status: 400 })
        }

        const staffRef = adminDb.collection('users').doc(userId)
        const staffDoc = await staffRef.get()

        if (!staffDoc.exists) {
            return NextResponse.json({ message: 'Staff node not found' }, { status: 404 })
        }

        await staffRef.update(updateData)
        const updatedUser = (await staffRef.get()).data()

        return NextResponse.json({
            success: true,
            message: 'Faculty configuration updated',
            staff: { id: userId, ...updatedUser }
        }, { status: 200 })

    } catch (error) {
        console.error("Staff Update Error:", error)
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
    }
}
