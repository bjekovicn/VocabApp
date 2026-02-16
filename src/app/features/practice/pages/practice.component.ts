import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { StorageService } from '@core/services/abstractions/storage.service';
import { SpacedRepetitionService } from '@core/services/abstractions/spaced-repetition.service';
import { Word } from '@core/models/word.model';
import { PracticeMode } from '@core/models/practice-mode.model';
import { WordCategory } from '@core/models/word-category.model';
import { PracticeResult, PracticeStats } from '@core/models/practice-session.model';
import { CustomSelectComponent } from '@shared/select/custom-select';
import { CustomButtonComponent } from '@shared/button/custom-button';
import { CustomCardComponent } from '@shared/card/custom-card';
import { SelectOption } from '@shared/select/custom-select.types';
import { FlipCardPracticeComponent } from '../components/flip-card-practice/flip-card-practice.component';
import { QuizPracticeComponent } from '../components/quiz-practice/quiz-practice.component';

type PracticeState = 'setup' | 'practicing' | 'results';
type PracticeDirection = 'source-target' | 'target-source';
type PracticeType = 'flip-card' | 'quiz';
type WordFilter = 'all' | 'weakest' | 'forgotten' | 'new';

@Component({
  selector: 'app-practice-page',
  standalone: true,
  imports: [
    CommonModule,
    CustomButtonComponent,
    CustomCardComponent,
    CustomSelectComponent,
    FlipCardPracticeComponent,
    QuizPracticeComponent,
  ],
  templateUrl: './practice.component.html',
})
export class PracticeComponent {
  private readonly storage = inject(StorageService);
  private readonly spacedRepetition = inject(SpacedRepetitionService);
  private readonly router = inject(Router);

  private readonly allWords = toSignal(this.storage.getWords(), { initialValue: [] });
  private readonly wordLists = toSignal(this.storage.getWordLists(), { initialValue: [] });

  public readonly state = signal<PracticeState>('setup');

  public readonly selectedDirection = signal<PracticeDirection>('source-target');
  public readonly selectedType = signal<PracticeType>('flip-card');

  public readonly selectedMode = computed<PracticeMode>(
    () => `${this.selectedType()}-${this.selectedDirection()}` as PracticeMode,
  );

  public readonly selectedCategories = signal<WordCategory[]>([]);
  public readonly practiceWords = signal<Word[]>([]);
  public readonly sessionResults = signal<PracticeResult[]>([]);
  public readonly selectedListId = signal<string | null>(null);

  public readonly shuffleEnabled = signal<boolean>(true);
  public readonly selectedFilter = signal<WordFilter>('all');

  public readonly listOptions = computed<SelectOption[]>(() => [
    { value: 'all', label: 'Sve liste' },
    ...this.wordLists()
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((list) => ({ value: list.id, label: list.name })),
  ]);

  // Reči filtrirane samo po listi (osnova za računanje brojeva po filteru)
  private readonly listFilteredWords = computed(() => {
    let words = this.allWords();
    const listId = this.selectedListId();
    if (listId && listId !== 'all') {
      words = words.filter((w) => w.listId === listId);
    }
    return words;
  });

  public readonly filterCounts = computed(() => {
    const words = this.listFilteredWords();
    const progressKey = this.getProgressKey(this.selectedMode());

    return {
      all: words.length,
      new: words.filter(
        (w) =>
          w[progressKey].repetitions === 0 &&
          w[progressKey].correctCount === 0 &&
          w[progressKey].incorrectCount === 0,
      ).length,
      forgotten: words.filter(
        (w) =>
          w[progressKey].repetitions > 0 && this.spacedRepetition.isDueForReview(w[progressKey]),
      ).length,
      weakest: words.filter(
        (w) =>
          w[progressKey].repetitions > 0 &&
          (w[progressKey].easeFactor < 2.1 ||
            w[progressKey].incorrectCount > w[progressKey].correctCount),
      ).length,
    };
  });

  public readonly availableWords = computed(() => {
    const words = this.listFilteredWords();
    const progressKey = this.getProgressKey(this.selectedMode());
    const filter = this.selectedFilter();

    switch (filter) {
      case 'new':
        return words.filter(
          (w) =>
            w[progressKey].repetitions === 0 &&
            w[progressKey].correctCount === 0 &&
            w[progressKey].incorrectCount === 0,
        );

      case 'forgotten':
        return words.filter(
          (w) =>
            w[progressKey].repetitions > 0 && this.spacedRepetition.isDueForReview(w[progressKey]),
        );

      case 'weakest':
        return words
          .filter(
            (w) =>
              w[progressKey].repetitions > 0 &&
              (w[progressKey].easeFactor < 2.1 ||
                w[progressKey].incorrectCount > w[progressKey].correctCount),
          )
          .sort((a, b) => a[progressKey].easeFactor - b[progressKey].easeFactor);

      case 'all':
      default:
        return words;
    }
  });

  public readonly stats = computed((): PracticeStats => {
    const results = this.sessionResults();
    const total = results.length;
    const correct = results.filter((r) => r.correct).length;

    return {
      totalWords: total,
      correctCount: correct,
      incorrectCount: total - correct,
      accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
    };
  });

  public startPractice(): void {
    const words = this.availableWords();

    if (words.length === 0) {
      alert('Nema reči za vežbanje');
      return;
    }

    const orderedWords = this.shuffleEnabled() ? this.shuffleArray([...words]) : [...words];

    this.practiceWords.set(orderedWords);
    this.sessionResults.set([]);
    this.state.set('practicing');
  }

  public async handlePracticeFinished(results: PracticeResult[]): Promise<void> {
    this.sessionResults.set(results);
    await this.batchUpdateProgress(results);
    this.state.set('results');
  }

  public restartPractice(): void {
    this.state.set('setup');
    this.sessionResults.set([]);
  }

  public goHome(): void {
    this.router.navigate(['/']);
  }

  private async batchUpdateProgress(results: PracticeResult[]): Promise<void> {
    const mode = this.selectedMode();
    const progressKey = this.getProgressKey(mode);

    const updates = results.map((result) => {
      const currentProgress = result.word[progressKey];
      const newProgress = this.spacedRepetition.calculateNextReview(
        currentProgress,
        result.correct,
      );

      return {
        id: result.word.id,
        data: {
          [progressKey]: newProgress,
        } as Partial<Word>,
      };
    });

    try {
      await this.storage.batchUpdateWords(updates);
    } catch (error) {
      console.error('Error updating progress:', error);
      alert('Greška pri čuvanju napretka');
    }
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private getProgressKey(
    mode: PracticeMode,
  ):
    | 'flipCardSourceToTarget'
    | 'flipCardTargetToSource'
    | 'quizSourceToTarget'
    | 'quizTargetToSource' {
    switch (mode) {
      case 'flip-card-source-target':
        return 'flipCardSourceToTarget';
      case 'flip-card-target-source':
        return 'flipCardTargetToSource';
      case 'quiz-source-target':
        return 'quizSourceToTarget';
      case 'quiz-target-source':
        return 'quizTargetToSource';
    }
  }
}
