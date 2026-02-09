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
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
        }

        // Calculate date 30 days ago
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const thirtyDaysAgoISO = thirtyDaysAgo.toISOString()

        // Fetch Exam Papers created in last 30 days
        const examsQuery = await adminDb.collection('examPapers')
            .where('createdAt', '>=', thirtyDaysAgoISO)
            .get()

        // Fetch Users created in last 30 days
        const usersQuery = await adminDb.collection('users')
            .where('createdAt', '>=', thirtyDaysAgoISO)
            .get()

        // Helper to group by date
        const groupByDate = (docs: any[]) => {
            const counts: { [key: string]: number } = {}
            docs.forEach((doc: any) => {
                const date = doc.createdAt?.split('T')[0]
                if (date) counts[date] = (counts[date] || 0) + 1
            })
            return counts
        }

        const examCounts = groupByDate(examsQuery.docs.map((d: any) => d.data()))
        const userCounts = groupByDate(usersQuery.docs.map((d: any) => d.data()))

        // Merge and Fill Gaps
        const chartData = []
        for (let i = 0; i <= 30; i++) {
            const d = new Date()
            d.setDate(d.getDate() - (30 - i))
            const dateStr = d.toISOString().split('T')[0]

            chartData.push({
                date: dateStr,
                exams: examCounts[dateStr] || 0,
                users: userCounts[dateStr] || 0
            })
        }

        return NextResponse.json({
            success: true,
            chartData
        }, { status: 200 })

    } catch (error) {
        console.error("Fetch Metrics Error:", error)
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
    }
}
