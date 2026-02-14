import { Injectable } from '@angular/core';
import { SpacedRepetitionService } from '@core/services/abstractions/spaced-repetition.service';
import { SpacedRepetitionProgress } from '@core/models/spaced-repetition.model';

@Injectable({
  providedIn: 'root',
})
export class SM2SpacedRepetitionService extends SpacedRepetitionService {
  public calculateNextReview(
    progress: SpacedRepetitionProgress,
    correct: boolean,
  ): SpacedRepetitionProgress {
    const now = new Date();

    if (correct) {
      const newRepetitions = progress.repetitions + 1;
      let newEaseFactor = progress.easeFactor;
      let intervalDays = 0;

      if (newRepetitions === 1) {
        intervalDays = 1;
      } else if (newRepetitions === 2) {
        intervalDays = 6;
      } else {
        const prevIntervalDays = this.getDaysBetween(
          progress.lastReview || now,
          progress.nextReview,
        );
        intervalDays = Math.round(prevIntervalDays * newEaseFactor);
      }

      newEaseFactor = Math.max(1.3, newEaseFactor);

      const nextReview = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);

      return {
        repetitions: newRepetitions,
        easeFactor: newEaseFactor,
        nextReview,
        lastReview: now,
        correctCount: progress.correctCount + 1,
        incorrectCount: progress.incorrectCount,
      };
    } else {
      const nextReview = new Date(now.getTime() + 10 * 60 * 1000);

      return {
        repetitions: 0,
        easeFactor: Math.max(1.3, progress.easeFactor - 0.2),
        nextReview,
        lastReview: now,
        correctCount: progress.correctCount,
        incorrectCount: progress.incorrectCount + 1,
      };
    }
  }

  public isDueForReview(progress: SpacedRepetitionProgress): boolean {
    return new Date() >= new Date(progress.nextReview);
  }

  private getDaysBetween(date1: Date, date2: Date): number {
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
