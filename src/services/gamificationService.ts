
'use server';

import { db } from '@/lib/firebase-admin';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import type { BadgeId, ModelId } from '@/lib/types';
import { BADGES, MODELS, XP_PER_PROMPT, XP_PER_STREAK_DAY } from '@/lib/constants';
import { getOrCreateUserProfile, UserProfile } from './userService';
import { getTitleForLevel, calculateLevel } from '@/lib/gamification';


// This is a more performant way to check for badges that don't require a full history scan.
async function checkNewBadges(userProfile: UserProfile, newBadges: BadgeId[]): Promise<BadgeId[]> {
    const badgesToAward: BadgeId[] = [];
    const existingBadges = userProfile.badges || [];

    const award = (badgeId: BadgeId) => {
        if (!existingBadges.includes(badgeId) && !newBadges.includes(badgeId)) {
            badgesToAward.push(badgeId);
        }
    };
    
    // Check for new badges passed in as a hint
    newBadges.forEach(award);

    // Check for badges based on user profile stats
    if(userProfile.promptCount && userProfile.promptCount >= 1) award('FIRST_STEPS');
    if(userProfile.promptCount && userProfile.promptCount >= 10) award('PROMPT_10');
    if(userProfile.promptCount && userProfile.promptCount >= 100) award('PROMPT_100');
    if(userProfile.promptCount && userProfile.promptCount >= 500) award('PROMPT_500');
    
    if(userProfile.currentStreak && userProfile.currentStreak >= 3) award('3_DAY_STREAK');
    if(userProfile.currentStreak && userProfile.currentStreak >= 7) award('7_DAY_STREAK');
    if(userProfile.currentStreak && userProfile.currentStreak >= 14) award('14_DAY_STREAK');
    if(userProfile.currentStreak && userProfile.currentStreak >= 30) award('30_DAY_STREAK');

    // For more complex badges, a separate, less frequent process would be needed.
    // For now, we focus on what can be checked efficiently.

    return badgesToAward;
}


export async function updateUserActivity(userId: string, badgeHint?: BadgeId) {
    const userDocRef = db.collection('users').doc(userId);

    try {
        await db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userDocRef);
            if (!userDoc.exists) {
                // If the profile doesn't exist, getOrCreate will handle it, but we can't do that in a transaction.
                // The signup flow should create the user profile. If it's missing, we'll create it outside a transaction.
                // For now, we'll log an error and exit the transaction.
                console.error(`User profile for ${userId} not found during transaction. A profile should be created on signup.`);
                return;
            }
            
            const userProfile = userDoc.data() as UserProfile;

            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            const lastUpdateDate = userProfile.lastStreakUpdate ? (userProfile.lastStreakUpdate as Timestamp).toDate() : null;
            const lastUpdateDay = lastUpdateDate ? new Date(lastUpdateDate.getFullYear(), lastUpdateDate.getMonth(), lastUpdateDate.getDate()) : null;

            let currentStreak = userProfile.currentStreak || 0;
            let longestStreak = userProfile.longestStreak || 0;
            let xp = userProfile.xp || 0;
            let streakXp = 0;

            if (!lastUpdateDay || lastUpdateDay.getTime() < today.getTime()) {
                const yesterday = new Date(today);
                yesterday.setDate(today.getDate() - 1);
                
                if (lastUpdateDay && lastUpdateDay.getTime() === yesterday.getTime()) {
                    currentStreak++;
                    streakXp = XP_PER_STREAK_DAY;
                } else {
                    currentStreak = 1;
                }

                if (currentStreak > longestStreak) {
                    longestStreak = currentStreak;
                }
            }
            
            xp += XP_PER_PROMPT + streakXp;

            const { level } = calculateLevel(xp);
            const newTitle = getTitleForLevel(level);
            
            const promptCount = (userProfile.promptCount || 0) + 1;
            
            const updatedProfile: Partial<UserProfile> = {
                lastSeen: FieldValue.serverTimestamp(),
                lastStreakUpdate: FieldValue.serverTimestamp(),
                currentStreak,
                longestStreak,
                xp,
                level,
                title: newTitle,
                promptCount,
            };

            const badgesToAward = await checkNewBadges({ ...userProfile, ...updatedProfile }, badgeHint ? [badgeHint] : []);
            
            if (badgesToAward.length > 0) {
                updatedProfile.badges = FieldValue.arrayUnion(...badgesToAward) as any;
                console.log(`Awarding new badges to ${userId}: ${badgesToAward.join(', ')}`);
            }
            
            transaction.update(userDocRef, updatedProfile);
        });
    } catch (error) {
        console.error(`Transaction failed for updateUserActivity for user ${userId}:`, error);
        // Fallback for the case where the user profile doesn't exist yet
        const profile = await getOrCreateUserProfile(userId);
        if(!profile.promptCount) { // A proxy to check if it's a new profile
            const freshUpdate: Partial<UserProfile> = {
                lastSeen: FieldValue.serverTimestamp(),
                lastStreakUpdate: FieldValue.serverTimestamp(),
                currentStreak: 1,
                longestStreak: 1,
                xp: XP_PER_PROMPT,
                level: 0,
                title: 'Newcomer',
                promptCount: 1,
                badges: FieldValue.arrayUnion('FIRST_STEPS') as any,
            };
            await userDocRef.update(freshUpdate);
        }
    }
}
