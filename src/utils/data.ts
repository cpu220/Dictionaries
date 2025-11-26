import { Word } from '@/interfaces';
import { RANDOM_LETTER_COUNT } from '@/consts';
import cet4Data from '@/assets/data/cet4/cet4_imported.json';

export async function getWords(deckName: string = 'cet4'): Promise<Word[]> {
    // In this Umi version, we import the JSON directly.
    // deckName is kept for compatibility but currently only cet4 is supported via import.
    if (deckName === 'cet4' || deckName === 'cet4_imported') {
        return cet4Data as Word[];
    }
    return [];
}

/**
 * Get all available letters for a deck
 */
export function getAvailableLetters(): string[] {
    // A-Z + Other
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    letters.push('Other');
    return letters;
}

/**
 * Load words from specific letters for the cet4_imported deck
 */
export async function getWordsByLetters(letters: string[]): Promise<Word[]> {
    const allWords: Word[] = cet4Data as Word[];
    
    return allWords.filter(word => {
        if (!word.word) return false;
        const firstChar = word.word.charAt(0).toUpperCase();
        if (letters.includes(firstChar)) {
            return true;
        }
        // Handle 'Other' if needed, or if letter is not A-Z
        if (letters.includes('Other') && !/[A-Z]/.test(firstChar)) {
            return true;
        }
        return false;
    });
}

/**
 * Load words from random letters
 */
export async function getWordsRandom(count: number = RANDOM_LETTER_COUNT): Promise<Word[]> {
    const availableLetters = getAvailableLetters();
    
    // Shuffle and pick random letters
    const shuffled = [...availableLetters].sort(() => Math.random() - 0.5);
    const selectedLetters = shuffled.slice(0, count);
    
    return getWordsByLetters(selectedLetters);
}
