import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { StorageService } from '@core/services/abstractions/storage.service';
import { Word } from '@core/models/word.model';
import { PracticeMode } from '@core/models/practice-mode.model';
import { CustomCardComponent } from '@shared/card/custom-card';
import { CustomButtonComponent } from '@shared/button/custom-button';
import { WordProgressBadgesComponent } from 'src/app/components/progress-badges/word-progress-badges.component';
import { WordProgressTable } from 'src/app/components/word-progress-table/word-progress-table';

type TabMode = 'all' | 'new' | 'weak' | 'forgotten' | PracticeMode;

interface WordPerformance {
  word: Word;
  mode: PracticeMode;
  score: number;
  accuracy: number;
  incorrectCount: number;
  correctCount: number;
  repetitions: number;
  easeFactor: number;
  lastReview: Date | null;
  daysSinceReview: number;
  category: 'new' | 'weak' | 'forgotten' | 'good';
  listName: string;
}

export interface ProgressDetail {
  mode: PracticeMode;
  label: string;
  repetitions: number;
  easeFactor: number;
  correctCount: number;
  incorrectCount: number;
  accuracy: number;
  daysSinceReview: number;
}

@Component({
  selector: 'app-progress-review-page',
  standalone: true,
  imports: [
    CommonModule,
    CustomCardComponent,
    CustomButtonComponent,
    WordProgressTable,
    WordProgressBadgesComponent,
  ],
  templateUrl: './progress-review.component.html',
})
export class ProgressReviewPage {
  private storage = inject(StorageService);
  private router = inject(Router);

  private allWords = toSignal(this.storage.getWords(), { initialValue: [] });
  private allLists = toSignal(this.storage.getWordLists(), { initialValue: [] });

  selectedTab = signal<TabMode>('weak');
  limit = signal(20);

  // ================================
  // PERFORMANCE LIST
  // ================================

  wordPerformances = computed(() => {
    const words = this.allWords();
    const tab = this.selectedTab();
    const lists = this.allLists();

    const performances: WordPerformance[] = [];

    words.forEach((word) => {
      const listName = lists.find((l) => l.id === word.listId)?.name ?? '–';

      const modes: PracticeMode[] =
        tab === 'all' || tab === 'new' || tab === 'weak' || tab === 'forgotten'
          ? [
              'flip-card-source-target',
              'flip-card-target-source',
              'quiz-source-target',
              'quiz-target-source',
            ]
          : [tab as PracticeMode];

      modes.forEach((mode) => {
        performances.push(this.analyzeWord(word, mode, listName));
      });
    });

    const filtered = performances.filter((p) => {
      if (tab === 'new') return p.category === 'new';
      if (tab === 'weak') return p.category === 'weak';
      if (tab === 'forgotten') return p.category === 'forgotten';
      return true;
    });

    // Descending — najgore na vrhu
    return filtered.sort((a, b) => b.score - a.score).slice(0, this.limit());
  });

  // ================================
  // STATS
  // ================================

  stats = computed(() => {
    const all = this.allWords();
    const performances = this.wordPerformances();

    const practicedWords = all.filter((w) =>
      [
        w.flipCardSourceToTarget,
        w.flipCardTargetToSource,
        w.quizSourceToTarget,
        w.quizTargetToSource,
      ].some((p) => p.repetitions > 0),
    ).length;

    const avgAccuracy =
      performances.length > 0
        ? Math.round(performances.reduce((sum, p) => sum + p.accuracy, 0) / performances.length)
        : 0;

    return {
      totalWords: all.length,
      practicedWords,
      weakWordsCount: performances.length,
      avgAccuracy,
    };
  });

  // ================================
  // ANALIZA
  // ================================

  private analyzeWord(word: Word, mode: PracticeMode, listName: string): WordPerformance {
    const progress = word[this.getProgressKey(mode)];

    const total = progress.correctCount + progress.incorrectCount;
    const accuracy = total > 0 ? Math.round((progress.correctCount / total) * 100) : 0;

    const daysSinceReview = progress.lastReview
      ? Math.floor((Date.now() - new Date(progress.lastReview).getTime()) / 86400000)
      : 999;

    const category = this.categorizeWord(
      progress.repetitions,
      accuracy,
      progress.easeFactor,
      progress.correctCount,
      progress.incorrectCount,
      daysSinceReview,
    );

    const score = this.calculateWeaknessScore(
      accuracy,
      progress.incorrectCount,
      progress.easeFactor,
      daysSinceReview,
      progress.repetitions,
    );

    return {
      word,
      mode,
      score,
      accuracy,
      incorrectCount: progress.incorrectCount,
      correctCount: progress.correctCount,
      repetitions: progress.repetitions,
      easeFactor: progress.easeFactor,
      lastReview: progress.lastReview,
      daysSinceReview,
      category,
      listName,
    };
  }

