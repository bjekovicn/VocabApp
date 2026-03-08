import { computed, inject, Injectable, signal } from '@angular/core';

import { Word } from '@core/models/word.model';
import { PracticeMode } from '@core/models/practice-mode.model';
import { PracticeResult, PracticeStats } from '@core/models/practice-session.model';
import { SpacedRepetitionService } from '@core/services/abstractions/spaced-repetition.service';
import { StorageService } from '@core/services/abstractions/storage.service';
import { VocabularyFacade } from '@core/state/vocabulary.facade';
import { I18nService } from '@core/services/i18n.service';
import { SelectOption } from '@shared/select/custom-select.types';
import { FilterOption } from '../components/filter-selector/filter-selector.component';

export type PracticeState = 'setup' | 'practicing' | 'results';
export type PracticeDirection = 'source-target' | 'target-source';
export type PracticeType = 'flip-card' | 'quiz';
export type WordFilter = 'all' | 'weakest' | 'forgotten' | 'new' | 'mastered';

@Injectable()
export class PracticeFacade {
  private readonly storage = inject(StorageService);
  private readonly spacedRepetition = inject(SpacedRepetitionService);
  private readonly vocabulary = inject(VocabularyFacade);
  private readonly i18n = inject(I18nService);

  public readonly state = signal<PracticeState>('setup');
  public readonly errorMessage = signal<string | null>(null);

  public readonly selectedDirection = signal<PracticeDirection>('source-target');
  public readonly selectedType = signal<PracticeType>('flip-card');
  public readonly selectedListId = signal<string>('all');
  public readonly shuffleEnabled = signal(true);
  public readonly selectedFilter = signal<WordFilter>('all');

  public readonly practiceWords = signal<Word[]>([]);
  public readonly sessionResults = signal<PracticeResult[]>([]);

  public readonly selectedMode = computed<PracticeMode>(
    () => `${this.selectedType()}-${this.selectedDirection()}` as PracticeMode,
  );

  public readonly listOptions = computed<SelectOption[]>(() => [
    { value: 'all', label: this.i18n.t('common.allLists') },
    ...this.vocabulary.sortedWordLists().map((list) => {
      const insight = this.vocabulary.getWordListInsight(list.id);
      const details =
        insight.wordCount === 0
          ? this.i18n.t('wordLists.status.empty').toLowerCase()
          : `${this.i18n.t('common.wordCount', { count: insight.wordCount })}, ${this.i18n.t('home.studied').toLowerCase()} ${insight.coveragePercent}%, ${this.getLastActivityLabel(insight.lastActivityDays)}`;

      return {
        value: list.id,
        label: `${list.name} (${details})`,
      };
    }),
  ]);

  public readonly selectedListSummary = computed(() => {
    const selectedListId = this.selectedListId();

    if (selectedListId === 'all') {
      return null;
    }

    const selectedList = this.vocabulary.getWordListById(selectedListId);
    if (!selectedList) {
      return null;
    }

    const insight = this.vocabulary.getWordListInsight(selectedListId);
    return {
      name: selectedList.name,
      wordCount: insight.wordCount,
      coveragePercent: insight.coveragePercent,
      masteryPercent: insight.masteryPercent,
      lastActivityLabel: this.getLastActivityLabel(insight.lastActivityDays),
    };
  });

  public readonly listFilteredWords = computed(() => {
    const selectedListId = this.selectedListId();

    if (selectedListId === 'all') {
      return this.vocabulary.words();
    }

    return this.vocabulary.words().filter((word) => word.listId === selectedListId);
  });

  public readonly filterCounts = computed(() => {
    const words = this.listFilteredWords();
    const progressKey = this.getProgressKey(this.selectedMode());

    return {
      all: words.length,
      new: words.filter(
        (word) =>
          word[progressKey].repetitions === 0 &&
          word[progressKey].correctCount === 0 &&
          word[progressKey].incorrectCount === 0,
      ).length,
      forgotten: words.filter(
        (word) =>
          word[progressKey].repetitions > 0 &&
          this.spacedRepetition.isDueForReview(word[progressKey]),
      ).length,
      weakest: words.filter(
        (word) =>
          word[progressKey].repetitions > 0 &&
          (word[progressKey].easeFactor < 2.1 ||
            word[progressKey].incorrectCount > word[progressKey].correctCount),
      ).length,
      mastered: words.filter(
        (word) =>
          word[progressKey].repetitions > 0 &&
          word[progressKey].easeFactor >= 2.5 &&
          word[progressKey].correctCount >= word[progressKey].incorrectCount,
      ).length,
    };
  });

  public readonly filterOptions = computed<FilterOption[]>(() => [
    {
      value: 'all',
      label: this.i18n.t('practice.filter.all'),
      icon: '📚',
      count: this.filterCounts().all,
      disabled: false,
      color: 'gray',
    },
    {
      value: 'weakest',
      label: this.i18n.t('practice.filter.weakest'),
      icon: '📉',
      count: this.filterCounts().weakest,
      disabled: this.filterCounts().weakest === 0,
      color: 'red',
    },
    {
      value: 'forgotten',
      label: this.i18n.t('practice.filter.forgotten'),
      icon: '🕰️',
      count: this.filterCounts().forgotten,
      disabled: this.filterCounts().forgotten === 0,
      color: 'orange',
    },
    {
      value: 'new',
      label: this.i18n.t('practice.filter.new'),
      icon: '✨',
      count: this.filterCounts().new,
      disabled: this.filterCounts().new === 0,
      color: 'green',
    },
    {
      value: 'mastered',
      label: this.i18n.t('practice.filter.mastered'),
      icon: '🏆',
      count: this.filterCounts().mastered,
      disabled: this.filterCounts().mastered === 0,
      color: 'blue',
    },
  ]);

