import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Deck, Note, Card, Model, ReviewLog, DailyStudyStat } from '../types';

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
  daily_stats: {
    key: string;
    value: DailyStudyStat;
  };
}

const DB_NAME = 'AnkiWebDB';
const DB_VERSION = 3;

let dbPromise: Promise<IDBPDatabase<AnkiDB>>;

export const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<AnkiDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        // Decks
        if (!db.objectStoreNames.contains('decks')) {
          const deckStore = db.createObjectStore('decks', { keyPath: 'id' });
          deckStore.createIndex('name', 'name', { unique: true });
        }

        // Notes
        if (!db.objectStoreNames.contains('notes')) {
          const noteStore = db.createObjectStore('notes', { keyPath: 'id' });
          noteStore.createIndex('deck_id', 'deck_id', { unique: false });
        }

        // Cards
        if (!db.objectStoreNames.contains('cards')) {
          const cardStore = db.createObjectStore('cards', { keyPath: 'id' });
          cardStore.createIndex('note_id', 'note_id', { unique: false });
          cardStore.createIndex('deck_id', 'deck_id', { unique: false });
          cardStore.createIndex('due', 'due', { unique: false });
        }

        // Models
        if (!db.objectStoreNames.contains('models')) {
          const modelStore = db.createObjectStore('models', { keyPath: 'id' });
          modelStore.createIndex('name', 'name', { unique: true });
        }

        // Review Log
        if (!db.objectStoreNames.contains('revlog')) {
          const revlogStore = db.createObjectStore('revlog', { keyPath: 'id' });
          revlogStore.createIndex('card_id', 'card_id', { unique: false });
        }

        // New stores for version 2
        if (oldVersion < 2) {
          // Daily Stats
          if (!db.objectStoreNames.contains('daily_stats')) {
            db.createObjectStore('daily_stats', { keyPath: 'date' });
          }
        }
        
        // Version 3: Remove deck_usage if exists (optional cleanup, or just ignore)
        // if (oldVersion < 3) {
        //      // @ts-ignore
        //      if (db.objectStoreNames.contains('deck_usage')) {
        //         // @ts-ignore
        //         db.deleteObjectStore('deck_usage');
        //      }
        // }
      },
    });
  }
  return dbPromise;
};
