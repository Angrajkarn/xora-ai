
'use server';

import { sendEmail } from '@/lib/mailer';
import { getChatHistoryAction } from './chatServiceActions';

export async function sendWelcomeEmail(userId: string, email: string): Promise<{ success: boolean, error?: string }> {
    if (!email || !userId) {
        const message = `Attempted to send welcome email with incomplete data (userId: ${userId}, email: ${email}).`;
        console.warn(message);
        return { success: false, error: message };
    }
    try {
        // Fetch chat history on the server using the robust server action
        const history = await getChatHistoryAction(userId);
        const firstChatTopic = history[0]?.title || 'AI exploration';
        
        await sendEmail({
            to: email,
            subject: '✅ You’re Subscribed to Xora Updates!',
            text: `Hi there,\n\nThanks for subscribing to Xora email notifications! 🎉\nYou're now on the list to receive timely updates, important announcements, and the latest features we roll out.\n\nWe also noticed you’ve been exploring topics like "${firstChatTopic}" recently. At Xora, we’re constantly improving our platform to give you smarter, more relevant experiences—tailored to the topics you care about.\n\nStay tuned — great things are coming your way.\n\nWarm regards,\nThe Xora Team`,
            html: `<p>Hi there,</p><p>Thanks for subscribing to Xora email notifications! 🎉<br/>You're now on the list to receive timely updates, important announcements, and the latest features we roll out.</p><p>We also noticed you’ve been exploring topics like "<b>${firstChatTopic}</b>" recently. At Xora, we’re constantly improving our platform to give you smarter, more relevant experiences—tailored to the topics you care about.</p><p>Stay tuned — great things are coming your way.</p><p>Warm regards,<br/>The Xora Team</p>`
        });
        return { success: true };
    } catch (error: any) {
        console.error("Failed to send welcome email:", error.message);
        return { success: false, error: error.message };
    }
}


export async function sendUnsubscribeEmail(email: string): Promise<{ success: boolean; error?: string }> {
    if (!email) {
        const message = "Attempted to send unsubscribe email with no email address.";
        console.warn(message);
        return { success: false, error: message };
    }
    try {
        await sendEmail({
            to: email,
            subject: "You've Unsubscribed from Xora Emails",
            text: `Hi there,\n\nYou’ve successfully unsubscribed from Xora email notifications. We’re sorry to see you go — but we respect your decision.\n\nIf this was a mistake or you change your mind later, you can always resubscribe at any time from your notification settings or by visiting our website.\n\nAt Xora, we're committed to delivering content that matters to you. If you have feedback on why you unsubscribed, we'd love to hear it — just hit reply.\n\nThanks for being part of our community.\n\nWarm regards,\nThe Xora Team`,
            html: `<p>Hi there,</p><p>You’ve successfully unsubscribed from Xora email notifications. We’re sorry to see you go — but we respect your decision.</p><p>If this was a mistake or you change your mind later, you can always resubscribe at any time from your notification settings or by visiting our website.</p><p>At Xora, we're committed to delivering content that matters to you. If you have feedback on why you unsubscribed, we'd love to hear it — just hit reply.</p><p>Thanks for being part of our community.</p><p>Warm regards,<br/>The Xora Team</p>`,
        });
        return { success: true };
    } catch (error: any) {
        console.error("Failed to send unsubscribe email:", error.message);
        return { success: false, error: error.message };
    }
}