  public readonly availableWords = computed(() => {
    const words = this.listFilteredWords();
    const progressKey = this.getProgressKey(this.selectedMode());

    switch (this.selectedFilter()) {
      case 'new':
        return words.filter(
          (word) =>
            word[progressKey].repetitions === 0 &&
            word[progressKey].correctCount === 0 &&
            word[progressKey].incorrectCount === 0,
        );
      case 'forgotten':
        return words.filter(
          (word) =>
            word[progressKey].repetitions > 0 &&
            this.spacedRepetition.isDueForReview(word[progressKey]),
        );
      case 'weakest':
        return words
          .filter(
            (word) =>
              word[progressKey].repetitions > 0 &&
              (word[progressKey].easeFactor < 2.1 ||
                word[progressKey].incorrectCount > word[progressKey].correctCount),
          )
          .sort((a, b) => a[progressKey].easeFactor - b[progressKey].easeFactor);
      case 'mastered':
        return words
          .filter(
            (word) =>
              word[progressKey].repetitions > 0 &&
              word[progressKey].easeFactor >= 2.5 &&
              word[progressKey].correctCount >= word[progressKey].incorrectCount,
          )
          .sort((a, b) => b[progressKey].easeFactor - a[progressKey].easeFactor);
      case 'all':
      default:
        return words;
    }
  });

  public readonly stats = computed((): PracticeStats => {
    const results = this.sessionResults();
    const total = results.length;
    const correct = results.filter((result) => result.correct).length;

    return {
      totalWords: total,
      correctCount: correct,
      incorrectCount: total - correct,
      accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
    };
  });

  public readonly startButtonLabel = computed(() => {
    switch (this.selectedFilter()) {
      case 'forgotten':
        return this.i18n.t('practice.start.forgotten');
      case 'new':
        return this.i18n.t('practice.start.new');
      case 'weakest':
        return this.i18n.t('practice.start.weakest');
      case 'mastered':
        return this.i18n.t('practice.start.mastered');
      case 'all':
      default:
        return this.i18n.t('practice.start.default');
    }
  });

  public setDirection(direction: string): void {
    this.selectedDirection.set(direction as PracticeDirection);
    this.clearError();
  }

  public setType(type: string): void {
    this.selectedType.set(type as PracticeType);
    this.clearError();
  }

  public setShuffleEnabled(shuffled: boolean): void {
    this.shuffleEnabled.set(shuffled);
  }

  public setFilter(filter: string): void {
    this.selectedFilter.set(filter as WordFilter);
    this.clearError();
  }

  public applyPreset(filter: string | null): void {
    if (filter === 'all' || filter === 'weakest' || filter === 'forgotten' || filter === 'new' || filter === 'mastered') {
      this.selectedFilter.set(filter);
      this.clearError();
    }
  }

  public startPractice(): void {
    const words = this.availableWords();

    if (words.length === 0) {
      this.errorMessage.set(this.i18n.t('practice.noWordsForSelection'));
      return;
    }

    this.practiceWords.set(this.shuffleEnabled() ? this.shuffleArray([...words]) : [...words]);
    this.sessionResults.set([]);
    this.errorMessage.set(null);
    this.state.set('practicing');
  }

  public async finishPractice(results: PracticeResult[]): Promise<void> {
    this.sessionResults.set(results);
    await this.batchUpdateProgress(results);
    this.state.set('results');
  }

  public restartPractice(): void {
    this.state.set('setup');
    this.sessionResults.set([]);
    this.practiceWords.set([]);
    this.errorMessage.set(null);
  }

  private async batchUpdateProgress(results: PracticeResult[]): Promise<void> {
    if (results.length === 0) {
      return;
    }

    const progressKey = this.getProgressKey(this.selectedMode());
    const updates = results.map((result) => ({
      id: result.word.id,
      data: {
        [progressKey]: this.spacedRepetition.calculateNextReview(
          result.word[progressKey],
          result.correct,
        ),
      } as Partial<Word>,
    }));

    try {
      await this.storage.batchUpdateWords(updates);
      this.errorMessage.set(null);
    } catch (error) {
      console.error('Error updating progress:', error);
      this.errorMessage.set(this.i18n.t('practice.saveError'));
    }
  }

  private clearError(): void {
    if (this.errorMessage()) {
      this.errorMessage.set(null);
    }
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];

    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
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

  private getLastActivityLabel(lastActivityDays: number | null): string {
    if (lastActivityDays === null) {
      return this.i18n.t('practice.lastActivity.never');
    }

    if (lastActivityDays <= 0) {
      return this.i18n.t('practice.lastActivity.today');
    }

    if (lastActivityDays === 1) {
      return this.i18n.t('practice.lastActivity.yesterday');
    }

    return this.i18n.t('practice.lastActivity.daysAgo', { count: lastActivityDays });
  }
}
