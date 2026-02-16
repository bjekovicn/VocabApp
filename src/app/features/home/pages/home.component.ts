import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { StorageService } from '@core/services/abstractions/storage.service';
import { SpacedRepetitionService } from '@core/services/abstractions/spaced-repetition.service';
import { WordCategory, WORD_CATEGORIES } from '@core/models/word-category.model';
import { CustomCardComponent } from '@shared/card/custom-card';
import { CustomButtonComponent } from '@shared/button/custom-button';
import { Word } from '@core/models/word.model';

interface CategoryStats {
  category: WordCategory;
  label: string;
  total: number;
  dueToday: number;
}

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, CustomCardComponent, CustomButtonComponent],
  templateUrl: './home.component.html',
})
export class HomePage {
  private readonly storage = inject(StorageService);
  private readonly spacedRepetition = inject(SpacedRepetitionService);
  private readonly router = inject(Router);

  private readonly words = toSignal(this.storage.getWords(), { initialValue: [] });

  public readonly totalWords = computed(() => this.words().length);

  // Nikad nije ni jednom vježbana ni u jednom modu
  public readonly newWords = computed(
    () =>
      this.words().filter(
        (w) =>
          w.flipCardSourceToTarget.repetitions === 0 &&
          w.flipCardTargetToSource.repetitions === 0 &&
          w.quizSourceToTarget.repetitions === 0 &&
          w.quizTargetToSource.repetitions === 0,
      ).length,
  );

  // Vježbana barem jednom, ali prosječan ease factor još nije dobar
  public readonly inProgress = computed(
    () =>
      this.words().filter((w) => {
        const hasAttempts = this.getTotalAttempts(w) > 0;
        const avgEase = this.getAvgEaseFactor(w);
        return hasAttempts && avgEase < 2.5;
      }).length,
  );

  // Prosječan ease factor >= 2.5 — SM2 definicija "dobro znam"
  public readonly mastered = computed(
    () =>
      this.words().filter((w) => {
        const hasAttempts = this.getTotalAttempts(w) > 0;
        const avgEase = this.getAvgEaseFactor(w);
        return hasAttempts && avgEase >= 2.5;
      }).length,
  );

  // Slabe reči
  public readonly weak = computed(
    () =>
      this.words().filter((w) => {
        const modes = [
          w.flipCardSourceToTarget,
          w.flipCardTargetToSource,
          w.quizSourceToTarget,
          w.quizTargetToSource,
        ];
        return modes.some(
          (m) => m.repetitions > 0 && (m.easeFactor < 2.1 || m.incorrectCount > m.correctCount),
        );
      }).length,
  );

  public readonly dueToday = computed(() => {
    return this.words().filter(
      (w) =>
        this.spacedRepetition.isDueForReview(w.flipCardSourceToTarget) ||
        this.spacedRepetition.isDueForReview(w.flipCardTargetToSource) ||
        this.spacedRepetition.isDueForReview(w.quizSourceToTarget) ||
        this.spacedRepetition.isDueForReview(w.quizTargetToSource),
    ).length;
  });

  public readonly categoryStats = computed((): CategoryStats[] => {
    const words = this.words();
    return WORD_CATEGORIES.map((cat) => ({
      category: cat.value,
      label: cat.label,
      total: words.filter((w) => w.category === cat.value).length,
      dueToday: words.filter(
        (w) =>
          w.category === cat.value &&
          (this.spacedRepetition.isDueForReview(w.flipCardSourceToTarget) ||
            this.spacedRepetition.isDueForReview(w.flipCardTargetToSource) ||
            this.spacedRepetition.isDueForReview(w.quizSourceToTarget) ||
            this.spacedRepetition.isDueForReview(w.quizTargetToSource)),
      ).length,
    }));
  });

  // ================================
  // HELPERS
  // ================================

  private getTotalAttempts(word: Word): number {
    return (
      word.flipCardSourceToTarget.repetitions +
      word.flipCardTargetToSource.repetitions +
      word.quizSourceToTarget.repetitions +
      word.quizTargetToSource.repetitions
    );
  }

  private getAvgEaseFactor(word: Word): number {
    const sum =
      word.flipCardSourceToTarget.easeFactor +
      word.flipCardTargetToSource.easeFactor +
      word.quizSourceToTarget.easeFactor +
      word.quizTargetToSource.easeFactor;
    return sum / 4;
  }

  // ================================
  // NAVIGACIJA
  // ================================

  public navigateToPractice(): void {
    this.router.navigate(['/practice']);
  }

  public navigateToWordLists(): void {
    this.router.navigate(['/word-lists']);
  }

  public navigateToAddWord(): void {
    this.router.navigate(['/words/add']);
  }

  public navigateToImport(): void {
    this.router.navigate(['/import']);
  }
}
