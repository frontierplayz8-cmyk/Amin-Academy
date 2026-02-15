import { NextRequest, NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { sendEmail } from "@/lib/email"

export const PATCH = async (req: NextRequest) => {
    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.split('Bearer ')[1]
        const decodedToken = await adminAuth.verifyIdToken(token)
        const uid = decodedToken.uid

        // Check if requester is Principal
        const principalDoc = await adminDb.collection('users').doc(uid).get()
        const principal = principalDoc.data()

        if (!principalDoc.exists || principal?.ranks !== 'Principal') {
            return NextResponse.json({ message: 'Forbidden: Principals only' }, { status: 403 })
        }

        const body = await req.json()
        const { id, status, message, meetingDate, meetingTime, meetingLink } = body

        if (!id || !status) {
            return NextResponse.json({ message: 'Application ID and status are required' }, { status: 400 })
        }

        const appRef = adminDb.collection('teacher_applications').doc(id)
        const appDoc = await appRef.get()

        if (!appDoc.exists) {
            return NextResponse.json({ message: 'Application not found' }, { status: 404 })
        }

        const appData = appDoc.data()
        const applicantId = appData?.applicantId
        const applicantEmail = appData?.email
        const applicantName = appData?.fullName

        // Update application status
        await appRef.update({
            status,
            principalResponse: message || '',
            meetingDate: meetingDate || null,
            meetingTime: meetingTime || null,
            meetingLink: meetingLink || null,
            updatedAt: new Date().toISOString()
        })

        // Create notification for applicant if they are a registered user
        if (applicantId) {
            let notificationMessage = `Your career application has been ${status}.`
            if (status === 'accepted') {
                notificationMessage = `Congratulations! Your application has been accepted. Meeting scheduled for ${meetingDate} at ${meetingTime}.`
            }

            await adminDb.collection('notifications').add({
                userId: applicantId,
                type: 'career_update',
                title: `Application ${status.charAt(0).toUpperCase() + status.slice(1)}`,
                message: notificationMessage,
                status: 'unread',
                data: { applicationId: id, response: message, meetingDate, meetingTime, meetingLink },
                timestamp: new Date().toISOString()
            })
        }

        // Send Email
        let emailSubject = `Update on your Career Application - Amin Academy`
        let emailHtml = `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h1 style="color: #10b981; text-transform: uppercase;">Application ${status.toUpperCase()}</h1>
                <p>Hello ${applicantName},</p>
                <p>We have reviewed your application for a position at Amin Academy.</p>
                <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Status:</strong> ${status.toUpperCase()}</p>
                    ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
                    ${status === 'accepted' ? `
                        <p><strong>Meeting Date:</strong> ${meetingDate}</p>
                        <p><strong>Meeting Time:</strong> ${meetingTime}</p>
                        ${meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${meetingLink}">${meetingLink}</a></p>` : ''}
                    ` : ''}
                </div>
                <p>Best regards,<br/>The Administration Team<br/>Amin Academy</p>
            </div>
        `

        await sendEmail(applicantEmail, emailSubject, emailHtml)

        return NextResponse.json({ success: true, message: `Application ${status} successfully` })
    } catch (error: any) {
        console.error("Update Application Error:", error)
        return NextResponse.json({ message: error.message }, { status: 500 })
    }
}
