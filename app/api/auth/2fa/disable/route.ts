import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        // Disable 2FA
        await adminDb.collection('users').doc(uid).update({
            twoFactorEnabled: false,
            twoFactorSecret: adminDb.FieldValue.delete()
        });

        return NextResponse.json({ success: true, message: '2FA disabled successfully' });
    } catch (error: any) {
        console.error('2FA Disable Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
