
'use server';

/**
 * @fileOverview Logic for the AI-powered re-engagement system.
 * This would be triggered by a scheduled job (e.g., Vercel Cron, Firebase Scheduled Function).
 * To run this manually for testing, you could create a temporary API route that calls it.
 */
import { db, adminAuth } from './firebase-admin';

import { runRecommenderFlow } from '@/ai/flows/recommender-flow';
import { sendPushNotification } from '@/services/pushService';
import type { ChatSummary } from '@/lib/types';


async function getAdminAllUserIds(): Promise<string[]> {
    const usersSnapshot = await db.collection('users').get();
    if (usersSnapshot.empty) {
        return [];
    }
    return usersSnapshot.docs.map(doc => doc.id);
}

async function getAdminUserPreferences(userId: string): Promise<any> {
    const userDoc = await db.collection('users').doc(userId).get();
    if (userDoc.exists) {
        return userDoc.data() || {};
    }
    return {};
}

async function getAdminChatHistory(userId: string): Promise<ChatSummary[]> {
    const chatsRef = db.collection('chats');
    const q = chatsRef.where('ownerId', '==', userId).orderBy('updatedAt', 'desc').limit(50);
    const querySnapshot = await q.get();
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      title: doc.data().title,
      defaultModelId: doc.data().defaultModelId,
    }));
}


// This is the main function a cron job would call daily.
export async function runDailyRecommender() {
  console.log('Starting daily recommender job...');
  const userIds = await getAdminAllUserIds();
  
  for (const userId of userIds) {
    try {
      const prefs = await getAdminUserPreferences(userId);
      const userRecord = await adminAuth.getUser(userId);
      
      // Check if user wants push notifications and has been inactive
      if (prefs.notifications?.push && hasBeenInactive(prefs.lastSeen)) {
        console.log(`User ${userId} is inactive. Generating notification...`);
        
        const chatHistory = await getAdminChatHistory(userId);
        if (chatHistory.length === 0) continue; // Skip users with no chats

        const userName = userRecord.displayName || "there";

        const chatTitles = chatHistory.map(c => c.title);
        
        const notificationContent = await runRecommenderFlow({
            userName,
            chatTopics: chatTitles,
        });

        // Send multiple notifications as requested
        for (let i = 0; i < 2; i++) {
             await sendPushNotification({
                userId,
                title: notificationContent.title,
                body: `${notificationContent.body} (${i+1}/2)`,
            });
            // Add a small delay between notifications to avoid being too spammy
            await new Promise(resolve => setTimeout(resolve, 5000));
        }

        // We don't update lastSeen here, because we want to keep notifying them
        // until they log in again, which will update their lastSeen timestamp.
      }
    } catch (error) {
      console.error(`Failed to process user ${userId}:`, error);
    }
  }
  console.log('Daily recommender job finished.');
}


function hasBeenInactive(lastSeenTimestamp: any): boolean {
    if (!lastSeenTimestamp) return true; // If never seen, they are "inactive"
    
    // Convert Firestore Timestamp to Date if needed
    const lastSeenDate = lastSeenTimestamp.toDate ? lastSeenTimestamp.toDate() : new Date(lastSeenTimestamp);
    
    const oneDay = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const now = new Date();
    
    return (now.getTime() - lastSeenDate.getTime()) > oneDay;
}
