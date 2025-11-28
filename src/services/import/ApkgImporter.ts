import JSZip from 'jszip';
import initSqlJs from 'sql.js';
import { DeckService } from '../database/indexeddb/DeckService';
import { NoteService } from '../database/indexeddb/NoteService';
import { CardService } from '../database/indexeddb/CardService';
import { ModelService } from '../database/indexeddb/ModelService';
import { Deck, Note, Card, Model } from '../database/types';

export class ApkgImporter {
  private deckService = new DeckService();
  private noteService = new NoteService();
  private cardService = new CardService();
  private modelService = new ModelService();

  async import(file: File, onProgress?: (progress: number, message: string) => void): Promise<void> {
    onProgress?.(0, 'Unzipping file...');
    const zip = await JSZip.loadAsync(file);
    
    const colFile = zip.file('collection.anki2');
    if (!colFile) {
      throw new Error('Invalid .apkg file: collection.anki2 not found');
    }

    onProgress?.(10, 'Reading database...');
    const colData = await colFile.async('uint8array');
    
    // Initialize sql.js
    // Note: You need to make sure sql-wasm.wasm is available in your public folder or configured correctly
    const SQL = await initSqlJs({
      locateFile: file => `https://sql.js.org/dist/${file}` // Use CDN for now, or local path
    });
    
    const db = new SQL.Database(colData);

    onProgress?.(20, 'Parsing decks...');
    // Anki stores decks in the 'col' table, 'decks' column as JSON
    const colResult = db.exec("SELECT decks, models FROM col");
    const decksJson = colResult[0].values[0][0] as string;
    const modelsJson = colResult[0].values[0][1] as string;
    
    const ankiDecks = JSON.parse(decksJson);
    const ankiModels = JSON.parse(modelsJson);

    // Import Models
    onProgress?.(30, 'Importing models...');
    for (const mid in ankiModels) {
      const m = ankiModels[mid];
      const model: Model = {
        id: mid,
        name: m.name,
        fields: m.flds.map((f: any) => ({ name: f.name, ord: f.ord })),
        templates: m.tmpls.map((t: any) => ({ name: t.name, qfmt: t.qfmt, afmt: t.afmt, ord: t.ord })),
        css: m.css
      };
      await this.modelService.addModel(model);
    }

    // Import Decks
    const deckIdMap: Record<string, string> = {};
    for (const did in ankiDecks) {
      const d = ankiDecks[did];
      if (d.dyn) continue; // Skip dynamic decks

      // Check if deck already exists
      const existingDeck = await this.deckService.getDeck(did);
      if (existingDeck) {
        console.warn(`Deck ${d.name} (${did}) already exists. Skipping creation.`);
        deckIdMap[did] = did;
        continue;
      }

      const deck: Deck = {
        id: did,
        name: d.name,
        description: d.desc || '',
        total_cards: 0, // Will update later
        learned_cards: 0,
        created_at: Date.now(),
        updated_at: Date.now(),
        metadata: { original_conf: d.conf }
      };
      await this.deckService.createDeck(deck);
      deckIdMap[did] = did;
    }

    // Import Notes
    onProgress?.(40, 'Importing notes...');
    const notesResult = db.exec("SELECT id, mid, flds, tags FROM notes");
    const notes = notesResult[0].values;
    
    const noteIdMap: Record<string, string> = {};
    
    for (const n of notes) {
      const [id, mid, flds, tags] = n as [number, number, string, string];
      const noteId = id.toString();
      const modelId = mid.toString();
      
      // Fields are separated by 0x1f
      const fieldValues = flds.split('\x1f');
      const model = ankiModels[modelId];
      const fieldsMap: Record<string, string> = {};
      
      if (model) {
        model.flds.forEach((f: any, idx: number) => {
          if (idx < fieldValues.length) {
            fieldsMap[f.name] = fieldValues[idx];
          }
        });
      }

      const note: Note = {
        id: noteId,
        deck_id: '', // Will be set by cards, or we can find it from cards
        model_id: modelId,
        fields: fieldsMap,
        tags: tags.split(' ').filter(t => t),
        created_at: id,
        updated_at: Date.now()
      };
      
      await this.noteService.addNote(note);
      noteIdMap[noteId] = noteId;
    }

    // Import Cards
    onProgress?.(60, 'Importing cards...');
    const cardsResult = db.exec("SELECT id, nid, did, ord, type, queue, due, ivl, factor, reps, lapses FROM cards");
    const cards = cardsResult[0].values;
    
    let processedCards = 0;
    const totalCards = cards.length;

    for (const c of cards) {
      const [id, nid, did, ord, type, queue, due, ivl, factor, reps, lapses] = c as any[];
      const cardId = id.toString();
      const noteId = nid.toString();
      const deckId = did.toString();

      // Find template name
      const note = await this.noteService.getNote(noteId);
      let templateName = '';
      let front = '';
      let back = '';
      let word = '';
      let phonetic = '';

      if (note) {
        // Update note's deck_id if not set
        if (!note.deck_id) {
          note.deck_id = deckId;
          await this.noteService.addNote(note);
        }

        const model = await this.modelService.getModel(note.model_id);
        if (model) {
          const tmpl = model.templates.find(t => t.ord === ord);
          if (tmpl) {
            templateName = tmpl.name;
            front = this.renderTemplate(tmpl.qfmt, note.fields);
            back = this.renderTemplate(tmpl.afmt, note.fields);
          }

          // Extract Word and Phonetic
          // Extract Word and Phonetic
          // Strategy:
          // 1. Identify the 'Word' field (or fallback to first field)
          // 2. Identify the 'Phonetic' field
          // 3. If Phonetic field is empty, try to extract it from the Word field
          // 4. Clean the Word field (remove phonetics, stats, newlines)
          
          const fieldNames = Object.keys(note.fields);
          
          // 1. Find 'Word' field
          let wordFieldName = fieldNames.find(f => ['word', '单词', 'expression', 'front', 'term'].includes(f.toLowerCase()));
          if (!wordFieldName && fieldNames.length > 0) {
            wordFieldName = fieldNames[0]; // Fallback to first field
          }
          
          let rawWord = '';
          if (wordFieldName) {
            rawWord = this.stripHtml(note.fields[wordFieldName]);
          }

          // 2. Find 'Phonetic' field
          let phoneticFieldName = fieldNames.find(f => ['phonetic', '音标', 'ipa', 'us phonetic', 'uk phonetic'].includes(f.toLowerCase()));
          let rawPhonetic = '';
          if (phoneticFieldName) {
            rawPhonetic = this.stripHtml(note.fields[phoneticFieldName]);
          }

          // 3. Extract Phonetic from Word if missing
          if (!rawPhonetic && rawWord) {
            // Look for [...] or /.../
            const match = rawWord.match(/\[.*?\]|\/.*?\//);
            if (match) {
              rawPhonetic = match[0];
            }
          }

          // 4. Clean Word
          // Remove [...]
          word = rawWord.replace(/\[.*?\]/g, '');
          // Remove (...)
          word = word.replace(/\(.*?\)/g, '');
          // Remove /.../
          word = word.replace(/\/.*?\//g, '');
          // Take first line only
          word = word.split('\n')[0];
          // Trim
          word = word.trim();

          // Clean Phonetic
          phonetic = rawPhonetic.trim();

        }
      }

      const card: Card = {
        id: cardId,
        note_id: noteId,
        deck_id: deckId,
        ord: ord,
        template_name: templateName,
        front,
        back,
        word,
        phonetic,
        created_at: id,
        type,
        queue,
        due,
        interval: ivl,
        factor,
        reps,
        lapses
      };

      await this.cardService.addCard(card);
      
      processedCards++;
      if (processedCards % 100 === 0) {
        onProgress?.(60 + Math.floor((processedCards / totalCards) * 30), `Importing cards ${processedCards}/${totalCards}...`);
      }
    }

    // Update Deck Counts
    onProgress?.(95, 'Updating deck counts...');
    const allDecks = await this.deckService.getAllDecks();
    for (const deck of allDecks) {
      const cards = await this.cardService.getCardsByDeck(deck.id);
      deck.total_cards = cards.length;
      deck.learned_cards = cards.filter(c => c.queue > 0).length;
      await this.deckService.updateDeck(deck);
    }

    onProgress?.(100, 'Import complete!');
    // Don't close DB here as we might need it? Actually we opened it with SQL.js which is in-memory.
    // The IndexedDB connection is managed by getDB().
    // db.close(); // SQL.js db close
  }

  private renderTemplate(template: string, fields: Record<string, string>): string {
    let result = template;
    
    // 1. Handle basic {{Field}} replacement
    for (const [key, value] of Object.entries(fields)) {
      // Handle {{Field}}
      const regex = new RegExp(`\\{\\{${this.escapeRegExp(key)}\\}\\}`, 'g');
      result = result.replace(regex, value);

      // Handle {{type:Field}} - usually for typing input, just show value for now
      const typeRegex = new RegExp(`\\{\\{type:${this.escapeRegExp(key)}\\}\\}`, 'g');
      result = result.replace(typeRegex, value);

      // Handle {{text:Field}} - strip html
      const textRegex = new RegExp(`\\{\\{text:${this.escapeRegExp(key)}\\}\\}`, 'g');
      result = result.replace(textRegex, this.stripHtml(value));
    }

    // 2. Handle Conditional {{#Field}}...{{/Field}}
    // Simple implementation: if field has content, show inner; else remove
    for (const [key, value] of Object.entries(fields)) {
      const hasContent = value && value.trim().length > 0;
      
      // Positive condition {{#Field}}...{{/Field}}
      const posRegex = new RegExp(`\\{\\{#${this.escapeRegExp(key)}\\}\\}([\\s\\S]*?)\\{\\{/${this.escapeRegExp(key)}\\}\\}`, 'g');
      result = result.replace(posRegex, hasContent ? '$1' : '');

      // Negative condition {{^Field}}...{{/Field}}
      const negRegex = new RegExp(`\\{\\{\\^${this.escapeRegExp(key)}\\}\\}([\\s\\S]*?)\\{\\{/${this.escapeRegExp(key)}\\}\\}`, 'g');
      result = result.replace(negRegex, !hasContent ? '$1' : '');
    }

    // 3. Cleanup remaining {{...}} tags that weren't replaced (optional, but cleaner)
    // result = result.replace(/\{\{.*?\}\}/g, ''); 

    return result;
  }

  private escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private stripHtml(html: string): string {
    if (!html) return '';
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    let text = tmp.textContent || tmp.innerText || '';
    // Remove [sound:...] tags
    text = text.replace(/\[sound:.*?\]/g, '');
    // Remove {{...}} tags if any remain in the text
    text = text.replace(/\{\{.*?\}\}/g, '');
    return text.trim();
  }
}
