import { Word } from '@/interfaces';
import { RANDOM_LETTER_FILES_COUNT, WORDS_PER_LETTER_FILE } from '@/consts';
import { SESSION_WORDS_COUNT } from '@/consts/decks';
import { DECKS } from '@/consts/decks';

// 卡组数据缓存，避免重复加载
interface DeckCache {
  [key: string]: {
    data: Word[];
    loaded: boolean;
  };
}

const deckCache: DeckCache = {};

// 卡组配置映射，根据DECKS动态生成每个卡组的基础路径
const deckBasePaths: { [key: string]: string } = {};

// 初始化deckBasePaths
DECKS.forEach(deck => {
  deckBasePaths[deck.id] = `@/assets/data/${deck.id}`;
});

console.log('Initialized deck base paths:', deckBasePaths);

// 根据卡组名称和字母获取导入函数 - 简化版本
export function getLetterImport(deckName: string, letter: string) {
  return `${deckBasePaths[deckName]}/${letter}.json`;
}

/**
 * 异步加载指定卡组的特定字母数据
 * 使用懒加载方式，只有在需要时才加载对应字母的数据
 * 添加缓存机制，避免重复加载
 */
// 使用动态导入来加载数据文件

export async function getWordsByLetter(letter: string, deckName: string = 'cet4'): Promise<Word[]> {
  const cacheKey = `${deckName}_${letter}`;
  
  console.log(`getWordsByLetter called with letter: ${letter}, deckName: ${deckName}`);
  
  // 检查缓存中是否已有数据
  if (deckCache[cacheKey] && deckCache[cacheKey].loaded) {
    console.log(`Using cached data for ${cacheKey}, length: ${deckCache[cacheKey].data.length}`);
    return deckCache[cacheKey].data;
  }
  
  try {
    // 使用条件导入方式，为每个已知的卡组提供显式导入路径
    // 这样可以避免esbuild对动态导入的解析问题
    console.time(`Import time for ${cacheKey}`);
    let module;
    
    // 为所有已知卡组提供显式导入
    if (deckName === 'cet4' || deckName === 'englishCommonPhrases') {
      // 动态导入对应字母的数据文件
      try {
        module = await import(`../assets/data/${deckName}/${letter}.json`);
      } catch (error) {
        console.error(`Failed to import ${letter}.json for deck ${deckName}:`, error);
        deckCache[cacheKey] = {
          data: [],
          loaded: true
        };
        return [];
      }
    }
    else {
      console.timeEnd(`Import time for ${cacheKey}`);
      console.error(`Unknown deck: ${deckName}`);
      deckCache[cacheKey] = {
        data: [],
        loaded: true
      };
      return [];
    }
    
    console.timeEnd(`Import time for ${cacheKey}`);
    console.log(`DEBUG: Import succeeded for ${cacheKey}`);
    
    const rawData = module.default || module;
    
    // 验证数据结构
    if (!Array.isArray(rawData)) {
      console.error(`Data for ${cacheKey} is not an array, received type: ${typeof rawData}`);
      return [];
    }
    
    console.log(`DEBUG: Raw data for ${cacheKey} has ${rawData.length} items`);
    
    // 过滤出有效的Word对象
    const validWords = rawData.filter(item => 
      item && typeof item === 'object' && item.id && item.word
    ) as Word[];
    
    console.log(`DEBUG: Filtered valid words count: ${validWords.length}`);
    
    // 检查前几个单词的数据结构
    if (validWords.length > 0) {
      console.log(`DEBUG: First word sample for ${cacheKey}:`, {
        id: validWords[0].id,
        word: validWords[0].word,
        hasTranslation: !!validWords[0].translation
      });
    }
    
    // 存入缓存
    deckCache[cacheKey] = {
      data: validWords,
      loaded: true
    };
    
    console.log(`Successfully loaded ${cacheKey}, valid words count: ${validWords.length}`);
    return validWords;
  } catch (error) {
    console.error(`Error loading ${cacheKey}:`, error instanceof Error ? error.message : String(error));
    // 即使出错也创建空缓存，避免重复尝试加载
    deckCache[cacheKey] = {
      data: [],
      loaded: true
    };
    return [];
  }
}

/**
 * 异步加载指定卡组的所有数据（向后兼容）
 * 注意：此方法会加载所有字母文件，可能导致性能问题
 * 推荐使用更精确的方法如getWordsByLetter或getRandomWordsByLetterFiles
 */
export async function getWords(deckName: string = 'cet4'): Promise<Word[]> {
  console.log('getWords called with deckName:', deckName);
  
  // 检查缓存中是否已有数据
  if (deckCache[deckName] && deckCache[deckName].loaded) {
    console.log(`Using cached data for deck: ${deckName}, length: ${deckCache[deckName].data.length}`);
    return deckCache[deckName].data;
  }
  
  try {
    // 调用getRandomWordsByLetterFiles函数获取随机单词
    // 从随机选择的RANDOM_LETTER_FILES_COUNT个字母文件中，每个文件抽取WORDS_PER_LETTER_FILE个单词
    const randomWords = await getRandomWordsByLetterFiles(
      RANDOM_LETTER_FILES_COUNT, // 随机选择的字母文件数量
      WORDS_PER_LETTER_FILE,      // 从每个选中的字母文件中随机选择的单词数量
      deckName                    // 卡组名称
    );
    
    // 从获取的随机单词中，再随机抽取SESSION_WORDS_COUNT个单词作为学习会话的单词
    const shuffledWords = [...randomWords].sort(() => Math.random() - 0.5);
    const sessionWords = shuffledWords.slice(0, Math.min(SESSION_WORDS_COUNT, shuffledWords.length));
    
    // 存入缓存
    deckCache[deckName] = {
      data: sessionWords,
      loaded: true
    };
    
    console.log(`Successfully loaded words for deck: ${deckName}, total count: ${sessionWords.length}`);
    return sessionWords;
  } catch (error) {
    console.error(`Error loading data for deck ${deckName}:`, error instanceof Error ? error.message : String(error));
    return [];
  }
}

