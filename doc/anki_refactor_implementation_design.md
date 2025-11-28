# Anki Refactor Implementation Design

## 1. Overview

This document outlines the design for refactoring the current card system to an Anki-like architecture.
Key goals:

- **Local Storage**: Use IndexedDB to store large datasets (100MB+).
- **Import**: Support `.apkg` file upload and parsing.
- **Scheduling**: Implement Spaced Repetition (SM-2) + Custom/Random order for new cards.
- **Abstraction**: Encapsulate data access to allow future migration (e.g., to MySQL).

## 2. Database Schema (IndexedDB)

We will use `idb` (a Promise-based wrapper for IndexedDB) for implementation.
Database Name: `AnkiDB`
Version: `1`

### Stores

#### `decks`

Metadata for card decks.

- `id` (string, PK): UUID or Anki Deck ID.
- `name` (string): Deck name.
- `description` (string).
- `config` (object): { `newCardOrder`: 'random' | 'sequential', ... }

#### `models` (Note Types)

Templates and field definitions.

- `id` (string, PK): Anki Model ID.
- `name` (string).
- `fields` (array): `[{ name: 'Front', ord: 0 }, { name: 'Back', ord: 1 }, ...]`
- `css` (string).
- `templates` (array): `[{ name: 'Card 1', qfmt: '...', afmt: '...' }, ...]`

#### `notes`

The actual data content.

- `id` (string, PK): UUID or Anki Note ID.
- `modelId` (string, FK -> models.id).
- `deckId` (string, FK -> decks.id).
- `fields` (array): `['Content for field 0', 'Content for field 1', ...]`
- `tags` (array).

#### `cards`

The study units generated from notes.

- `id` (string, PK): UUID or Anki Card ID.
- `noteId` (string, FK -> notes.id).
- `deckId` (string, FK -> decks.id).
- `ord` (number): Template index (which card template this is).
- `type` (number): 0=new, 1=learning, 2=review, 3=relearning.
- `queue` (number): Queue type (same as type usually, but -1 for suspended).
- `due` (number): Due date (timestamp for reviews, order index for new cards).
- `interval` (number): Interval in days.
- `factor` (number): Ease factor (default 2500).
- `reps` (number): Number of reviews.
- `lapses` (number): Number of times forgotten.

#### `revlog` (Review Log)

History for analysis and undo.

- `id` (number, PK): Timestamp.
- `cardId` (string, FK -> cards.id).
- `ease` (number): Button pressed (1=Again, 2=Hard, 3=Good, 4=Easy).
- `interval` (number): New interval.
- `lastInterval` (number).
- `factor` (number).
- `time` (number): Time taken in ms.

## 3. Data Access Layer (DAL)

To satisfy the requirement of easy migration to MySQL, all data operations will be encapsulated in a `Service` layer. The UI will strictly use these services.

### Interface Definition (`src/services/database/types.ts`)

```typescript
export interface IDeckService {
  getAllDecks(): Promise<Deck[]>;
  getDeck(id: string): Promise<Deck | undefined>;
  createDeck(deck: Deck): Promise<string>;
  // ...
}

export interface ICardService {
  getDueCards(deckId: string, limit: number): Promise<Card[]>;
  getNewCards(
    deckId: string,
    limit: number,
    order: "random" | "sequential"
  ): Promise<Card[]>;
  answerCard(cardId: string, ease: number): Promise<void>; // Handles scheduling logic
  // ...
}

export interface IImportService {
  importApkg(file: File): Promise<void>;
}
```

### Implementation (`src/services/database/indexeddb/`)

We will implement these interfaces using IndexedDB. If migration is needed, we simply create `src/services/database/mysql/` and switch the provider.

## 4. Scheduling Algorithm

We will implement a simplified Anki scheduler (SM-2 based).

### Queues

1.  **New Queue**: Cards never studied.
    - Sorted by `due` (which acts as an index).
    - User setting: "Random" (shuffle `due` on import) or "Sequential" (keep original order).
2.  **Learning Queue**: Cards in short-term learning steps (e.g., 1min, 10min).
3.  **Review Queue**: Cards graduated to long-term scheduling.
    - Sorted by `due` (timestamp).

### Logic

- **Get Cards**:
  - Fetch `Review` cards where `due <= now`.
  - Fetch `Learning` cards where `due <= now`.
  - Fetch `New` cards up to daily limit.
- **Answer Card**:
  - Calculate new `interval` and `factor` based on current state and rating (Again/Hard/Good/Easy).
  - Update `due` date.
  - Move between queues (New -> Learning -> Review).

## 5. Import Flow (.apkg)

1.  **Upload Page**: A new page `/import`.
2.  **File Parsing**:
    - Use `jszip` to unzip `.apkg`.
    - Read `collection.anki2` (SQLite) using `sql.js` (wasm).
    - Extract media files (images/audio) and store them (Blob/File in IndexedDB or just references if using local server, but for pure web, IndexedDB Blob storage is best for offline). _Note: Storing 100MB+ media in IDB is fine._
3.  **Data Mapping**:
    - Map SQLite tables (`col`, `notes`, `cards`, `revlog`) to our IDB schema.
    - Handle the `fields` splitting (Anki stores fields as a joined string with `0x1f` separator).
4.  **Progress**: Show a progress bar during import.

## 6. UI Structure

- `/decks`: List of decks.
- `/decks/:id/study`: The study interface.
  - Shows Front of card.
  - "Show Answer" button.
  - Shows Back of card + Rating buttons (Again, Hard, Good, Easy).
- `/import`: Upload `.apkg`.
