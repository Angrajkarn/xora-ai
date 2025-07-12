
'use server';

import { db } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import type { Message } from '@/lib/types';
import { runMemorySynthesizerFlow, type MemorySynthesizerOutput } from '@/ai/flows/memory-synthesizer-flow';

export async function getUserProfile(userId: string) {
    if (!userId) {
        throw new Error('User ID is required to get a profile.');
    }
    const userDocRef = db.collection('users').doc(userId);
    const docSnap = await userDocRef.get();

    if (!docSnap.exists) {
        // This case should ideally be handled by getOrCreateUserProfile on sign-up,
        // but as a fallback, we return a default structure.
        return {
            email: '',
            xp: 0,
            level: 0,
            title: 'Newcomer',
            currentStreak: 0,
            longestStreak: 0,
            lastStreakUpdate: null,
            badges: [],
        };
    }
    
    const data = docSnap.data()!;
    
    // Ensure timestamps are serializable for the client to prevent Next.js errors.
    if (data.lastStreakUpdate) {
        data.lastStreakUpdate = data.lastStreakUpdate.toDate().toISOString();
    }
    if (data.lastSeen) {
        data.lastSeen = data.lastSeen.toDate().toISOString();
    }
    
    return data;
}

// Fetches the most recent messages for profile synthesis.
async function getRecentUserHistory(userId: string): Promise<Pick<Message, 'role' | 'content'>[]> {
    const messagesRef = db.collectionGroup('messages').where('ownerId', '==', userId).orderBy('createdAt', 'desc').limit(50);
    const snapshot = await messagesRef.get();
    
    if (snapshot.empty) {
        return [];
    }

    const messages: Pick<Message, 'role' | 'content'>[] = [];
    snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.role && data.content) {
            messages.push({ role: data.role, content: data.content });
        }
    });
    
    // Reverse to maintain chronological order for the AI
    return messages.reverse();
}

export async function synthesizeAIProfile(userId: string, userName: string): Promise<MemorySynthesizerOutput | { error: string }> {
    if (!userId || !userName) {
        return { error: 'User ID and name are required.' };
    }
    try {
        const history = await getRecentUserHistory(userId);
        
        if (history.length < 5) {
            return { error: "Not enough conversation history to generate a profile. Chat a little more and try again!" };
        }
        
        const result = await runMemorySynthesizerFlow({ history, userName });
        return result;

    } catch (error: any) {
        console.error('Error synthesizing AI Profile:', error);
        return { error: 'An error occurred while analyzing your profile. Please try again later.' };
    }
}
