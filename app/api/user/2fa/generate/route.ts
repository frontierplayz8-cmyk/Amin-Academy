import { NextRequest, NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"
import QRCode from 'qrcode'
const { generateSecret, generateURI } = require('otplib');

export const GET = async (req: NextRequest) => {
    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.split('Bearer ')[1]
        const decodedToken = await adminAuth.verifyIdToken(token)
        const uid = decodedToken.uid

        const userDoc = await adminDb.collection('users').doc(uid).get()
        const user = userDoc.data()

        if (!userDoc.exists) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 })
        }

        // Generate a new secret for the user
        const secret = generateSecret();
        const qrCodeUrl = await QRCode.toDataURL(generateURI({
            secret,
            label: user?.email || 'User',
            issuer: 'Amin Academy'
        }));

        return NextResponse.json({
            success: true,
            secret,
            qrCodeUrl
        })

    } catch (error) {
        console.error("2FA Generate Error:", error)
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
    }
}
