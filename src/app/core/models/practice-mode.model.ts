export type PracticeMode =
  | 'flip-card-source-target'
  | 'flip-card-target-source'
  | 'quiz-source-target'
  | 'quiz-target-source';

export const PRACTICE_MODES = [
  {
    value: 'flip-card-source-target',
    label: 'Flip Card: Source → Target',
    description: 'Vidi nemačku reč, pogađaj srpski prevod',
  },
  {
    value: 'flip-card-target-source',
    label: 'Flip Card: Target → Source',
    description: 'Vidi srpski prevod, pogađaj nemačku reč',
  },
  {
    value: 'quiz-source-target',
    label: 'Quiz: Source → Target',
    description: 'Birај tačan prevod od 3 opcije',
  },
  {
    value: 'quiz-target-source',
    label: 'Quiz: Target → Source',
    description: 'Birај tačnu reč od 3 opcije',
  },
];
