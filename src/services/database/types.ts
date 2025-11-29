export interface Deck {
  id: string;
  name: string;
  description: string;
  total_cards: number;
  learned_cards: number;
  created_at: number;
  updated_at: number;
  last_studied?: number; // Timestamp of last review
  metadata?: Record<string, any>;
}

export interface Note {
  id: string;
  deck_id: string;
  model_id: string;
  fields: Record<string, string>;
  tags: string[];
  created_at: number;
  updated_at: number;
}

export interface Card {
  id: string;
  note_id: string;
  deck_id: string;
  ord: number;
  template_name: string;
  front: string;
  back: string;
  word?: string; // Extracted word for Audio/TTS
  phonetic?: string; // Extracted phonetic for display/TTS
  created_at: number;
  // Scheduling fields
  type: number; // 0=new, 1=learning, 2=review, 3=relearning
  queue: number; // -1=suspended, 0=new, 1=learning, 2=review, 3=day learning
  due: number; // Date timestamp or order index
  interval: number; // Days
  factor: number; // Ease factor, default 2500
  reps: number;
  lapses: number;
}

export interface Model {
  id: string;
  name: string;
  fields: { name: string; ord: number }[];
  templates: { name: string; qfmt: string; afmt: string; ord: number }[];
  css: string;
}

export interface ReviewLog {
  id: number; // Timestamp
  card_id: string;
  ease: number; // 1=Again, 2=Hard, 3=Good, 4=Easy
  interval: number;
  last_interval: number;
  factor: number;
  time: number; // ms taken
  type: number; // 0=learn, 1=review, 2=relearn, 3=cram
}

export interface DailyStudyStat {
  date: string; // YYYY-MM-DD
  total_cards: number; // Total cards reviewed today
  learned_cards: number; // New cards learned today
  review_cards: number; // Review cards studied today
  time_spent: number; // Total time spent in ms
}

export interface IDeckService {
  getAllDecks(): Promise<Deck[]>;
  getDeck(id: string): Promise<Deck | undefined>;
  createDeck(deck: Deck): Promise<string>;
  updateDeck(deck: Deck): Promise<void>;
  deleteDeck(id: string): Promise<void>;
}

export interface ICardService {
  getCard(id: string): Promise<Card | undefined>;
  getCardsByDeck(deckId: string): Promise<Card[]>;
  getDueCards(deckId: string, limit: number): Promise<Card[]>;
  getNewCards(deckId: string, limit: number, order: 'random' | 'sequential'): Promise<Card[]>;
  getLearnedCards(deckId?: string): Promise<Card[]>;
  addCard(card: Card): Promise<string>;
  updateCard(card: Card): Promise<void>;
}

export interface INoteService {
  getNote(id: string): Promise<Note | undefined>;
  addNote(note: Note): Promise<string>;
}

export interface IModelService {
  getModel(id: string): Promise<Model | undefined>;
  addModel(model: Model): Promise<string>;
}
