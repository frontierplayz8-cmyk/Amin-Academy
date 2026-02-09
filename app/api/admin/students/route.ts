import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export const POST = async (req: Request) => {
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

        // Only Teachers or Principals can add students
        if (!userDoc.exists || (currentUser?.ranks !== 'Principal' && currentUser?.ranks !== 'Teacher')) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
        }

        const body = await req.json()
        const {
            name,
            rollNumber,
            email,
            grade,
            section,
            fatherName,
            contactNumber,
            bloodGroup,
            imageUrl
        } = body

        if (!name || !rollNumber || !email || !grade || !fatherName || !contactNumber) {
            return NextResponse.json({ message: 'Required fields are missing' }, { status: 400 })
        }

        // Check if student with same rollNumber or email already exists
        const existingEmail = await adminDb.collection('students').where('email', '==', email).get()
        const existingRoll = await adminDb.collection('students').where('rollNumber', '==', rollNumber).get()

        if (!existingEmail.empty || !existingRoll.empty) {
            return NextResponse.json({ message: 'Roll Number or Email already exists' }, { status: 400 })
        }

        const studentData = {
            name,
            rollNumber,
            email,
            grade,
            section: section || 'A',
            fatherName,
            contactNumber,
            bloodGroup,
            imageUrl,
            attendance: Math.floor(Math.random() * 20) + 80,
            performance: 3,
            feeStatus: 'Pending',
            feeAmount: body.feeAmount || 5500,
            recentScores: [0, 0, 0, 0, 0],
            createdAt: new Date().toISOString()
        }

        const newStudentRef = await adminDb.collection('students').add(studentData)

        return NextResponse.json({
            success: true,
            message: 'Student deployed successfully',
            student: { id: newStudentRef.id, ...studentData }
        }, { status: 201 })

    } catch (error: any) {
        console.error("Deploy Student Error:", error)
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
    }
}

export const GET = async (req: Request) => {
    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const studentsSnapshot = await adminDb.collection('students').orderBy('createdAt', 'desc').get()
        const students = studentsSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }))

        return NextResponse.json({
            success: true,
            students
        }, { status: 200 })

    } catch (error) {
        console.error("Fetch Students Error:", error)
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

        const userDoc = await adminDb.collection('users').doc(uid).get()
        const currentUser = userDoc.data()

        if (!userDoc.exists || (currentUser?.ranks !== 'Principal' && currentUser?.ranks !== 'Teacher')) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
        }

        const body = await req.json()
        const { studentId, updates } = body

        if (!studentId || !updates) {
            return NextResponse.json({ message: 'Missing studentId or updates' }, { status: 400 })
        }

        const studentRef = adminDb.collection('students').doc(studentId)
        const studentDoc = await studentRef.get()

        if (!studentDoc.exists) {
            return NextResponse.json({ message: 'Student not found' }, { status: 404 })
        }

        await studentRef.update(updates)
        const updatedStudent = (await studentRef.get()).data()

        return NextResponse.json({
            success: true,
            message: 'Student record updated',
            student: { id: studentId, ...updatedStudent }
        }, { status: 200 })

    } catch (error) {
        console.error("Update Student Error:", error)
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

        const userDoc = await adminDb.collection('users').doc(uid).get()
        const currentUser = userDoc.data()

        if (!userDoc.exists || currentUser?.ranks !== 'Principal') {
            return NextResponse.json({ message: 'Forbidden: Principal clearance required' }, { status: 403 })
        }

        const { searchParams } = new URL(req.url)
        const studentId = searchParams.get('studentId')

        if (!studentId) {
            return NextResponse.json({ message: 'Missing studentId' }, { status: 400 })
        }

        const studentRef = adminDb.collection('students').doc(studentId)
        const studentDoc = await studentRef.get()

        if (!studentDoc.exists) {
            return NextResponse.json({ message: 'Student not found' }, { status: 404 })
        }

        await studentRef.delete()

        return NextResponse.json({
            success: true,
            message: 'Identity purged from matrix',
        }, { status: 200 })

    } catch (error) {
        console.error("Delete Student Error:", error)
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
    }
}
