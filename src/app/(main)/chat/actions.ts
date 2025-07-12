'use server';

import { adminAuth } from '@/lib/firebase-admin';
import type { Author } from '@/lib/types';

// Helper to get user profiles from server-side
export async function getMemberProfiles(uids: string[]): Promise<Author[]> {
    if (!uids || uids.length === 0) return [];
    
    try {
        const userRecords = await adminAuth.getUsers(uids.map(uid => ({ uid })));
        
        return userRecords.users.map(record => ({
            uid: record.uid,
            name: record.displayName || record.email?.split('@')[0] || 'User',
            avatar: record.photoURL || undefined,
        }));
    } catch (error) {
        console.error("Error fetching member profiles:", error);
        // Fallback to UIDs if fetching fails, so the UI doesn't break
        return uids.map(uid => ({
            uid,
            name: `User ${uid.substring(0, 5)}...`,
            avatar: undefined,
        }));
    }
}
