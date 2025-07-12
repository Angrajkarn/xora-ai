import { TITLES, LEVEL_UP_BASE_XP, LEVEL_UP_FACTOR } from '@/lib/constants';

export function calculateLevel(xp: number) {
    let level = 0;
    let requiredXp = LEVEL_UP_BASE_XP;
    while (xp >= requiredXp) {
        xp -= requiredXp;
        level++;
        requiredXp *= LEVEL_UP_FACTOR;
    }
    return { level, xpForNextLevel: requiredXp, currentLevelXp: xp };
}

export function getTitleForLevel(level: number): string {
    return TITLES.slice().reverse().find(t => level >= t.level)?.title || 'Newcomer';
}
