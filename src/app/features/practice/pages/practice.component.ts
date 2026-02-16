import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { StorageService } from '@core/services/abstractions/storage.service';
import { SpacedRepetitionService } from '@core/services/abstractions/spaced-repetition.service';
import { Word } from '@core/models/word.model';
import { PracticeMode, PRACTICE_MODES } from '@core/models/practice-mode.model';
import { WordCategory, WORD_CATEGORIES } from '@core/models/word-category.model';
import { PracticeResult, PracticeStats } from '@core/models/practice-session.model';
import { CustomSelectComponent } from '@shared/select/custom-select';
import { CustomButtonComponent } from '@shared/button/custom-button';
import { CustomCardComponent } from '@shared/card/custom-card';
import { SelectOption } from '@shared/select/custom-select.types';
import { FlipCardPracticeComponent } from '../components/flip-card-practice/flip-card-practice.component';
import { QuizPracticeComponent } from '../components/quiz-practice/quiz-practice.component';

type PracticeState = 'setup' | 'practicing' | 'results';

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
  public readonly selectedMode = signal<PracticeMode>('flip-card-source-target');
  public readonly selectedCategories = signal<WordCategory[]>([]);

  public readonly practiceWords = signal<Word[]>([]);
  public readonly sessionResults = signal<PracticeResult[]>([]);
  public readonly selectedListId = signal<string | null>(null);

  public readonly modeOptions = signal<SelectOption[]>(
    PRACTICE_MODES.map((mode) => ({ value: mode.value, label: mode.label })),
  );

  public readonly listOptions = computed(() => [
    { value: 'all', label: 'Sve liste' },
    ...this.wordLists().map((list) => ({ value: list.id, label: list.name })),
  ]);

  public readonly categoryOptions = signal<SelectOption[]>(
    WORD_CATEGORIES.map((cat) => ({ value: cat.value, label: cat.label })),
  );

  public readonly availableWords = computed(() => {
    let words = this.allWords();
    const listId = this.selectedListId();
    const categories = this.selectedCategories();
    const mode = this.selectedMode();

    if (listId && listId !== 'all') {
      words = words.filter((w) => w.listId === listId);
    }

    if (categories.length > 0) {
      words = words.filter((w) => categories.includes(w.category));
    }

    const progressKey = this.getProgressKey(mode);
    return words.filter((w) => {
      const progress = w[progressKey];
      return this.spacedRepetition.isDueForReview(progress);
    });
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

    const shuffledWords = this.shuffleArray([...words]);

    this.practiceWords.set(shuffledWords);
    this.sessionResults.set([]);
    this.state.set('practicing');
  }

  public async handlePracticeFinished(results: PracticeResult[]): Promise<void> {
    this.sessionResults.set(results);

    // Batch update progress for all words
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
