import { NextRequest, NextResponse } from 'next/server';
const { verifySync } = require('otplib');
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

        const { code, secret } = await req.json();

        if (!code || !secret) {
            return NextResponse.json({ success: false, message: 'Code and secret are required' }, { status: 400 });
        }

        // Final verification before enabling
        const isValid = verifySync({
            token: code,
            secret: secret
        });

        if (!isValid) {
            return NextResponse.json({ success: false, message: 'Invalid verification code' }, { status: 400 });
        }

        // Save secret to Firestore and enable 2FA
        await adminDb.collection('users').doc(uid).update({
            twoFactorEnabled: true,
            twoFactorSecret: secret
        });

        return NextResponse.json({ success: true, message: '2FA enabled successfully' });
    } catch (error: any) {
        console.error('2FA Enable Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
