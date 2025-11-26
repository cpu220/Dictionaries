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
