import { NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"

export const GET = async (req: Request) => {
    try {
        const start = performance.now()
        // Auth Check
        const authHeader = req.headers.get('Authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.split('Bearer ')[1]
        try {
            await adminAuth.verifyIdToken(token)
        } catch (e) {
            return NextResponse.json({ message: 'Invalid Token' }, { status: 401 })
        }

        // Count documents (Parallel)
        const [examsSnap, usersSnap, attendanceSnap, aiSnap] = await Promise.all([
            adminDb.collection('examPapers').count().get(),
            adminDb.collection('users').count().get(),
            adminDb.collection('attendance').count().get(),
            adminDb.collection('aiSessions').count().get()
        ])

        const examCount = examsSnap.data().count
        const userCount = usersSnap.data().count
        const attendanceCount = attendanceSnap.data().count
        const aiCount = aiSnap.data().count

        const totalDocs = examCount + userCount + attendanceCount + aiCount
        const dbLimit = 20000 // Example "Free Tier" soft limit for visual
        // Return with 1 decimal place for small datasets
        const dbUsagePercent = Number(((totalDocs / dbLimit) * 100).toFixed(1))

        // Estimate Storage (Avg 5MB per exam paper for PDF/Images)
        const estimatedStorageBytes = examCount * 5 * 1024 * 1024
        const storageLimitBytes = 5 * 1024 * 1024 * 1024 // 5GB
        const storageUsagePercent = Number(((estimatedStorageBytes / storageLimitBytes) * 100).toFixed(1))

        const end = performance.now()
        const latency = Math.round(end - start)

        return NextResponse.json({
            dbUsage: dbUsagePercent,
            storageUsage: storageUsagePercent,
            apiLatency: latency,
            details: {
                totalDocs,
                examCount
            }
        })

    } catch (error) {
        console.error("System Health Error:", error)
        return NextResponse.json({
            dbUsage: 0,
            storageUsage: 0,
            apiLatency: 0
        }, { status: 500 })
    }
}
