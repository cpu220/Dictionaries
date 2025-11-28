import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Deck, Note, Card, Model, ReviewLog } from '../types';

interface AnkiDB extends DBSchema {
  decks: {
    key: string;
    value: Deck;
    indexes: { 'name': string };
  };
  notes: {
    key: string;
    value: Note;
    indexes: { 'deck_id': string };
  };
  cards: {
    key: string;
    value: Card;
    indexes: { 
      'note_id': string;
      'deck_id': string;
      'due': number;
    };
  };
  models: {
    key: string;
    value: Model;
    indexes: { 'name': string };
  };
  revlog: {
    key: number;
    value: ReviewLog;
    indexes: { 'card_id': string };
  };
}

const DB_NAME = 'AnkiWebDB';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<AnkiDB>>;

export const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<AnkiDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Decks
        const deckStore = db.createObjectStore('decks', { keyPath: 'id' });
        deckStore.createIndex('name', 'name', { unique: true });

        // Notes
        const noteStore = db.createObjectStore('notes', { keyPath: 'id' });
        noteStore.createIndex('deck_id', 'deck_id', { unique: false });

        // Cards
        const cardStore = db.createObjectStore('cards', { keyPath: 'id' });
        cardStore.createIndex('note_id', 'note_id', { unique: false });
        cardStore.createIndex('deck_id', 'deck_id', { unique: false });
        cardStore.createIndex('due', 'due', { unique: false });

        // Models
        const modelStore = db.createObjectStore('models', { keyPath: 'id' });
        modelStore.createIndex('name', 'name', { unique: true });

        // Review Log
        const revlogStore = db.createObjectStore('revlog', { keyPath: 'id' });
        revlogStore.createIndex('card_id', 'card_id', { unique: false });
      },
    });
  }
  return dbPromise;
};
