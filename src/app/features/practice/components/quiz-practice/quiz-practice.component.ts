import { Component, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Word } from '@core/models/word.model';
import { PracticeMode } from '@core/models/practice-mode.model';
import { StorageService } from '@core/services/abstractions/storage.service';
import { SpacedRepetitionService } from '@core/services/abstractions/spaced-repetition.service';
import { PracticeResult } from '@core/models/practice-session.model';
import { CustomCardComponent } from '@shared/card/custom-card';
import { CustomButtonComponent } from '@shared/button/custom-button';

interface QuizOption {
  text: string;
  isCorrect: boolean;
}

@Component({
  selector: 'app-quiz-practice',
  standalone: true,
  imports: [CommonModule, CustomCardComponent, CustomButtonComponent],
  templateUrl: './quiz-practice.component.html',
})
export class QuizPracticeComponent {
  private readonly storage = inject(StorageService);
  private readonly spacedRepetition = inject(SpacedRepetitionService);

  public readonly words = input.required<Word[]>();
  public readonly mode = input.required<PracticeMode>();
  public readonly finished = output<PracticeResult[]>();

  public readonly currentIndex = signal(0);
  public readonly selectedAnswer = signal<string | null>(null);
  public readonly results = signal<PracticeResult[]>([]);

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

  public readonly questionText = computed(() => {
    const word = this.currentWord();
    if (!word) return '';

    const isSourceToTarget = this.mode() === 'quiz-source-target';
    return isSourceToTarget ? word.sourceText : word.targetText;
  });

  public readonly options = computed((): QuizOption[] => {
    const word = this.currentWord();
    if (!word) return [];

    const isSourceToTarget = this.mode() === 'quiz-source-target';
    const correctAnswer = isSourceToTarget ? word.targetText : word.sourceText;

    const distractors =
      (isSourceToTarget
        ? word.quizDistractorsSourceToTarget
        : word.quizDistractorsTargetToSource) ?? [];

    const safeDistractors = distractors.slice(0, 2);

    return this.shuffleArray([
      { text: correctAnswer, isCorrect: true },
      ...safeDistractors.map((d) => ({ text: d, isCorrect: false })),
    ]);
  });

  public selectAnswer(option: QuizOption): void {
    if (this.selectedAnswer()) return;

    const word = this.currentWord();
    if (!word) return;

    this.selectedAnswer.set(option.text);

    this.results.update((r) => [
      ...r,
      { word, correct: option.isCorrect, selectedAnswer: option.text },
    ]);

    this.updateProgress(word, option.isCorrect);

    setTimeout(() => {
      const nextIdx = this.currentIndex() + 1;
      const total = this.words()?.length ?? 0;

      if (nextIdx >= total) {
        this.finished.emit(this.results());
      } else {
        this.currentIndex.set(nextIdx);
        this.selectedAnswer.set(null);
      }
    }, 800);
  }

  private async updateProgress(word: Word, correct: boolean): Promise<void> {
    const progressKey =
      this.mode() === 'quiz-source-target' ? 'quizSourceToTarget' : 'quizTargetToSource';

    const currentProgress = word[progressKey];
    const newProgress = this.spacedRepetition.calculateNextReview(currentProgress, correct);

    await this.storage.updateWord(word.id, {
      [progressKey]: newProgress,
    });
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}
