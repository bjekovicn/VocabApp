export type PracticeMode =
  | 'flip-card-source-target'
  | 'flip-card-target-source'
  | 'quiz-source-target'
  | 'quiz-target-source';

export const PRACTICE_MODES = [
  {
    value: 'flip-card-source-target',
    labelKey: 'practiceMode.flipCardSourceTarget.label',
    descriptionKey: 'practiceMode.flipCardSourceTarget.description',
  },
  {
    value: 'flip-card-target-source',
    labelKey: 'practiceMode.flipCardTargetSource.label',
    descriptionKey: 'practiceMode.flipCardTargetSource.description',
  },
  {
    value: 'quiz-source-target',
    labelKey: 'practiceMode.quizSourceTarget.label',
    descriptionKey: 'practiceMode.quizSourceTarget.description',
  },
  {
    value: 'quiz-target-source',
    labelKey: 'practiceMode.quizTargetSource.label',
    descriptionKey: 'practiceMode.quizTargetSource.description',
  },
];
