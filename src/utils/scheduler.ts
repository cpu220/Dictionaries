import { UserProgress } from '@/interfaces';

// Standard SM-2 Algorithm parameters
const DEFAULT_EASE = 2.5;
const MIN_EASE = 1.3;

export interface ReviewResult {
    nextReviewTime: number;
    interval: number;
    easeFactor: number;
}

/**
 * Calculates the next review schedule based on the score.
 * Score: 1 (Again), 5 (Hard), 8 (Good), 10 (Easy)
 * We map these to SM-2 quality: 0-5.
 * 
 * Mapping:
 * 1 (Again) -> 0 (Fail)
 * 5 (Hard)  -> 3 (Pass, hard)
 * 8 (Good)  -> 4 (Pass, good)
 * 10 (Easy) -> 5 (Pass, easy)
 */
export function calculateNextReview(
    currentInterval: number,
    currentEase: number,
    score: number
): ReviewResult {
    let quality = 0;
    if (score === 1) quality = 0;
    else if (score === 5) quality = 3;
    else if (score === 8) quality = 4;
    else if (score === 10) quality = 5;

    let nextInterval: number;
    let nextEase = currentEase;

    if (quality < 3) {
        // Failed, reset interval
        nextInterval = 1;
        // Ease factor doesn't change on fail in standard SM-2, or can decrease.
        // We'll keep it same or slightly decrease? Let's keep it simple.
    } else {
        // Success
        if (currentInterval === 0) {
            nextInterval = 1;
        } else if (currentInterval === 1) {
            nextInterval = 6;
        } else {
            nextInterval = Math.round(currentInterval * currentEase);
        }

        // Update Ease Factor
        // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
        nextEase = currentEase + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        if (nextEase < MIN_EASE) nextEase = MIN_EASE;
    }

    // Calculate timestamp
    const now = Date.now();
    const nextReviewTime = now + nextInterval * 24 * 60 * 60 * 1000;

    return {
        nextReviewTime,
        interval: nextInterval,
        easeFactor: nextEase,
    };
}

export function getInitialProgress(wordId: string): UserProgress {
    return {
        word_id: wordId,
        next_review_time: 0, // Ready to review
        interval: 0,
        ease_factor: DEFAULT_EASE,
        history: [],
    };
}
