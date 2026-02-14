export interface SpacedRepetitionProgress {
  repetitions: number;
  easeFactor: number;
  nextReview: Date;
  lastReview: Date | null;
  correctCount: number;
  incorrectCount: number;
}

export const createDefaultProgress = (): SpacedRepetitionProgress => ({
  repetitions: 0,
  easeFactor: 2.5,
  nextReview: new Date(),
  lastReview: null,
  correctCount: 0,
  incorrectCount: 0,
});
