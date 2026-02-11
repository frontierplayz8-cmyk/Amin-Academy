import { NextRequest, NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"
const { verifySync } = require('otplib');

export const POST = async (req: NextRequest) => {
    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.split('Bearer ')[1]
        const decodedToken = await adminAuth.verifyIdToken(token)
        const uid = decodedToken.uid

        const { secret, code, action } = await req.json()

        if (!code) {
            return NextResponse.json({ message: 'Code required' }, { status: 400 })
        }

        let userSecret = secret
        if (!userSecret) {
            const userDoc = await adminDb.collection('users').doc(uid).get()
            userSecret = userDoc.data()?.twoFactorSecret
        }

        if (!userSecret) {
            return NextResponse.json({ message: 'Security context missing' }, { status: 400 })
        }

        const isValid = verifySync({
            token: code,
            secret: userSecret
        });

        if (isValid) {
            if (action === 'enable') {
                await adminDb.collection('users').doc(uid).update({
                    twoFactorEnabled: true,
                    twoFactorSecret: userSecret
                })
            } else if (action === 'disable') {
                await adminDb.collection('users').doc(uid).update({
                    twoFactorEnabled: false,
                    twoFactorSecret: adminDb.FieldValue.delete()
                })
            }

            return NextResponse.json({ success: true, message: 'Identity Verified' })
        } else {
            return NextResponse.json({ success: false, message: 'Invalid 6-digit sync code' })
        }

    } catch (error) {
        console.error("2FA Verify Error:", error)
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
    }
}
