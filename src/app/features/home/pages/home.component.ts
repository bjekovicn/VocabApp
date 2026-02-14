import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { StorageService } from '@core/services/abstractions/storage.service';
import { SpacedRepetitionService } from '@core/services/abstractions/spaced-repetition.service';
import { WordCategory, WORD_CATEGORIES } from '@core/models/word-category.model';
import { CustomCardComponent } from '@shared/card/custom-card';
import { CustomButtonComponent } from '@shared/button/custom-button';

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

  public readonly newWords = computed(
    () =>
      this.words().filter(
        (w) =>
          w.flipCard.repetitions === 0 &&
          w.quizSourceToTarget.repetitions === 0 &&
          w.quizTargetToSource.repetitions === 0,
      ).length,
  );

  public readonly inProgress = computed(
    () =>
      this.words().filter(
        (w) =>
          (w.flipCard.repetitions > 0 && w.flipCard.repetitions < 3) ||
          (w.quizSourceToTarget.repetitions > 0 && w.quizSourceToTarget.repetitions < 3) ||
          (w.quizTargetToSource.repetitions > 0 && w.quizTargetToSource.repetitions < 3),
      ).length,
  );

  public readonly mastered = computed(
    () =>
      this.words().filter(
        (w) =>
          w.flipCard.repetitions >= 3 &&
          w.quizSourceToTarget.repetitions >= 3 &&
          w.quizTargetToSource.repetitions >= 3,
      ).length,
  );

  public readonly dueToday = computed(() => {
    return this.words().filter(
      (w) =>
        this.spacedRepetition.isDueForReview(w.flipCard) ||
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
          (this.spacedRepetition.isDueForReview(w.flipCard) ||
            this.spacedRepetition.isDueForReview(w.quizSourceToTarget) ||
            this.spacedRepetition.isDueForReview(w.quizTargetToSource)),
      ).length,
    }));
  });

  public navigateToPractice(): void {
    this.router.navigate(['/practice']);
  }

  public navigateToWordLists(): void {
    this.router.navigate(['/word-lists']);
  }

  public navigateToAddWord(): void {
    this.router.navigate(['/words/add']);
  }
}
