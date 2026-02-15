import { Resend } from 'resend';

/**
 * [IMPORTANT] Configure your Resend API Key.
 * We prioritize the environment variable, but fallback to the provided key for setup.
 */
const resend = new Resend(process.env.RESEND_API_KEY || 're_4AD2N2hX_BXXKJkdzsNVBzvENKTqHz3io');

export const sendEmail = async (to: string, subject: string, html: string) => {
    try {
        const { data, error } = await resend.emails.send({
            from: 'Amin Academy <onboarding@resend.dev>', // Update this to your verified domain in production
            to: [to],
            subject,
            html,
        });

        if (error) {
            console.error("Resend API error:", error);
            return { success: false, error };
        }

        console.log("Email sent successfully via Resend:", data?.id);
        return { success: true, messageId: data?.id };
    } catch (error) {
        console.error("Unexpected Email error:", error);
        return { success: false, error };
    }
};
