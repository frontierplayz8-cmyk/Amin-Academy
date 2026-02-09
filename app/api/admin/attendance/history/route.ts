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

        const principalDoc = await adminDb.collection('users').doc(uid).get()
        const principal = principalDoc.data()

        if (!principalDoc.exists || principal?.ranks !== 'Principal') {
            return NextResponse.json({ message: 'Forbidden: Principals only' }, { status: 403 })
        }

        // Calculate date 30 days ago
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0]

        const teachersSnapshot = await adminDb.collection('users')
            .where('ranks', '==', 'Teacher')
            .get()

        const attendanceSnapshot = await adminDb.collection('attendance')
            .where('date', '>=', thirtyDaysAgoStr)
            .get()

        const attendanceRecords = attendanceSnapshot.docs.map((doc: any) => doc.data())

        // Group by teacher
        const staffStats = teachersSnapshot.docs.map((teacherDoc: any) => {
            const teacherId = teacherDoc.id
            const teacher = teacherDoc.data()
            const teacherRecords = attendanceRecords.filter((r: any) => r.teacherId === teacherId)
            const presentCount = teacherRecords.filter((r: any) => r.status === 'Present').length
            const absentCount = teacherRecords.filter((r: any) => r.status === 'Absent').length

            // Generate a 30-day map (fill missing with 'None')
            const history = []
            for (let i = 29; i >= 0; i--) {
                const d = new Date()
                d.setDate(d.getDate() - i)
                const dateStr = d.toISOString().split('T')[0]
                const record = teacherRecords.find((r: any) => r.date === dateStr)
                history.push({
                    date: dateStr,
                    status: record ? record.status : 'None'
                })
            }

            return {
                teacherId,
                username: teacher.username,
                salary: teacher.salary || 0,
                designation: teacher.designation || 'Teacher',
                presentCount,
                absentCount,
                history
            }
        })

        return NextResponse.json({
            success: true,
            staffStats
        }, { status: 200 })

    } catch (error) {
        console.error("Attendance History Error:", error)
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
    }
}
