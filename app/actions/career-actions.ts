'use server'

import { adminDb } from "@/lib/firebase-admin";

export async function submitTeacherApplicationAction(formData: FormData) {
    try {
        const fullName = formData.get('fullName') as string;
        const email = formData.get('email') as string;
        const phone = formData.get('phone') as string;
        const subject = formData.get('subject') as string;
        const experience = formData.get('experience') as string;
        const qualifications = formData.get('qualifications') as string;
        const linkedinProfile = formData.get('linkedinProfile') as string;
        const message = formData.get('message') as string;

        if (!fullName || !email || !subject) {
            throw new Error("Missing required fields.");
        }

        const applicationData = {
            fullName,
            email,
            phone,
            subject,
            experience,
            qualifications,
            linkedinProfile,
            message,
            applicantId: formData.get('applicantId') as string || null,
            status: 'pending',
            submittedAt: new Date().toISOString(),
        };

        const docRef = await adminDb.collection('teacher_applications').add(applicationData);

        // Create notification for Principal
        await adminDb.collection('notifications').add({
            userId: 'principal_admin', // Standard ID for principal notifications
            type: 'career_application',
            title: 'New Teacher Application',
            message: `${fullName} has submitted an application for ${subject}.`,
            status: 'unread',
            data: { applicationId: docRef.id },
            timestamp: new Date().toISOString()
        });

        return { success: true, id: docRef.id };
    } catch (error: any) {
        console.error("Submission Error:", error);
        return { success: false, error: error.message };
    }
}
