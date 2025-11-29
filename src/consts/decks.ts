import { PlanetConfig, SatelliteConfig } from './home3d';

// 随机加载配置常量
/**
 * 随机选择的字母文件数量
 * 当需要随机加载单词时，会从所有可用字母中随机选择RANDOM_LETTER_FILES_COUNT个字母文件
 */
export const RANDOM_LETTER_FILES_COUNT = 5;

/**
 * 从每个选中的字母文件中随机选择的单词数量
 * 对于每个随机选中的字母文件，会从中随机抽取WORDS_PER_LETTER_FILE个单词
 */
export const WORDS_PER_LETTER_FILE = 10;

/**
 * 学习会话的单词数量
 * 控制每次新学习会话开始时随机选择的单词总数
 * 这是最终呈现在用户面前的学习单词数量
 */
export const SESSION_WORDS_COUNT = 5;

/**
 * 学习会话中的最大卡片数量
 * 控制每次学习会话中加载的卡片总数上限，确保用户在一次学习中不会面对过多卡片
 */
export const MAX_CARDS_PER_SESSION = 2;

export interface DeckConfig {
  id: string;
  name: string;
  count: number;
  color: string;
  textureUrl?: string; // Optional texture URL for 3D planet skin, empty = glass effect
  planetConfig?: Partial<PlanetConfig>;
  satelliteConfig?: Partial<SatelliteConfig>;
}

export const DECKS: DeckConfig[] = [
  {
    id: 'englishCommonPhrases',
    name: '常用短语',
    count: 4000,
    color: '#e74c3c',
    textureUrl: '', // Empty = use glass effect
    planetConfig: {
      ORBIT_RADIUS: 2, // Custom orbit radius
      BASE_RADIUS: 0.3, // Slightly larger
      SATELLITE_BASE_RADIUS:0.1
      // ROTATION_SPEED: 4.01, // Slower rotation for Earth
    },
    satelliteConfig: {
      SIZE: 0.06, // Larger satellites
      
    }
  },
  {
    id: 'cet4',
    name: 'CET-4 Vocabulary (Full)',
    count: 4028,
    color: '#3498db',
    textureUrl: '/Dictionaries/earth_texture.png', // Use Earth texture
    planetConfig: {
      ORBIT_RADIUS: 2, // Further out
      BASE_RADIUS: 0.6, // Larger planet (Earth)
      // ROTATION_SPEED: 0.05, // Slower rotation for Earth
    },
    satelliteConfig: {
      ORBIT_SPEED_MIN: 0.2, // Slower satellites
    }
  },
];

// Helper function to get deck by ID
export function getDeckById(id: string): DeckConfig | undefined {
  return DECKS.find(deck => deck.id === id);
}

// Helper function to get all deck IDs
export function getAllDeckIds(): string[] {
  return DECKS.map(deck => deck.id);
}
