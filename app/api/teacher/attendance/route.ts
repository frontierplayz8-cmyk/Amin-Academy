import { NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"

// POST: Teacher marks themselves as present
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
        const teacher = userDoc.data()

        if (!userDoc.exists || teacher?.ranks !== 'Teacher') {
            return NextResponse.json({ message: 'Forbidden: Teachers only' }, { status: 403 })
        }

        const today = new Date().toISOString().split('T')[0]

        // Check if attendance already marked for today
        const attendanceQuery = await adminDb.collection('attendance')
            .where('teacherId', '==', uid)
            .where('date', '==', today)
            .get()

        if (!attendanceQuery.empty) {
            return NextResponse.json({ success: false, message: 'Attendance already requested for today' }, { status: 400 })
        }

        const attendanceData = {
            teacherId: uid,
            teacherName: teacher.username,
            date: today,
            status: 'Pending',
            createdAt: new Date().toISOString()
        }

        const newAttendanceRef = await adminDb.collection('attendance').add(attendanceData)

        return NextResponse.json({
            success: true,
            message: 'Attendance request sent to Principal',
            attendance: { id: newAttendanceRef.id, ...attendanceData }
        }, { status: 201 })

    } catch (error) {
        console.error("Attendance Request Error:", error)
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
    }
}

// GET: Fetch teacher's attendance for today or overview
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
        const user = userDoc.data()

        if (!userDoc.exists || !user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 })
        }

        const today = new Date().toISOString().split('T')[0]

        // If teacher, return their specific attendance
        if (user.ranks === 'Teacher') {
            const attendanceQuery = await adminDb.collection('attendance')
                .where('teacherId', '==', uid)
                .where('date', '==', today)
                .limit(1)
                .get()

            const attendance = !attendanceQuery.empty ? { id: attendanceQuery.docs[0].id, ...attendanceQuery.docs[0].data() } : null
            return NextResponse.json({ success: true, attendance })
        }

        // If principal, return all pending for today
        if (user.ranks === 'Principal') {
            const pendingQuery = await adminDb.collection('attendance')
                .where('date', '==', today)
                .where('status', '==', 'Pending')
                .get()

            const pending = pendingQuery.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }))
            return NextResponse.json({ success: true, pending })
        }

        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    } catch (error) {
        console.error("Attendance Fetch Error:", error)
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
    }
}
