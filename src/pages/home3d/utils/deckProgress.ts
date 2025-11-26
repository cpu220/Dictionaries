import { UserProgress } from '@/interfaces';
import { loadAllProgress } from '@/utils/storage';
import { getSessionsMap, loadSession } from '@/utils/storage/progress';
import { getWords } from '@/utils/data';

export interface DeckStats {
  totalWords: number;
  lowProficiency: UserProgress[];
  mediumProficiency: UserProgress[];
  highProficiency: UserProgress[];
}

export async function getDeckProgress(deckId: string): Promise<DeckStats> {
  const allProgress = loadAllProgress();
  
  console.log(`getDeckProgress for deck: ${deckId}`);
  
  // Load all words for this deck
  const deckWords = await getWords(deckId);
  console.log(`Loaded ${deckWords.length} words for deck ${deckId}`);
  
  // Get learned word IDs from sessions
  const sessionLearnedWordIds = new Set<string>();
  const sessionsMap = getSessionsMap();
  
  if (sessionsMap && sessionsMap.sessions) {
    for (const sessionId of sessionsMap.sessions) {
      const session = loadSession(sessionId);
      if (session && session.deckId === deckId) {
        // Words up to currentIndex are considered learned/encountered
        const learnedCount = session.currentIndex + 1;
        for (let i = 0; i < learnedCount && i < session.words.length; i++) {
          sessionLearnedWordIds.add(session.words[i].id);
        }
      }
    }
  }
  console.log(`Found ${sessionLearnedWordIds.size} words from sessions for deck ${deckId}`);

  // Filter progress to only include words from this deck
  const deckProgress: UserProgress[] = [];
  
  deckWords.forEach(word => {
    // 1. Check if there is explicit progress
    const progress = allProgress[word.id];
    if (progress) {
      deckProgress.push(progress);
    } 
    // 2. If no explicit progress, check if it was encountered in a session
    else if (sessionLearnedWordIds.has(word.id)) {
      // Create a default "low proficiency" progress for session-only words
      deckProgress.push({
        word_id: word.id,
        next_review_time: Date.now(),
        interval: 0,
        ease_factor: 0, // 0 ensures it goes to low proficiency (< 2.0)
        history: []
      });
    }
  });

  console.log(`Total words with progress (stored + session): ${deckProgress.length}`);

  const stats: DeckStats = {
    totalWords: deckProgress.length,
    lowProficiency: [],
    mediumProficiency: [],
    highProficiency: [],
  };

  deckProgress.forEach(progress => {
    if (progress.ease_factor < 2.0) {
      stats.lowProficiency.push(progress);
    } else if (progress.ease_factor < 2.5) {
      stats.mediumProficiency.push(progress);
    } else {
      stats.highProficiency.push(progress);
    }
  });

  console.log(`Stats for ${deckId}:`, {
    total: stats.totalWords,
    low: stats.lowProficiency.length,
    medium: stats.mediumProficiency.length,
    high: stats.highProficiency.length,
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
