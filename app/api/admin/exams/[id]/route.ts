import { NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"

export const GET = async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
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

        const { id: paperId } = await params
        const paperDoc = await adminDb.collection('examPapers').doc(paperId).get()

        if (!paperDoc.exists) {
            return NextResponse.json({ message: 'Paper not found' }, { status: 404 })
        }

        return NextResponse.json({
            success: true,
            exam: { id: paperDoc.id, ...paperDoc.data() }
        }, { status: 200 })

    } catch (error) {
        console.error("Get Exam Error:", error)
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
    }
}

export const DELETE = async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
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

        const { id: paperId } = await params
        const paperRef = adminDb.collection('examPapers').doc(paperId)
        const paperDoc = await paperRef.get()

        if (!paperDoc.exists) {
            return NextResponse.json({ message: 'Paper not found' }, { status: 404 })
        }

        await paperRef.delete()

        return NextResponse.json({
            success: true,
            message: 'Paper deleted successfully'
        }, { status: 200 })

    } catch (error) {
        console.error("Delete Exam Error:", error)
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
    }
}
