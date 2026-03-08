import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SpacedRepetitionService } from '@core/services/abstractions/spaced-repetition.service';
import { LanguagePairFilterService } from '@core/services/language-pair-filter.service';
import { VocabularyFacade } from '@core/state/vocabulary.facade';
import { WordCategory, WORD_CATEGORIES } from '@core/models/word-category.model';
import { I18nService } from '@core/services/i18n.service';
import { CustomCardComponent } from '@shared/card/custom-card';
import { CustomButtonComponent } from '@shared/button/custom-button';
import { Word } from '@core/models/word.model';

interface CategoryStats {
  category: WordCategory;
  label: string;
  total: number;
  dueToday: number;
  sharePercent: number;
}

interface DashboardHighlight {
  title: string;
  value: number;
  subtitle: string;
  hint: string;
  progressPercent: number;
  valueClass: string;
  progressClass: string;
  actionLabel: string;
  practiceFilter: 'forgotten' | 'new' | 'weakest' | 'mastered';
}

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, CustomCardComponent, CustomButtonComponent],
  templateUrl: './home.component.html',
})
export class HomePage {
  private readonly spacedRepetition = inject(SpacedRepetitionService);
  private readonly languagePairFilter = inject(LanguagePairFilterService);
  private readonly vocabulary = inject(VocabularyFacade);
  private readonly router = inject(Router);
  public readonly i18n = inject(I18nService);

  private readonly filteredListIds = computed(() => {
    const lists = this.vocabulary.wordLists();
    const source = this.languagePairFilter.selectedSourceLanguage();
    const target = this.languagePairFilter.selectedTargetLanguage();
    return new Set(
      lists
        .filter((list) => {
          const [src = '', tgt = ''] = list.languagePair.split('-');
          if (source && src !== source) return false;
          if (target && tgt !== target) return false;
          return true;
        })
        .map((list) => list.id),
    );
  });

  private readonly words = computed(() => {
    const ids = this.filteredListIds();
    return this.vocabulary.words().filter((w) => ids.has(w.listId));
  });

