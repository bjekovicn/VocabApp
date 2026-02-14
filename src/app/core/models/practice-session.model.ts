import { Word } from './word.model';
import { PracticeMode } from './practice-mode.model';
import { WordCategory } from './word-category.model';

export interface PracticeSetup {
  mode: PracticeMode;
  listId: string | null;
  categories: WordCategory[];
}

export interface PracticeResult {
  word: Word;
  correct: boolean;
  selectedAnswer?: string;
}

export interface PracticeStats {
  totalWords: number;
  correctCount: number;
  incorrectCount: number;
  accuracy: number;
}
