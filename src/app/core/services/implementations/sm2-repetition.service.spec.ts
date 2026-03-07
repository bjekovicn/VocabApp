import { createDefaultProgress } from '@core/models/spaced-repetition.model';
import { SM2SpacedRepetitionService } from './sm2-repetition.service';

describe('SM2SpacedRepetitionService', () => {
  const service = new SM2SpacedRepetitionService();

  it('schedules the first correct answer for the next day', () => {
    const progress = createDefaultProgress();
    const before = Date.now();

    const updated = service.calculateNextReview(progress, true);
    const diffHours = (updated.nextReview.getTime() - before) / (1000 * 60 * 60);

    expect(updated.repetitions).toBe(1);
    expect(updated.correctCount).toBe(1);
    expect(diffHours).toBeGreaterThan(23);
    expect(diffHours).toBeLessThan(25);
  });

  it('schedules the second correct answer for roughly six days', () => {
    const progress = {
      ...createDefaultProgress(),
      repetitions: 1,
      correctCount: 1,
      lastReview: new Date(),
      nextReview: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
    const before = Date.now();

    const updated = service.calculateNextReview(progress, true);
    const diffDays = (updated.nextReview.getTime() - before) / (1000 * 60 * 60 * 24);

    expect(updated.repetitions).toBe(2);
    expect(diffDays).toBeGreaterThan(5.5);
    expect(diffDays).toBeLessThan(6.5);
  });

  it('keeps repetitions above zero and schedules a failed review after ten minutes', () => {
    const progress = {
      ...createDefaultProgress(),
      repetitions: 3,
      easeFactor: 2.7,
      correctCount: 5,
      incorrectCount: 1,
      lastReview: new Date(),
      nextReview: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    };
    const before = Date.now();

    const updated = service.calculateNextReview(progress, false);
    const diffMinutes = (updated.nextReview.getTime() - before) / (1000 * 60);

    expect(updated.repetitions).toBe(2);
    expect(updated.easeFactor).toBeCloseTo(2.4, 5);
    expect(updated.incorrectCount).toBe(2);
    expect(diffMinutes).toBeGreaterThan(9);
    expect(diffMinutes).toBeLessThan(11);
  });

  it('detects when a review is due', () => {
    expect(
      service.isDueForReview({
        ...createDefaultProgress(),
        nextReview: new Date(Date.now() - 60_000),
      }),
    ).toBe(true);

    expect(
      service.isDueForReview({
        ...createDefaultProgress(),
        nextReview: new Date(Date.now() + 60_000),
      }),
    ).toBe(false);
  });
});
