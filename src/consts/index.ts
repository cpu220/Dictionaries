/**
 * Application-wide configuration constants
 */

/**
 * Number of random letter groups to select when using "Random" study mode.
 * Adjusting this value will change how many different letter groups are picked
 * for a random study session.
 */
export const RANDOM_LETTER_COUNT = 5;

/**
 * Number of words to include in a study session.
 * This controls how many words are randomly selected when starting a new study session.
 */
export const SESSION_WORDS_COUNT = 10;

/**
 * Key prefix for localStorage items
 */
export const STORAGE_KEY_PREFIX = 'vocab-app';

/**
 * 3D Home 页面相关配置
 */
export * from './home3d';