/**
 * 清除指定卡组或字母的缓存
 */
export function clearDeckCache(deckName?: string, letter?: string): void {
  if (deckName && letter) {
    // 清除特定卡组特定字母的缓存
    const cacheKey = `${deckName}_${letter}`;
    delete deckCache[cacheKey];
    console.log(`Cache cleared for ${cacheKey}`);
  } else if (deckName) {
    // 清除指定卡组的所有缓存（包括整体和各字母）
    Object.keys(deckCache).forEach(key => {
      if (key === deckName || key.startsWith(`${deckName}_`)) {
        delete deckCache[key];
      }
    });
    console.log(`All caches cleared for deck: ${deckName}`);
  } else {
    // 清除所有缓存
    Object.keys(deckCache).forEach(key => {
      delete deckCache[key];
    });
    console.log('All deck caches cleared');
  }
}

/**
 * 从指定的字母文件中随机选择指定数量的单词
 */
export async function getRandomWordsFromLetterFile(
  letter: string, 
  deckName: string = 'cet4', 
  count: number = 10
): Promise<Word[]> {
  try {
    const words = await getWordsByLetter(letter, deckName);
    
    // 打乱单词顺序并取指定数量
    const shuffledWords = [...words].sort(() => Math.random() - 0.5);
    return shuffledWords.slice(0, Math.min(count, words.length));
  } catch (error) {
    console.error(`Error getting random words from ${letter} file:`, error);
    return [];
  }
}

/**
 * 随机选择指定数量的字母文件，并从每个文件中随机选择指定数量的单词
 */
export async function getRandomWordsByLetterFiles(
  fileCount: number = RANDOM_LETTER_FILES_COUNT,
  wordsPerFile: number = WORDS_PER_LETTER_FILE,
  deckName: string = 'cet4'
): Promise<Word[]> {
  try {
    console.log(`getRandomWordsByLetterFiles called with fileCount: ${fileCount}, wordsPerFile: ${wordsPerFile}, deckName: ${deckName}`);
    
    // 获取所有可用字母
    const availableLetters = getAvailableLetters(deckName);
    
    // 如果请求的文件数量大于可用字母数量，调整为可用字母数量
    const actualFileCount = Math.min(fileCount, availableLetters.length);
    
    // 随机打乱字母数组并选择指定数量的字母
    const shuffledLetters = [...availableLetters].sort(() => Math.random() - 0.5);
    const selectedLetters = shuffledLetters.slice(0, actualFileCount);
    
    console.log(`Selected letters for random loading: ${selectedLetters.join(', ')}`);
    
    // 并行加载每个字母的数据
    const wordArrays = await Promise.all(
      selectedLetters.map(letter => getWordsByLetter(letter, deckName))
    );
    
    // 从每个字母文件中随机选择指定数量的单词
    const allRandomWords: Word[] = [];
    wordArrays.forEach((words, index) => {
      if (words.length > 0) {
        // 洗牌算法随机排序
        const shuffledWords = [...words].sort(() => Math.random() - 0.5);
        // 取指定数量的单词
        const selectedWords = shuffledWords.slice(0, Math.min(wordsPerFile, words.length));
        allRandomWords.push(...selectedWords);
        console.log(`Randomly selected ${selectedWords.length} words from ${selectedLetters[index]}`);
      }
    });
    
    console.log(`Total random words selected: ${allRandomWords.length}`);
    return allRandomWords;
  } catch (error) {
    console.error('Error in getRandomWordsByLetterFiles:', error);
    return [];
  }
}

/**
 * 注册新的卡组基础路径
 * 用于动态添加新卡组
 */
export function registerDeckImport(deckName: string, basePath: string): void {
  deckBasePaths[deckName] = basePath;
  console.log(`Deck registered: ${deckName} with base path: ${basePath}`);
  
  // 清除可能存在的旧缓存
  clearDeckCache(deckName);
}

/**
 * 加载指定字母的单词
 */
export async function getWordsByLetters(letters: string[], deckName: string = 'cet4'): Promise<Word[]> {
  console.log(`getWordsByLetters called with letters: [${letters.join(', ')}], deckName: ${deckName}`);
  
  // 过滤掉'Other'（暂不处理）
  const validLetters = letters.filter(letter => letter !== 'Other');
  
  if (validLetters.length === 0) {
    return [];
  }
  
  // 并行加载多个字母的数据
  const letterPromises = validLetters.map(letter => getWordsByLetter(letter, deckName));
  const letterDatas = await Promise.all(letterPromises);
  
  // 合并所有字母的数据
  const allWords = letterDatas.flat();

  console.log(`Successfully loaded ${allWords.length} words for letters: [${validLetters.join(', ')}]`);
  return allWords;
}

/**
 * Get all available letters for a deck
 */
export function getAvailableLetters(deckName: string = 'cet4'): string[] {
  // 这里返回所有可用的字母
  return ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 
          'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
}