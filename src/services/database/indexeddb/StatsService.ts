import { getDB } from './db';
import { DailyStudyStat, ReviewLog } from '../types';

export interface IStatsService {
  logReview(cardId: string, deckId: string, ease: number, time: number, oldCardType: number): Promise<void>;
  getDailyStats(date: string): Promise<DailyStudyStat | undefined>;
  syncDeckStats(deckId: string): Promise<void>;
  getLearnedCardsByDate(date: Date): Promise<string[]>; // Returns card IDs
  getAllDailyStats(): Promise<DailyStudyStat[]>; // Returns all daily stats
}

export class StatsService implements IStatsService {
  async logReview(cardId: string, deckId: string, ease: number, time: number, oldCardType: number): Promise<void> {
    const db = await getDB();
    const now = Date.now();
    const today = new Date().toISOString().split('T')[0];

    // 1. Add to Review Log
    const reviewLog: ReviewLog = {
      id: now,
      card_id: cardId,
      ease,
      interval: 0, 
      last_interval: 0,
      factor: 0,
      time,
      type: oldCardType, // Store the type BEFORE review
    };
    await db.add('revlog', reviewLog);

    // 2. Update Daily Stats
    const tx = db.transaction('daily_stats', 'readwrite');
    const dailyStore = tx.objectStore('daily_stats');
    let dailyStat = await dailyStore.get(today);

    if (!dailyStat) {
      dailyStat = {
        date: today,
        total_cards: 0,
        learned_cards: 0,
        review_cards: 0,
        time_spent: 0,
      };
    }

    dailyStat.total_cards += 1;
    dailyStat.time_spent += time;
    
    // If card was New (0) or Relearn (3), count as "Learned" for today's stats
    // This logic might need refinement based on exact definition of "Learned"
    if (oldCardType === 0 || oldCardType === 3) { 
      dailyStat.learned_cards += 1;
    } else {
      dailyStat.review_cards += 1;
    }

    await dailyStore.put(dailyStat);
    await tx.done;

    // 3. Update Deck Stats (Last Studied & Learned Count)
    const txDeck = db.transaction('decks', 'readwrite');
    const deckStore = txDeck.objectStore('decks');
    const deck = await deckStore.get(deckId);
    
    if (deck) {
      deck.last_studied = now;
      
      // If the card was previously NEW (0), increment learned_cards count
      if (oldCardType === 0) {
        deck.learned_cards = (deck.learned_cards || 0) + 1;
      }
      
      await deckStore.put(deck);
    }
    await txDeck.done;
  }

  async getDailyStats(date: string): Promise<DailyStudyStat | undefined> {
    const db = await getDB();
    return db.get('daily_stats', date);
  }

  // Helper to recalculate learned_cards from scratch for a deck
  // Useful for fixing data inconsistencies
  async syncDeckStats(deckId: string): Promise<void> {
    const db = await getDB();
    const tx = db.transaction(['cards', 'decks'], 'readwrite');
    const cardStore = tx.objectStore('cards');
    const deckStore = tx.objectStore('decks');

    const deck = await deckStore.get(deckId);
    if (!deck) return;

    const index = cardStore.index('deck_id');
    const cards = await index.getAll(deckId);
    
    // Count cards that are NOT New (type != 0)
    const learnedCount = cards.filter(c => c.type !== 0).length;
    
    if (deck.learned_cards !== learnedCount) {
      deck.learned_cards = learnedCount;
      await deckStore.put(deck);
    }
    
    await tx.done;
  }

  async getLearnedCardsByDate(date: Date): Promise<string[]> {
    const db = await getDB();
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const endOfDay = startOfDay + 86400000;
    const range = IDBKeyRange.bound(startOfDay, endOfDay);
    
    const logs = await db.getAll('revlog', range);
    
    // Filter for logs where type was 0 (New)
    // Note: This assumes 'type' in revlog is the oldCardType as we implemented in logReview
    const learnedLogEntries = logs.filter(log => log.type === 0);
    
    // Return unique card IDs
    return [...new Set(learnedLogEntries.map(log => log.card_id))];
  }

  async getAllDailyStats(): Promise<DailyStudyStat[]> {
    const db = await getDB();
    return db.getAll('daily_stats');
  }
}
