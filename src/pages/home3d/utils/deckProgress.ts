import { UserProgress } from '@/interfaces';
import { loadAllProgress } from '@/utils/storage';
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
  console.log('All progress keys:', Object.keys(allProgress));
  
  // Load all words for this deck
  const deckWords = await getWords(deckId);
  console.log(`Loaded ${deckWords.length} words for deck ${deckId}`);
  
  // Filter progress to only include words from this deck
  const deckProgress: UserProgress[] = [];
  deckWords.forEach(word => {
    const progress = allProgress[word.id];
    if (progress) {
      console.log(`  ✓ Found progress for word: ${word.word} (${word.id})`);
      deckProgress.push(progress);
    }
  });

  console.log(`Found ${deckProgress.length} words with progress for deck ${deckId}`);

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
