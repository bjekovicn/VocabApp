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
  public readonly selectedMode = signal<PracticeMode>('flip-card');
  public readonly selectedListId = signal<string | null>(null);
  public readonly selectedCategories = signal<WordCategory[]>([]);

  public readonly practiceWords = signal<Word[]>([]);
  public readonly sessionResults = signal<PracticeResult[]>([]);

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

    this.practiceWords.set(words);
    this.sessionResults.set([]);
    this.state.set('practicing');
  }

  public handlePracticeFinished(results: PracticeResult[]): void {
    this.sessionResults.set(results);
    this.state.set('results');
  }

  public restartPractice(): void {
    this.state.set('setup');
    this.sessionResults.set([]);
  }

  public goHome(): void {
    this.router.navigate(['/']);
  }

  private getProgressKey(
    mode: PracticeMode,
  ): 'flipCard' | 'quizSourceToTarget' | 'quizTargetToSource' {
    switch (mode) {
      case 'flip-card':
        return 'flipCard';
      case 'quiz-source-target':
        return 'quizSourceToTarget';
      case 'quiz-target-source':
        return 'quizTargetToSource';
    }
  }
}
