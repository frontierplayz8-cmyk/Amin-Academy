import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

// GET: Aggregate AI session statistics
export async function GET(req: NextRequest) {
    try {
        const snapshot = await getDocs(collection(db, 'ai_sessions'));

        let totalCredits = 0;
        let paperCount = 0;
        let quizCount = 0;
        let studyCount = 0;
        const teacherSet = new Set<string>();

        snapshot.docs.forEach(doc => {
            const data = doc.data();
            totalCredits += data.credits || 0;
            teacherSet.add(data.teacherId);

            if (data.activityType === 'Paper Generation') paperCount++;
            else if (data.activityType === 'Quiz Creation') quizCount++;
            else if (data.activityType === 'Study Session') studyCount++;
        });

        return NextResponse.json({
            success: true,
            stats: {
                totalCredits,
                paperCount,
                quizCount,
                studyCount,
                activeTeachers: teacherSet.size,
                totalSessions: snapshot.size
            }
        });
    } catch (error: any) {
        console.error('Error fetching AI stats:', error);
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}
