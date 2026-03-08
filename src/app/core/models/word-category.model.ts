export type WordCategory =
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'pronoun'
  | 'preposition'
  | 'conjunction'
  | 'other';

export const WORD_CATEGORIES: { value: WordCategory }[] = [
  { value: 'noun' },
  { value: 'verb' },
  { value: 'adjective' },
  { value: 'adverb' },
  { value: 'pronoun' },
  { value: 'preposition' },
  { value: 'conjunction' },
  { value: 'other' },
];
