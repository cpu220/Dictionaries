import { getDB } from './db';
import { ICardService, Card } from '../types';

export class CardService implements ICardService {
  async getCard(id: string): Promise<Card | undefined> {
    const db = await getDB();
    return db.get('cards', id);
  }

  async getCardsByDeck(deckId: string): Promise<Card[]> {
    const db = await getDB();
    return db.getAllFromIndex('cards', 'deck_id', deckId);
  }

  async getDueCards(deckId: string, limit: number): Promise<Card[]> {
    const db = await getDB();
    const now = Date.now();
    // Get all cards for the deck
    // Optimization: In a real app with huge DB, we might want a compound index [deck_id+due]
    // For now, getting all cards for deck and filtering is acceptable for <10k cards per deck
    const cards = await db.getAllFromIndex('cards', 'deck_id', deckId);
    
    return cards
      .filter(card => (card.queue === 2 || card.queue === 3) && card.due <= now) // Review or Day Learn
      .sort((a, b) => a.due - b.due)
      .slice(0, limit);
  }

  async getNewCards(deckId: string, limit: number, order: 'random' | 'sequential'): Promise<Card[]> {
    const db = await getDB();
    const cards = await db.getAllFromIndex('cards', 'deck_id', deckId);
    
    let newCards = cards.filter(card => card.queue === 0); // New queue
    
    if (order === 'random') {
      // Fisher-Yates shuffle
      for (let i = newCards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newCards[i], newCards[j]] = [newCards[j], newCards[i]];
      }
    } else {
      newCards.sort((a, b) => a.due - b.due); // 'due' for new cards is the order index
    }

    return newCards.slice(0, limit);
  }

  async getLearnedCards(deckId?: string): Promise<Card[]> {
    const db = await getDB();
    let cards: Card[] = [];
    
    if (deckId) {
      cards = await db.getAllFromIndex('cards', 'deck_id', deckId);
    } else {
      cards = await db.getAll('cards');
    }
    
    // Filter for cards that are NOT New (queue != 0)
    // Or more strictly, type != 0. Let's use type != 0 as established in StatsService
    return cards.filter(card => card.type !== 0);
  }

  async addCard(card: Card): Promise<string> {
    const db = await getDB();
    await db.put('cards', card);
    return card.id;
  }

  async updateCard(card: Card): Promise<void> {
    const db = await getDB();
    await db.put('cards', card);
  }

  async deleteCardsByDeck(deckId: string): Promise<void> {
    const db = await getDB();
    const cards = await this.getCardsByDeck(deckId);
    const tx = db.transaction('cards', 'readwrite');
    const store = tx.objectStore('cards');
    await Promise.all(cards.map(card => store.delete(card.id)));
    await tx.done;
  }
}
