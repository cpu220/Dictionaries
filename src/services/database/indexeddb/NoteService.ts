import { getDB } from './db';
import { INoteService, Note } from '../types';

export class NoteService implements INoteService {
  async getNote(id: string): Promise<Note | undefined> {
    const db = await getDB();
    return db.get('notes', id);
  }

  async addNote(note: Note): Promise<string> {
    const db = await getDB();
    await db.put('notes', note);
    return note.id;
  }

  async deleteNotesByDeck(deckId: string): Promise<void> {
    const db = await getDB();
    // Notes have an index on deck_id
    const notes = await db.getAllFromIndex('notes', 'deck_id', deckId);
    const tx = db.transaction('notes', 'readwrite');
    const store = tx.objectStore('notes');
    await Promise.all(notes.map(note => store.delete(note.id)));
    await tx.done;
  }
}
