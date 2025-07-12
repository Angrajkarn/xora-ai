
'use server';

import { getUserPreferences } from './userService';

interface PushNotificationPayload {
    userId: string;
    title: string;
    body: string;
    data?: Record<string, string>;
}

/**
 * Sends a push notification to a user.
 * This is a SIMULATED function. In a real application, this would use a service
 * like Firebase Cloud Messaging (FCM) or OneSignal to send a real push notification.
 * @param {PushNotificationPayload} payload - The content of the notification.
 */
export async function sendPushNotification({ userId, title, body, data }: PushNotificationPayload): Promise<{ success: boolean; error?: string }> {
    try {
        // 1. Get the user's push token from Firestore.
        const prefs = await getUserPreferences(userId);
        const token = prefs.pushToken;

        if (!token) {
            console.warn(`User ${userId} has no push token. Skipping notification.`);
            return { success: false, error: 'No push token for user.' };
        }

        // 2. Construct the message payload for your push service (e.g., FCM).
        const messagePayload = {
            notification: {
                title,
                body,
            },
            data, // Optional data payload for deep linking, etc.
            token,
        };

        // 3. Make an API call to the push service.
        //    (e.g., using `firebase-admin/messaging` or `fetch` to the OneSignal API)
        
        // ** SIMULATION **
        console.log('------------------------------------');
        console.log('🚀 SIMULATED PUSH NOTIFICATION 🚀');
        console.log(`TO: User ${userId} (Token: ${token})`);
        console.log(`TITLE: ${title}`);
        console.log(`BODY: ${body}`);
        if(data) console.log('DATA:', data);
        console.log('------------------------------------');

        return { success: true };

    } catch (error: any) {
        console.error(`Failed to send push notification to user ${userId}:`, error);
        return { success: false, error: error.message };
    }
}
