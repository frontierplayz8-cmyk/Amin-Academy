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

        const { attendanceId, status } = await req.json()

        if (!attendanceId || !['Present', 'Absent'].includes(status)) {
            return NextResponse.json({ message: 'Invalid attendance ID or status' }, { status: 400 })
        }

        const attendanceRef = adminDb.collection('attendance').doc(attendanceId)
        const attendanceDoc = await attendanceRef.get()

        if (!attendanceDoc.exists) {
            return NextResponse.json({ message: 'Attendance record not found' }, { status: 404 })
        }

        const updateData = {
            status: status,
            verifiedBy: uid,
            verificationTime: new Date().toISOString()
        }

        await attendanceRef.update(updateData)
        const updatedAttendance = (await attendanceRef.get()).data()

        return NextResponse.json({
            success: true,
            message: `Attendance marked as ${status}`,
            attendance: { id: attendanceId, ...updatedAttendance }
        }, { status: 200 })

    } catch (error) {
        console.error("Attendance Verification Error:", error)
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
    }
}
