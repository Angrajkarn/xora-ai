
'use server';

import { db } from '@/lib/firebase-admin';
import { FieldValue, type DocumentData } from 'firebase-admin/firestore';
import type { SettingsData } from '@/lib/schemas';
import type { BadgeId } from '@/lib/types';
import { getTitleForLevel } from '@/lib/gamification';

const USERS_COLLECTION = 'users';

export interface UserProfile extends SettingsData {
    email?: string;
    lastSeen?: DocumentData;
    pushToken?: string | null;
    xp?: number;
    level?: number;
    title?: string;
    currentStreak?: number;
    longestStreak?: number;
    lastStreakUpdate?: DocumentData;
    badges?: BadgeId[];
    promptCount?: number;
}

export async function getOrCreateUserProfile(userId: string, email?: string | null): Promise<UserProfile> {
    const userDocRef = db.collection(USERS_COLLECTION).doc(userId);
    const docSnap = await userDocRef.get();
    if (docSnap.exists) {
        return docSnap.data() as UserProfile;
    } else {
        const newUserProfile: UserProfile = {
            email: email || '',
            xp: 0,
            level: 0,
            title: 'Newcomer',
            currentStreak: 0,
            longestStreak: 0,
            lastStreakUpdate: null,
            badges: [],
            promptCount: 0,
            notifications: { email: false, push: false, weeklySummary: false },
            ai: { defaultModel: 'smart-ai', responseStyle: 'balanced', voice: 'Algenib' },
        };
        await userDocRef.set(newUserProfile);
        return newUserProfile;
    }
}

export async function getUserPreferences(userId: string): Promise<UserProfile> {
    const userDocRef = db.collection(USERS_COLLECTION).doc(userId);
    const docSnap = await userDocRef.get();
    if (docSnap.exists) {
        return docSnap.data() as UserProfile;
    } else {
        // Return default preferences without creating a document
        return {
            xp: 0,
            level: 0,
            title: 'Newcomer',
            currentStreak: 0,
            longestStreak: 0,
            badges: [],
            promptCount: 0,
            notifications: { email: false, push: false, weeklySummary: false },
            ai: { defaultModel: 'smart-ai', responseStyle: 'balanced', voice: 'Algenib' },
        };
    }
}


export async function saveUserPreferences(userId: string, data: SettingsData): Promise<{success: boolean, error?: string}> {
    try {
        const userDocRef = db.collection(USERS_COLLECTION).doc(userId);
        const userProfile = await getOrCreateUserProfile(userId);

        const dataToSave: Partial<UserProfile> = { 
            ...data,
        };

        if (data.notifications.push && !userProfile.pushToken) {
            dataToSave.pushToken = `simulated-token-for-${userId}-${Date.now()}`;
        } else if (!data.notifications.push) {
            dataToSave.pushToken = null;
        }

        await userDocRef.set(dataToSave, { merge: true });
        return { success: true };
    } catch(error: any) {
        console.error("Error saving user preferences:", error);
        return { success: false, error: error.message };
    }
}

export async function updateUserLastSeen(userId: string): Promise<void> {
    try {
        const userDocRef = db.collection(USERS_COLLECTION).doc(userId);
        // Use set with merge:true to either create or update the document.
        await userDocRef.set({ lastSeen: FieldValue.serverTimestamp() }, { merge: true });
    } catch (error) {
        console.error(`Failed to update last seen for user ${userId}:`, error);
        // This is a non-critical operation, so we can swallow the error.
    }
}
