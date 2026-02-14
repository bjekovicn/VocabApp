import { SpacedRepetitionProgress } from '@core/models/spaced-repetition.model';

export abstract class SpacedRepetitionService {
  public abstract calculateNextReview(
    progress: SpacedRepetitionProgress,
    correct: boolean,
  ): SpacedRepetitionProgress;

  public abstract isDueForReview(progress: SpacedRepetitionProgress): boolean;
}
