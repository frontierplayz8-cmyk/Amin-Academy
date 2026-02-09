import { NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"

export const GET = async (req: Request) => {
    try {
        const { searchParams } = new URL(req.url)
        const manualOnly = searchParams.get('manualOnly') === 'true'

        const authHeader = req.headers.get('Authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.split('Bearer ')[1]
        const decodedToken = await adminAuth.verifyIdToken(token)
        const uid = decodedToken.uid

        const userDoc = await adminDb.collection('users').doc(uid).get()
        const user = userDoc.data()

        if (!userDoc.exists || (user?.ranks !== 'Principal' && user?.ranks !== 'Teacher')) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
        }

        let examsQuery = adminDb.collection('examPapers').orderBy('createdAt', 'desc')

        if (manualOnly) {
            examsQuery = examsQuery.where('isManualUpload', '==', true) as any
        }

        const examsSnapshot = await examsQuery.get()
        const exams = examsSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }))

        return NextResponse.json({
            success: true,
            exams
        }, { status: 200 })

    } catch (error) {
        console.error("Fetch Exams Error:", error)
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
    }
}

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
        const user = userDoc.data()

        if (!userDoc.exists || (user?.ranks !== 'Principal' && user?.ranks !== 'Teacher')) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
        }

        const body = await req.json()
        const { title, subject, grade, content, config, isManualUpload } = body

        if (!title || !subject || !grade || !content) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
        }

        const examData = {
            title,
            subject,
            grade,
            content,
            config,
            isManualUpload: isManualUpload || false,
            createdBy: uid,
            createdAt: new Date().toISOString()
        }

        const newExamRef = await adminDb.collection('examPapers').add(examData)

        return NextResponse.json({
            success: true,
            exam: { id: newExamRef.id, ...examData }
        }, { status: 201 })

    } catch (error) {
        console.error("Create Exam Error:", error)
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
    }
}
