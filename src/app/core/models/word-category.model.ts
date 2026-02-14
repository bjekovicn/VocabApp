export type WordCategory =
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'pronoun'
  | 'preposition'
  | 'conjunction'
  | 'other';

export const WORD_CATEGORIES: { value: WordCategory; label: string }[] = [
  { value: 'noun', label: 'Imenica' },
  { value: 'verb', label: 'Glagol' },
  { value: 'adjective', label: 'Pridjev' },
  { value: 'adverb', label: 'Prilog' },
  { value: 'pronoun', label: 'Zamjenica' },
  { value: 'preposition', label: 'Predlog' },
  { value: 'conjunction', label: 'Veznik' },
  { value: 'other', label: 'Ostalo' },
];
