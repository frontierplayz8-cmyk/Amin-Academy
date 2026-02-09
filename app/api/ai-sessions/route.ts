import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// POST: Log a new AI session
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { teacherId, teacherName, activityType, subject, credits, duration, metadata } = body;

        if (!teacherId || !teacherName || !activityType || !subject) {
            return NextResponse.json(
                { success: false, message: 'Missing required fields' },
                { status: 400 }
            );
        }

        const sessionData = {
            teacherId,
            teacherName,
            activityType, // 'Paper Generation' | 'Quiz Creation' | 'Study Session'
            subject,
            credits: credits || 0,
            duration: duration || 0, // in seconds
            timestamp: new Date(), // Admin SDK uses native Date or FieldValue.serverTimestamp()
            metadata: metadata || {}
        };

        const docRef = await adminDb.collection('ai_sessions').add(sessionData);

        return NextResponse.json({
            success: true,
            sessionId: docRef.id,
            message: 'AI session logged successfully'
        });
    } catch (error: any) {
        console.error('Error logging AI session:', error);
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}

// GET: Retrieve AI sessions with optional filters
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const teacherId = searchParams.get('teacherId');
        const activityType = searchParams.get('activityType');

        let query = adminDb.collection('ai_sessions').orderBy('timestamp', 'desc');

        if (teacherId) {
            query = query.where('teacherId', '==', teacherId);
        }

        if (activityType) {
            query = query.where('activityType', '==', activityType);
        }

        const snapshot = await query.get();
        const sessions = snapshot.docs.map((doc: any) => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                // Convert Firestore Timestamp to readable string if it exists, otherwise assume Date or null
                timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toLocaleString() :
                    (data.timestamp instanceof Date ? data.timestamp.toLocaleString() : 'N/A')
            };
        });

        return NextResponse.json({
            success: true,
            sessions
        });
    } catch (error: any) {
        console.error('Error fetching AI sessions:', error);
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}
