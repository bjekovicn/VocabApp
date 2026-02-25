import { WordCategory } from './word-category.model';

export interface ImportWordData {
  sourceText: string;
  targetText: string;
  category: WordCategory;
  note?: string;
  quizDistractorsSourceToTarget: string[];
  quizDistractorsTargetToSource: string[];
}

export interface ImportFileData {
  words: ImportWordData[];
}
