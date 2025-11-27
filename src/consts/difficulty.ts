export interface DifficultyLevel {
  value: number;
  label: string;
  color: string;
  antColor: 'danger' | 'warning' | 'primary' | 'success';
  description: string;
}

export const DIFFICULTY_LEVELS: Record<string, DifficultyLevel> = {
  AGAIN: {
    value: 1,
    label: 'Again',
    color: '#ff4d4f',
    antColor: 'danger',
    description: '< 1m'
  },
  HARD: {
    value: 5,
    label: 'Hard',
    color: '#faad14',
    antColor: 'warning',
    description: '2d'
  },
  GOOD: {
    value: 8,
    label: 'Good',
    color: '#1677ff',
    antColor: 'primary',
    description: '2w'
  },
  EASY: {
    value: 10,
    label: 'Easy',
    color: '#52c41a',
    antColor: 'success',
    description: '1mo'
  }
};
