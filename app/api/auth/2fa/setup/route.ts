import { NextRequest, NextResponse } from 'next/server';
const { generateSecret, generateURI } = require('otplib');

export async function POST(req: NextRequest) {
    try {
        const { username, email } = await req.json();

        if (!email) {
            return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 });
        }

        const secret = generateSecret();
        const otpauth = generateURI({
            secret,
            label: email,
            issuer: 'Amin Academy'
        });

        return NextResponse.json({
            success: true,
            secret,
            otpauth
        });
    } catch (error: any) {
        console.error('2FA Setup Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
