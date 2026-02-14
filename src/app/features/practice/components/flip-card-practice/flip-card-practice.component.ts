import { Component, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Word } from '@core/models/word.model';
import { StorageService } from '@core/services/abstractions/storage.service';
import { SpacedRepetitionService } from '@core/services/abstractions/spaced-repetition.service';
import { PracticeResult } from '@core/models/practice-session.model';
import { CustomCardComponent } from '@shared/card/custom-card';
import { CustomButtonComponent } from '@shared/button/custom-button';

@Component({
  selector: 'app-flip-card-practice',
  standalone: true,
  imports: [CommonModule, CustomCardComponent, CustomButtonComponent],
  templateUrl: './flip-card-practice.component.html',
})
export class FlipCardPracticeComponent {
  private readonly storage = inject(StorageService);
  private readonly spacedRepetition = inject(SpacedRepetitionService);

  public readonly words = input.required<Word[]>();
  public readonly finished = output<PracticeResult[]>();

  public readonly currentIndex = signal(0);
  public readonly isFlipped = signal(false);
  public readonly results = signal<PracticeResult[]>([]);

  public readonly hasWords = computed(() => this.words()?.length > 0);

  public readonly currentWord = computed(() => {
    const w = this.words();
    const idx = this.currentIndex();
    if (!w || idx >= w.length) return null;
    return w[idx];
  });

  public readonly progressPercent = computed(() => {
    const total = this.words()?.length ?? 0;
    if (!total) return 0;
    return ((this.currentIndex() + 1) / total) * 100;
  });

  public flipCard(): void {
    if (!this.currentWord()) return;
    this.isFlipped.set(true);
  }

  public handleAnswer(correct: boolean): void {
    const word = this.currentWord();
    if (!word) return;

    this.results.update((r) => [...r, { word, correct }]);

    this.updateProgress(word, correct);

    // reset flip odmah
    this.isFlipped.set(false);

    setTimeout(() => {
      const nextIdx = this.currentIndex() + 1;
      const total = this.words()?.length ?? 0;

      if (nextIdx >= total) {
        this.finished.emit(this.results());
      } else {
        this.currentIndex.set(nextIdx);
      }
    }, 0);
  }

  private async updateProgress(word: Word, correct: boolean): Promise<void> {
    const currentProgress = word.flipCard;
    const newProgress = this.spacedRepetition.calculateNextReview(currentProgress, correct);

    await this.storage.updateWord(word.id, {
      flipCard: newProgress,
    });
  }
}