  public readonly totalWords = computed(() => this.words().length);
  public readonly studiedWords = computed(
    () => this.words().filter((word) => this.getTotalAttempts(word) > 0).length,
  );

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
    return this.words().filter((word) => this.isForgottenWord(word)).length;
  });

  public readonly studiedPercent = computed(() =>
    this.getPercent(this.studiedWords(), this.totalWords()),
  );
  public readonly masteryPercent = computed(() =>
    this.getPercent(this.mastered(), this.totalWords()),
  );
  public readonly weakPercent = computed(() => this.getPercent(this.weak(), this.totalWords()));
  public readonly newWordsPercent = computed(() =>
    this.getPercent(this.newWords(), this.totalWords()),
  );
  public readonly dueTodayPercent = computed(() =>
    this.getPercent(this.dueToday(), this.totalWords()),
  );

  public readonly focusTitle = computed(() => {
    if (this.totalWords() === 0) {
      return this.i18n.t('home.focus.empty.title');
    }

    if (this.dueToday() > 0) {
      return this.i18n.t('home.focus.review.title');
    }

    if (this.weak() > 0) {
      return this.i18n.t('home.focus.weak.title');
    }

    if (this.newWords() > 0) {
      return this.i18n.t('home.focus.new.title');
    }

    return this.i18n.t('home.focus.good.title');
  });

  public readonly focusDescription = computed(() => {
    if (this.totalWords() === 0) {
      return this.i18n.t('home.focus.empty.description');
    }

    if (this.dueToday() > 0) {
      return this.i18n.t('home.focus.review.description', { count: this.dueToday() });
    }

    if (this.weak() > 0) {
      return this.i18n.t('home.focus.weak.description', { count: this.weak() });
    }

    if (this.newWords() > 0) {
      return this.i18n.t('home.focus.new.description', { count: this.newWords() });
    }

    return this.i18n.t('home.focus.good.description');
  });

  public readonly focusActionLabel = computed(() => {
    if (this.totalWords() === 0) {
      return this.i18n.t('home.focus.empty.action');
    }

    if (this.dueToday() > 0) {
      return this.i18n.t('home.focus.review.action');
    }

    if (this.weak() > 0) {
      return this.i18n.t('home.focus.weak.action');
    }

    if (this.newWords() > 0) {
      return this.i18n.t('home.focus.new.action');
    }

    return this.i18n.t('home.focus.good.action');
  });

  public readonly overviewCards = computed<DashboardHighlight[]>(() => [
    {
      title: this.i18n.t('home.card.focusToday.title'),
      value: this.dueToday(),
      subtitle: this.i18n.t('home.card.focusToday.subtitle'),
      hint:
        this.dueToday() > 0
          ? this.i18n.t('home.card.focusToday.hint.active')
          : this.i18n.t('home.card.focusToday.hint.empty'),
      progressPercent: this.dueTodayPercent(),
      valueClass: 'text-primary-700',
      progressClass: 'bg-primary-500',
      actionLabel: this.i18n.t('home.card.focusToday.action'),
      practiceFilter: 'forgotten',
    },
    {
      title: this.i18n.t('home.card.newWords.title'),
      value: this.newWords(),
      subtitle: this.i18n.t('home.card.newWords.subtitle'),
      hint:
        this.newWords() > 0
          ? this.i18n.t('home.card.newWords.hint.active', { percent: this.newWordsPercent() })
          : this.i18n.t('home.card.newWords.hint.empty'),
      progressPercent: this.newWordsPercent(),
      valueClass: 'text-sky-700',
      progressClass: 'bg-sky-500',
      actionLabel: this.i18n.t('home.card.newWords.action'),
      practiceFilter: 'new',
    },
    {
      title: this.i18n.t('home.card.weak.title'),
      value: this.weak(),
      subtitle: this.i18n.t('home.card.weak.subtitle'),
      hint:
        this.weak() > 0
          ? this.i18n.t('home.card.weak.hint.active')
          : this.i18n.t('home.card.weak.hint.empty'),
      progressPercent: this.weakPercent(),
      valueClass: 'text-amber-700',
      progressClass: 'bg-amber-500',
      actionLabel: this.i18n.t('home.card.weak.action'),
      practiceFilter: 'weakest',
    },
    {
      title: this.i18n.t('home.card.mastered.title'),
      value: this.mastered(),
      subtitle: this.i18n.t('home.card.mastered.subtitle'),
      hint: this.i18n.t('home.ofEntireCollection', { percent: this.masteryPercent() }),
      progressPercent: this.masteryPercent(),
      valueClass: 'text-emerald-700',
      progressClass: 'bg-emerald-500',
      actionLabel: this.i18n.t('home.card.mastered.action'),
      practiceFilter: 'mastered',
    },
  ]);

  public readonly categoryStats = computed((): CategoryStats[] => {
    const words = this.words();
    const totalWords = words.length;

    return WORD_CATEGORIES.map((cat) => ({
      category: cat.value,
      label: this.i18n.getCategoryLabel(cat.value),
      total: words.filter((w) => w.category === cat.value).length,
      dueToday: words.filter((w) => w.category === cat.value && this.isForgottenWord(w)).length,
      sharePercent: this.getPercent(
        words.filter((w) => w.category === cat.value).length,
        totalWords,
      ),
    })).sort((a, b) => b.total - a.total);
  });

  public readonly topCategory = computed(() => this.categoryStats().find((stat) => stat.total > 0) ?? null);

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

  private isForgottenWord(word: Word): boolean {
    const modes = [
      word.flipCardSourceToTarget,
      word.flipCardTargetToSource,
      word.quizSourceToTarget,
      word.quizTargetToSource,
    ];

    return modes.some(
      (mode) => mode.repetitions > 0 && this.spacedRepetition.isDueForReview(mode),
    );
  }

  private getPercent(value: number, total: number): number {
    if (total === 0) {
      return 0;
    }

    return Math.round((value / total) * 100);
  }

  public navigateFromFocus(): void {
    if (this.totalWords() === 0) {
      this.navigateToAddWord();
      return;
    }

    if (this.dueToday() > 0) {
      this.navigateToPracticeWithFilter('forgotten');
      return;
    }

    if (this.weak() > 0) {
      this.navigateToPracticeWithFilter('weakest');
      return;
    }

    if (this.newWords() > 0) {
      this.navigateToPracticeWithFilter('new');
      return;
    }

    this.navigateToPracticeWithFilter('mastered');
  }

  public navigateToPracticeWithFilter(
    filter: 'forgotten' | 'new' | 'weakest' | 'mastered',
  ): void {
    this.router.navigate(['/practice'], { queryParams: { filter } });
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
