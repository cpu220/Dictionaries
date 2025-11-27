import { Word } from '@/interfaces';
import { RANDOM_LETTER_COUNT } from '@/consts';

// 卡组数据缓存，避免重复加载
interface DeckCache {
  [key: string]: {
    data: Word[];
    loaded: boolean;
  };
}

const deckCache: DeckCache = {};

// 卡组配置映射，定义每个卡组的导入路径
const deckImports: { [key: string]: () => Promise<any> } = {
  cet4: () => import('@/assets/data/cet4/cet4.json'),
  englishCommonPhrases: () => import('@/assets/data/english_CommonPhrases/englishCommonPhrases.json'),
};

/**
 * 异步加载指定卡组的数据
 * 使用懒加载方式，只有在需要时才加载对应卡组的数据
 * 添加缓存机制，避免重复加载
 */
export async function getWords(deckName: string = 'cet4'): Promise<Word[]> {
  console.log('getWords called with deckName:', deckName);
  
  // 检查缓存中是否已有数据
  if (deckCache[deckName] && deckCache[deckName].loaded) {
    console.log(`Using cached data for deck: ${deckName}, length: ${deckCache[deckName].data.length}`);
    return deckCache[deckName].data;
  }
  
  try {
    // 检查是否有对应的导入函数
    const importFn = deckImports[deckName];
    if (!importFn) {
      console.warn(`No import function found for deck: ${deckName}`);
      return [];
    }
    
    // 异步导入数据
    console.log(`Loading data for deck: ${deckName}...`);
    const module = await importFn();
    const rawData = module.default || module;
    
    // 验证数据结构
    if (!Array.isArray(rawData)) {
      console.error(`Data for deck ${deckName} is not an array`);
      return [];
    }
    
    // 过滤出有效的Word对象
    const validWords = rawData.filter(item => 
      item && typeof item === 'object' && item.id && item.word
    ) as Word[];
    
    // 存入缓存
    deckCache[deckName] = {
      data: validWords,
      loaded: true
    };
    
    console.log(`Successfully loaded deck: ${deckName}, valid words count: ${validWords.length}`);
    return validWords;
  } catch (error) {
    console.error(`Error loading deck ${deckName}:`, error);
    return [];
  }
}

/**
 * 清除指定卡组的缓存
 */
export function clearDeckCache(deckName?: string): void {
  if (deckName) {
    delete deckCache[deckName];
    console.log(`Cache cleared for deck: ${deckName}`);
  } else {
    // 清除所有缓存
    Object.keys(deckCache).forEach(key => {
      delete deckCache[key];
    });
    console.log('All deck caches cleared');
  }
}

/**
 * 注册新的卡组导入
 * 用于动态添加新卡组
 */
export function registerDeckImport(deckName: string, importFn: () => Promise<any>): void {
  deckImports[deckName] = importFn;
  console.log(`Deck registered: ${deckName}`);
  
  // 清除可能存在的旧缓存
  if (deckCache[deckName]) {
    delete deckCache[deckName];
  }
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
 * Load words from specific letters for the specified deck
 */
export async function getWordsByLetters(letters: string[], deckName: string = 'cet4'): Promise<Word[]> {
    // 使用异步getWords获取数据
    const allWords: Word[] = await getWords(deckName);
    
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
export async function getWordsRandom(count: number = RANDOM_LETTER_COUNT, deckName: string = 'cet4'): Promise<Word[]> {
    const availableLetters = getAvailableLetters();
    
    // Shuffle and pick random letters
    const shuffled = [...availableLetters].sort(() => Math.random() - 0.5);
    const selectedLetters = shuffled.slice(0, count);
    
    return getWordsByLetters(selectedLetters, deckName);
}