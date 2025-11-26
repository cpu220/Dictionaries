export interface PhoneticGroup {
  text: string;
  related_letters: string;
}

export interface Word {
  id: string;
  word: string;
  phonetic: string;
  translation: string;
  phonetic_groups: PhoneticGroup[];
  audio_url?: string;
  tags: string[];
}

export interface UserProgress {
  word_id: string;
  next_review_time: number; // Timestamp
  interval: number; // Days
  ease_factor: number;
  history: { date: number; score: number }[];
}

export interface DeckProgress {
  [wordId: string]: UserProgress;
}

export interface AllProgress {
  [deckId: string]: DeckProgress;
}

export interface StudySession {
  id: string; // 会话唯一ID
  deckId: string;
  wordList: string[]; // 单词ID列表
  currentIndex: number; // 当前学习到的索引
  createdAt: number; // 创建时间
  updatedAt: number; // 更新时间
  completed: boolean; // 是否完成
}

export interface SessionRecord {
  id: string;
  deckId: string;
  wordCount: number;
  completedCount: number;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}

export interface SessionRecords {
  [sessionId: string]: SessionRecord;
}

export interface StudySessionsMap {
  sessions: string[]; // 会话ID列表，按创建时间排序
  currentSessionId?: string; // 当前活跃会话ID
}
