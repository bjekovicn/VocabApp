export type PracticeMode = 'flip-card' | 'quiz-source-target' | 'quiz-target-source';

export const PRACTICE_MODES: { value: PracticeMode; label: string; description: string }[] = [
  {
    value: 'flip-card',
    label: 'Flip Card',
    description: 'Okreni karticu i kaži da li znaš reč',
  },
  {
    value: 'quiz-source-target',
    label: 'Quiz: Izvorni → Prevod',
    description: 'Birај tačan prevod od 3 opcije',
  },
  {
    value: 'quiz-target-source',
    label: 'Quiz: Prevod → Izvorni',
    description: 'Birај tačnu reč od 3 opcije',
  },
];
