import { getDB } from './db';
import { IDeckService, Deck } from '../types';
import { CardService } from './CardService';
import { NoteService } from './NoteService';

export class DeckService implements IDeckService {
  private cardService = new CardService();
  private noteService = new NoteService();

  async getAllDecks(): Promise<Deck[]> {
    const db = await getDB();
    return db.getAll('decks');
  }

  async getDeck(id: string): Promise<Deck | undefined> {
    const db = await getDB();
    return db.get('decks', id);
  }

  async createDeck(deck: Deck): Promise<string> {
    const db = await getDB();
    await db.put('decks', deck);
    return deck.id;
  }

  async updateDeck(deck: Deck): Promise<void> {
    const db = await getDB();
    await db.put('decks', deck);
  }

  async deleteDeck(id: string): Promise<void> {
    const db = await getDB();
    
    // Cascade delete: Cards -> Notes -> Deck
    await this.cardService.deleteCardsByDeck(id);
    await this.noteService.deleteNotesByDeck(id);
    
    await db.delete('decks', id);
  }
}
