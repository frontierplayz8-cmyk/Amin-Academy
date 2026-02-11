import { NextRequest, NextResponse } from 'next/server';
const { verifySync } = require('otplib');

export async function POST(req: NextRequest) {
    try {
        const { code, secret } = await req.json();

        if (!code || !secret) {
            return NextResponse.json({ success: false, message: 'Code and secret are required' }, { status: 400 });
        }
        // Final verification before enabling
        const isValid = verifySync({
            token: code,
            secret: secret
        });

        if (isValid) {
            return NextResponse.json({ success: true, message: 'Code verified' });
        } else {
            return NextResponse.json({ success: false, message: 'Invalid code' }, { status: 400 });
        }
    } catch (error: any) {
        console.error('2FA Verify Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
