import { NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { verifySync } from 'otplib'

export const POST = async (req: Request) => {
    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.split('Bearer ')[1]
        const decodedToken = await adminAuth.verifyIdToken(token)
        const uid = decodedToken.uid

        const { secret, code, action } = await req.json()

        const userRef = adminDb.collection('users').doc(uid)
        const userDoc = await userRef.get()
        const user = userDoc.data()

        if (!userDoc.exists) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 })
        }

        if (action === 'enable') {
            const isValid = verifySync({ token: code, secret })
            if (!isValid) {
                return NextResponse.json({ message: 'Invalid verification code' }, { status: 400 })
            }

            await userRef.update({
                twoFactorSecret: secret,
                twoFactorEnabled: true
            })

            return NextResponse.json({
                success: true,
                message: '2FA enabled successfully'
            })
        } else if (action === 'disable') {
            const isValid = verifySync({ token: code, secret: user?.twoFactorSecret })
            if (!isValid) {
                return NextResponse.json({ message: 'Invalid verification code' }, { status: 400 })
            }

            await userRef.update({
                twoFactorSecret: '',
                twoFactorEnabled: false
            })

            return NextResponse.json({
                success: true,
                message: '2FA disabled successfully'
            })
        }

        return NextResponse.json({ message: 'Invalid action' }, { status: 400 })

    } catch (error) {
        console.error("2FA Verify Error:", error)
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
    }
}
