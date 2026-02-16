import { WordCategory } from './word-category.model';
import { LanguagePair } from './language.model';
import { SpacedRepetitionProgress } from './spaced-repetition.model';

export interface Word {
  id: string;
  sourceText: string; // tekst na jeziku koji učiš (npr. "der Tisch")
  targetText: string; // prevod na tvom jeziku (npr. "sto")
  category: WordCategory;
  listId: string;
  languagePair: LanguagePair; // npr. "de-sr"

  // Quiz opcije (2 pogrešna odgovora)
  quizDistractorsSourceToTarget: string[]; // 2 pogrešna prevoda
  quizDistractorsTargetToSource: string[]; // 2 pogrešne reči

  // Odvojen napredak za svaki mod
  flipCardSourceToTarget: SpacedRepetitionProgress;
  flipCardTargetToSource: SpacedRepetitionProgress;
  quizSourceToTarget: SpacedRepetitionProgress;
  quizTargetToSource: SpacedRepetitionProgress;

  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWordDto {
  sourceText: string;
  targetText: string;
  category: WordCategory;
  listId: string;
  languagePair: LanguagePair;
  quizDistractorsSourceToTarget: string[];
  quizDistractorsTargetToSource: string[];
}
