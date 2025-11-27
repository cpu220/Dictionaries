import { UserProgress } from '@/interfaces';
import { loadAllProgress } from '@/utils/storage';
import { getSessionsMap, loadSession } from '@/utils/storage/progress';
import { getWords } from '@/utils/data';

import { DIFFICULTY_LEVELS } from '@/consts/difficulty';

export interface DeckStats {
  totalWords: number;
  again: UserProgress[];
  hard: UserProgress[];
  good: UserProgress[];
  easy: UserProgress[];
}

export async function getDeckProgress(deckId: string): Promise<DeckStats> {
  const allProgress = loadAllProgress();
  
  console.log(`getDeckProgress for deck: ${deckId}`);
  
  // Load all words for this deck
  const deckWords = await getWords(deckId);
  console.log(`Loaded ${deckWords.length} words for deck ${deckId}`);
  
  // Get learned word IDs and their results from sessions
  const sessionResults = new Map<string, number>();
  const sessionsMap = getSessionsMap();
  
  if (sessionsMap && sessionsMap.sessions) {
    for (const sessionId of sessionsMap.sessions) {
      const session = loadSession(sessionId);
      if (session && session.deckId === deckId) {
        // Words up to currentIndex are considered learned/encountered
        const learnedCount = session.currentIndex + 1;
        for (let i = 0; i < learnedCount && i < session.words.length; i++) {
          const wordObj = session.words[i];
          if (wordObj.result !== undefined) {
             sessionResults.set(wordObj.id, wordObj.result);
          } else if (!sessionResults.has(wordObj.id)) {
             // If no result but encountered, default to AGAIN value
             sessionResults.set(wordObj.id, DIFFICULTY_LEVELS.AGAIN.value);
          }
        }
      }
    }
  }
  console.log(`Found ${sessionResults.size} words from sessions for deck ${deckId}`);

  // Filter progress to only include words from this deck
  const deckProgress: UserProgress[] = [];
  
  // Helper to get result value for a word
  const getWordResult = (wordId: string): number => {
      // 1. Check session result first (most recent interaction)
      if (sessionResults.has(wordId)) {
          return sessionResults.get(wordId)!;
      }
      // 2. Check stored progress (ease_factor mapping is tricky, so let's rely on session result for now if available)
      // If we only have stored progress (e.g. from old version), we might need to map ease_factor back to result.
      // For now, let's assume if it's in allProgress but not in sessionResults, we treat it as 'Good' or based on ease?
      // Actually, let's just use the session result logic for coloring.
      // If we want to support long-term storage coloring, we'd need to store the 'last_result' in UserProgress.
      // But for this task, the user emphasized session results.
      return 0; // Not learned
  };

  deckWords.forEach(word => {
    const result = getWordResult(word.id);
    if (result > 0) {
        deckProgress.push({
            word_id: word.id,
            next_review_time: Date.now(),
            interval: 0,
            ease_factor: result, // Storing result in ease_factor for temporary passing
            history: []
        });
    }
  });

  console.log(`Total words with progress: ${deckProgress.length}`);

  const stats: DeckStats = {
    totalWords: deckProgress.length,
    again: [],
    hard: [],
    good: [],
    easy: [],
  };

  deckProgress.forEach(progress => {
    const result = progress.ease_factor; // We stored result here
    if (result === DIFFICULTY_LEVELS.AGAIN.value) {
        stats.again.push(progress);
    } else if (result === DIFFICULTY_LEVELS.HARD.value) {
        stats.hard.push(progress);
    } else if (result === DIFFICULTY_LEVELS.GOOD.value) {
        stats.good.push(progress);
    } else if (result === DIFFICULTY_LEVELS.EASY.value) {
        stats.easy.push(progress);
    }
  });

  console.log(`Stats for ${deckId}:`, {
    total: stats.totalWords,
    again: stats.again.length,
    hard: stats.hard.length,
    good: stats.good.length,
    easy: stats.easy.length,
  });

  return stats;
}

export async function getAllDecksProgress(deckIds: string[]): Promise<Record<string, DeckStats>> {
  const result: Record<string, DeckStats> = {};
  
  for (const deckId of deckIds) {
    result[deckId] = await getDeckProgress(deckId);
  }

  return result;
}
