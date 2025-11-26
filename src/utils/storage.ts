// 向后兼容层，将旧的API重定向到新的基于卡包的API
import { UserProgress } from '@/interfaces';
import { saveProgress as saveProgressV2, loadAllProgress as loadAllProgressV2, getProgress as getProgressV2 } from './storage/progress';

// 默认卡包ID
const DEFAULT_DECK_ID = 'cet4';

// 旧API的向后兼容实现
export function saveProgress(progress: UserProgress) {
    saveProgressV2(DEFAULT_DECK_ID, progress);
}

export function loadAllProgress(): Record<string, UserProgress> {
    const allProgress = loadAllProgressV2();
    return allProgress[DEFAULT_DECK_ID] || {};
}

export function getProgress(wordId: string): UserProgress | null {
    return getProgressV2(DEFAULT_DECK_ID, wordId);
}

// 导出新API
export { 
    saveProgress as saveProgressV2, 
    loadAllProgress as loadAllProgressV2, 
    getProgress as getProgressV2 
} from './storage/progress';
