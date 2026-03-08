import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SpacedRepetitionService } from '@core/services/abstractions/spaced-repetition.service';
import { VocabularyFacade } from '@core/state/vocabulary.facade';
import { WordCategory, WORD_CATEGORIES } from '@core/models/word-category.model';
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
  private readonly vocabulary = inject(VocabularyFacade);
  private readonly router = inject(Router);

  private readonly words = this.vocabulary.words;

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
    return this.words().filter(
      (w) =>
        this.spacedRepetition.isDueForReview(w.flipCardSourceToTarget) ||
        this.spacedRepetition.isDueForReview(w.flipCardTargetToSource) ||
        this.spacedRepetition.isDueForReview(w.quizSourceToTarget) ||
        this.spacedRepetition.isDueForReview(w.quizTargetToSource),
    ).length;
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
      return 'Dodaj prve reči';
    }

    if (this.dueToday() > 0) {
      return 'Fokus za danas je obnova';
    }

    if (this.weak() > 0) {
      return 'Imaš nekoliko slabih tačaka';
    }

    if (this.newWords() > 0) {
      return 'Dobar trenutak za nove reči';
    }

    return 'Odličan tempo učenja';
  });

  public readonly focusDescription = computed(() => {
    if (this.totalWords() === 0) {
      return 'Kreni dodavanjem prve liste ili importom, pa zatim započni vežbanje.';
    }

    if (this.dueToday() > 0) {
      return `Imaš ${this.dueToday()} reči spremnih za ponavljanje. Njih vredi odraditi pre novih pojmova.`;
    }

    if (this.weak() > 0) {
      return `${this.weak()} reči ti još prave problem. Kratka sesija slabih reči će najbrže popraviti rezultat.`;
    }

    if (this.newWords() > 0) {
      return `${this.newWords()} reči još nisu započete, pa možeš mirno da proširiš fond.`;
    }

    return 'Trenutno nema hitnih stavki. Možeš da odradiš kratko održavanje ili da dodaš nov sadržaj.';
  });

  public readonly focusActionLabel = computed(() => {
    if (this.totalWords() === 0) {
      return 'Dodaj prve reči';
    }

    if (this.dueToday() > 0) {
      return 'Vežbaj obnovu';
    }

    if (this.weak() > 0) {
      return 'Utvrdi slabe reči';
    }

    if (this.newWords() > 0) {
      return 'Vežbaj nove reči';
    }

    return 'Ponovi savladane';
  });

  public readonly overviewCards = computed<DashboardHighlight[]>(() => [
    {
      title: 'Za fokus danas',
      value: this.dueToday(),
      subtitle: 'reči čekaju ponavljanje',
      hint:
        this.dueToday() > 0
          ? 'Najveći efekat daje kratka sesija ponavljanja.'
          : 'Nema hitnih obnova za danas.',
      progressPercent: this.dueTodayPercent(),
      valueClass: 'text-primary-700',
      progressClass: 'bg-primary-500',
      actionLabel: 'Vežbaj obnovu',
      practiceFilter: 'forgotten',
    },
    {
      title: 'Nove reči',
      value: this.newWords(),
      subtitle: 'još nisu započete',
      hint:
        this.newWords() > 0
          ? `${this.newWordsPercent()}% kolekcije još čeka prvi prolaz.`
          : 'Sve reči su makar jednom obrađene.',
      progressPercent: this.newWordsPercent(),
      valueClass: 'text-sky-700',
      progressClass: 'bg-sky-500',
      actionLabel: 'Vežbaj nove',
      practiceFilter: 'new',
    },
    {
      title: 'Potrebno utvrđivanje',
      value: this.weak(),
      subtitle: 'reči traže dodatnu pažnju',
      hint:
        this.weak() > 0
          ? 'Ovde najbrže dobijaš osećaj napretka.'
          : 'Nema izraženih slabih reči trenutno.',
      progressPercent: this.weakPercent(),
      valueClass: 'text-amber-700',
      progressClass: 'bg-amber-500',
      actionLabel: 'Vežbaj slabe',
      practiceFilter: 'weakest',
    },
    {
      title: 'Savladano',
      value: this.mastered(),
      subtitle: 'reči su stabilne',
      hint: `${this.masteryPercent()}% cele kolekcije je trenutno u dobroj formi.`,
      progressPercent: this.masteryPercent(),
      valueClass: 'text-emerald-700',
      progressClass: 'bg-emerald-500',
      actionLabel: 'Ponovi savladane',
      practiceFilter: 'mastered',
    },
  ]);

  public readonly categoryStats = computed((): CategoryStats[] => {
    const words = this.words();
    const totalWords = words.length;

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
