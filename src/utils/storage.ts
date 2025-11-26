import { UserProgress } from '@/interfaces';

const STORAGE_KEY = 'user_progress_v1';

export function saveProgress(progress: UserProgress) {
    if (typeof window === 'undefined') return;

    const allProgress = loadAllProgress();
    allProgress[progress.word_id] = progress;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(allProgress));
}

export function loadAllProgress(): Record<string, UserProgress> {
    if (typeof window === 'undefined') return {};

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};

    try {
        return JSON.parse(stored);
    } catch (e) {
        console.error('Failed to parse progress', e);
        return {};
    }
}

export function getProgress(wordId: string): UserProgress | null {
    const all = loadAllProgress();
    return all[wordId] || null;
}
