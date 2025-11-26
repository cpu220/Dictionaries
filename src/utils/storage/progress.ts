/**
 * 业务缓存逻辑 - 用户进度管理
 * 基于通用缓存API封装，以卡包为单位进行存储
 */

import { UserProgress, DeckProgress, AllProgress, StudySession, SessionRecord, SessionRecords, StudySessionsMap } from '@/interfaces';
import { getStorage, updateStorage } from './base';

const STORAGE_KEY = 'user_progress_v2';
const SESSIONS_MAP_KEY = 'study_sessions_map';
const SESSION_PREFIX = 'study_session_';
const RECORDS_KEY = 'session_records';

/**
 * 生成唯一会话ID
 * @param deckId 卡包ID
 * @returns 唯一会话ID
 */
function generateSessionId(deckId: string): string {
  return `${deckId}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

/**
 * 获取会话存储键
 * @param sessionId 会话ID
 * @returns 存储键
 */
function getSessionKey(sessionId: string): string {
  return `${SESSION_PREFIX}${sessionId}`;
}

/**
 * 保存用户进度
 * @param deckId 卡包ID
 * @param progress 用户进度
 */
export function saveProgress(deckId: string, progress: UserProgress): void {
  updateStorage<AllProgress>(STORAGE_KEY, (prev) => {
    const deckProgress = prev[deckId] || {};
    return {
      ...prev,
      [deckId]: {
        ...deckProgress,
        [progress.word_id]: progress
      }
    };
  }, {});
}

/**
 * 加载所有进度
 * @returns 所有卡包的进度
 */
export function loadAllProgress(): AllProgress {
  return getStorage<AllProgress>(STORAGE_KEY, {});
}

/**
 * 加载特定卡包的进度
 * @param deckId 卡包ID
 * @returns 特定卡包的进度
 */
export function loadDeckProgress(deckId: string): DeckProgress {
  const allProgress = loadAllProgress();
  return allProgress[deckId] || {};
}

/**
 * 获取特定单词的进度
 * @param deckId 卡包ID
 * @param wordId 单词ID
 * @returns 特定单词的进度或null
 */
export function getProgress(deckId: string, wordId: string): UserProgress | null {
  const deckProgress = loadDeckProgress(deckId);
  return deckProgress[wordId] || null;
}

/**
 * 获取特定卡包中已学习的单词ID列表
 * @param deckId 卡包ID
 * @returns 已学习的单词ID列表
 */
export function getLearnedWordIds(deckId: string): string[] {
  const deckProgress = loadDeckProgress(deckId);
  return Object.keys(deckProgress);
}

/**
 * 清空特定卡包的进度
 * @param deckId 卡包ID
 */
export function clearDeckProgress(deckId: string): void {
  updateStorage<AllProgress>(STORAGE_KEY, (prev) => {
    const { [deckId]: _, ...rest } = prev;
    return rest;
  }, {});
}

/**
 * 清空所有进度
 */
export function clearAllProgress(): void {
  updateStorage<AllProgress>(STORAGE_KEY, () => ({}), {});
  updateStorage<StudySessionsMap>(SESSIONS_MAP_KEY, () => ({ sessions: [] }), {});
  updateStorage<SessionRecords>(RECORDS_KEY, () => ({}), {});
  
  // 清除所有会话数据
  const sessionsMap = getStorage<StudySessionsMap>(SESSIONS_MAP_KEY, { sessions: [] });
  sessionsMap.sessions.forEach(sessionId => {
    const sessionKey = getSessionKey(sessionId);
    localStorage.removeItem(sessionKey);
  });
}

/**
 * 保存学习会话
 * @param session 学习会话
 */
export function saveSession(session: StudySession): void {
  const sessionKey = getSessionKey(session.id);
  updateStorage<StudySession>(sessionKey, () => session, {});
  
  // 更新会话映射
  updateStorage<StudySessionsMap>(SESSIONS_MAP_KEY, (prev) => {
    const sessions = prev.sessions.includes(session.id) 
      ? prev.sessions 
      : [...prev.sessions, session.id];
    
    return {
      ...prev,
      sessions,
      currentSessionId: session.id
    };
  }, { sessions: [] });
  
  // 更新会话记录
  updateStorage<SessionRecords>(RECORDS_KEY, (prev) => {
    const completedCount = session.currentIndex + 1;
    const isCompleted = session.currentIndex >= session.wordList.length - 1;
    
    return {
      ...prev,
      [session.id]: {
        id: session.id,
        deckId: session.deckId,
        wordCount: session.wordList.length,
        completedCount: isCompleted ? session.wordList.length : completedCount,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        completedAt: isCompleted ? Date.now() : undefined
      }
    };
  }, {});
}

/**
 * 加载特定会话
 * @param sessionId 会话ID
 * @returns 学习会话或null
 */
export function loadSession(sessionId: string): StudySession | null {
  const sessionKey = getSessionKey(sessionId);
  return getStorage<StudySession | null>(sessionKey, null);
}

/**
 * 加载当前活跃会话
 * @returns 学习会话或null
 */
export function loadCurrentSession(): StudySession | null {
  const sessionsMap = getStorage<StudySessionsMap>(SESSIONS_MAP_KEY, { sessions: [] });
  if (!sessionsMap.currentSessionId) return null;
  return loadSession(sessionsMap.currentSessionId);
}

/**
 * 删除特定会话
 * @param sessionId 会话ID
 */
export function clearSession(sessionId: string): void {
  const sessionKey = getSessionKey(sessionId);
  localStorage.removeItem(sessionKey);
  
  // 更新会话映射
  updateStorage<StudySessionsMap>(SESSIONS_MAP_KEY, (prev) => {
    const sessions = prev.sessions.filter(id => id !== sessionId);
    return {
      ...prev,
      sessions,
      currentSessionId: prev.currentSessionId === sessionId ? undefined : prev.currentSessionId
    };
  }, { sessions: [] });
  
  // 更新会话记录
  updateStorage<SessionRecords>(RECORDS_KEY, (prev) => {
    const { [sessionId]: _, ...rest } = prev;
    return rest;
  }, {});
}

/**
 * 创建新的学习会话
 * @param deckId 卡包ID
 * @param wordList 单词ID列表
 * @returns 新的学习会话
 */
export function createSession(deckId: string, wordList: string[]): StudySession {
  const sessionId = generateSessionId(deckId);
  const session: StudySession = {
    id: sessionId,
    deckId,
    wordList,
    currentIndex: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    completed: false
  };
  saveSession(session);
  return session;
}

/**
 * 获取所有会话记录
 * @returns 所有会话记录
 */
export function getAllSessionRecords(): SessionRecords {
  return getStorage<SessionRecords>(RECORDS_KEY, {});
}

/**
 * 获取会话映射
 * @returns 会话映射
 */
export function getSessionsMap(): StudySessionsMap {
  return getStorage<StudySessionsMap>(SESSIONS_MAP_KEY, { sessions: [] });
}