  private categorizeWord(
    repetitions: number,
    accuracy: number,
    easeFactor: number,
    correct: number,
    incorrect: number,
    days: number,
  ): 'new' | 'weak' | 'forgotten' | 'good' {
    if (repetitions === 0 && correct === 0 && incorrect === 0) return 'new';
    if (accuracy < 70 || incorrect > correct || easeFactor < 2.1) return 'weak';
    if (days > 7 && easeFactor < 2.3) return 'forgotten';
    return 'good';
  }

  private calculateWeaknessScore(
    accuracy: number,
    incorrectCount: number,
    easeFactor: number,
    daysSinceReview: number,
    repetitions: number,
  ): number {
    return (
      (100 - accuracy) * 2 +
      incorrectCount * 15 +
      (2.5 - easeFactor) * 40 +
      daysSinceReview * 2 +
      (repetitions === 0 ? 50 : 0)
    );
  }

  private getProgressKey(mode: PracticeMode) {
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

  // ================================
  // UI HELPERS
  // ================================

  getAccuracyColor(accuracy: number): string {
    if (accuracy >= 80) return 'text-green-600';
    if (accuracy >= 60) return 'text-yellow-600';
    return 'text-red-600';
  }

  getEaseFactorColor(ease: number): string {
    if (ease >= 2.5) return 'text-green-600';
    if (ease >= 2.0) return 'text-yellow-600';
    return 'text-red-600';
  }

  getEaseFactorBg(ease: number): string {
    if (ease >= 2.5) return 'bg-green-100 text-green-700';
    if (ease >= 2.0) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  }

  getRepetitionsBg(reps: number): string {
    if (reps >= 5) return 'bg-green-100 text-green-700';
    if (reps >= 2) return 'bg-yellow-100 text-yellow-700';
    return 'bg-gray-100 text-gray-600';
  }

  getModeLabel(mode: PracticeMode): string {
    switch (mode) {
      case 'flip-card-source-target':
        return 'Flip DE→SR';
      case 'flip-card-target-source':
        return 'Flip SR→DE';
      case 'quiz-source-target':
        return 'Kviz DE→SR';
      case 'quiz-target-source':
        return 'Kviz SR→DE';
    }
  }

  getEffectiveRepetitions(
    repetitions: number,
    correctCount: number,
    incorrectCount: number,
  ): number {
    const totalAttempts = correctCount + incorrectCount;
    return totalAttempts;
  }

  // Svih 4 progress zapisa za prikaz u detalje tabeli
  getAllProgressDetails(perf: WordPerformance): ProgressDetail[] {
    const modeMap: Array<{ mode: PracticeMode; key: string; label: string }> = [
      { mode: 'flip-card-source-target', key: 'flipCardSourceToTarget', label: 'Flip DE→SR' },
      { mode: 'flip-card-target-source', key: 'flipCardTargetToSource', label: 'Flip SR→DE' },
      { mode: 'quiz-source-target', key: 'quizSourceToTarget', label: 'Kviz DE→SR' },
      { mode: 'quiz-target-source', key: 'quizTargetToSource', label: 'Kviz SR→DE' },
    ];

    return modeMap.map(({ mode, key, label }) => {
      const p = (perf.word as any)[key];
      const total = p.correctCount + p.incorrectCount;
      const accuracy = total > 0 ? Math.round((p.correctCount / total) * 100) : 0;
      const daysSinceReview = p.lastReview
        ? Math.floor((Date.now() - new Date(p.lastReview).getTime()) / 86400000)
        : 999;
      return {
        mode,
        label,
        repetitions: p.repetitions,
        easeFactor: p.easeFactor,
        correctCount: p.correctCount,
        incorrectCount: p.incorrectCount,
        accuracy,
        daysSinceReview,
      };
    });
  }

  // ================================
  // ACTIONS
  // ================================

  practiceWeakWords() {
    const words = this.wordPerformances().map((p) => p.word);
    this.router.navigate(['/practice'], {
      state: { weakWordsMode: true, weakWords: words },
    });
  }
}
