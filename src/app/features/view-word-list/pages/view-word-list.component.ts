import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SpacedRepetitionService } from '@core/services/abstractions/spaced-repetition.service';
import { StorageService } from '@core/services/abstractions/storage.service';
import { LanguagePairFilterService } from '@core/services/language-pair-filter.service';
import { VocabularyFacade } from '@core/state/vocabulary.facade';
import { Word } from '@core/models/word.model';
import { WordCategory, WORD_CATEGORIES } from '@core/models/word-category.model';
import { I18nService } from '@core/services/i18n.service';
import { CustomCardComponent } from '@shared/card/custom-card';
import { CustomButtonComponent } from '@shared/button/custom-button';
import { CustomSelectComponent } from '@shared/select/custom-select';
import { SelectOption } from '@shared/select/custom-select.types';
import { WordProgressBadgesComponent } from 'src/app/components/progress-badges/word-progress-badges.component';

@Component({
  selector: 'app-view-word-list-page',
  standalone: true,
  imports: [
    CommonModule,
    CustomCardComponent,
    CustomButtonComponent,
    CustomSelectComponent,
    WordProgressBadgesComponent,
  ],
  templateUrl: './view-word-list.component.html',
})
export class ViewWordListComponent {
  private readonly spacedRepetition = inject(SpacedRepetitionService);
  private readonly storage = inject(StorageService);
  private readonly languagePairFilter = inject(LanguagePairFilterService);
  private readonly vocabulary = inject(VocabularyFacade);
  private readonly router = inject(Router);
  public readonly i18n = inject(I18nService);

  public readonly listId = input<string | null>(null);

  public readonly selectedListId = signal<string>('all');
  public readonly selectedCategory = signal<WordCategory | 'all'>('all');
  public readonly materializingListId = signal<string | null>(null);

  public readonly filteredLists = computed(() =>
    this.vocabulary.sortedWordLists().filter((list) => this.matchesLanguageFilters(list.languagePair)),
  );
  public readonly listOptions = computed(() => [
    { value: 'all', label: this.i18n.t('common.allLists') },
    ...this.filteredLists().map((list) => ({
      value: list.id,
      label: `${list.name}${list.isDefault ? ` • ${this.i18n.t('wordLists.defaultBadge')}` : ''}`,
    })),
  ]);

  public readonly categoryOptions = computed<SelectOption[]>(() => [
    { value: 'all', label: this.i18n.t('common.allCategories') },
    ...WORD_CATEGORIES.map((cat) => ({
      value: cat.value,
      label: this.i18n.getCategoryLabel(cat.value),
    })),
  ]);

  public readonly filteredWords = computed(() => {
    const availableListIds = new Set(this.filteredLists().map((list) => list.id));
    let words = this.vocabulary.words().filter((word) => availableListIds.has(word.listId));
    const listId = this.selectedListId();
    const category = this.selectedCategory();

    if (listId && listId !== 'all') {
      words = words.filter((w) => w.listId === listId);
    }

    if (category !== 'all') {
      words = words.filter((w) => w.category === category);
    }

    return [...words].sort((a, b) => {
      const aAttempts = this.getTotalAttempts(a);
      const bAttempts = this.getTotalAttempts(b);
      if (aAttempts === 0 && bAttempts === 0) return 0;
      if (aAttempts === 0) return 1;
      if (bAttempts === 0) return -1;
      return this.getWeaknessScore(b) - this.getWeaknessScore(a);
    });
  });

  constructor() {
    effect(() => {
      this.selectedListId.set(this.listId() ?? 'all');
    });

    effect(() => {
      const selectedListId = this.selectedListId();
      const allowedListIds = new Set(this.filteredLists().map((list) => list.id));

      if (selectedListId !== 'all' && !allowedListIds.has(selectedListId)) {
        this.selectedListId.set('all');
      }
    });

    effect(() => {
      const selectedListId = this.selectedListId();
      const selectedList = this.vocabulary.getWordListById(selectedListId);

      if (!selectedList?.isReadOnlyDefault || this.materializingListId() === selectedListId) {
        return;
      }

      void this.materializeSelectedList(selectedListId);
    });
  }

  // ================================
  // STATS PO REČI
  // ================================

  getTotalCorrect(word: Word): number {
    return (
      word.flipCardSourceToTarget.correctCount +
      word.flipCardTargetToSource.correctCount +
      word.quizSourceToTarget.correctCount +
      word.quizTargetToSource.correctCount
    );
  }

  getTotalIncorrect(word: Word): number {
    return (
      word.flipCardSourceToTarget.incorrectCount +
      word.flipCardTargetToSource.incorrectCount +
      word.quizSourceToTarget.incorrectCount +
      word.quizTargetToSource.incorrectCount
    );
  }

  getTotalAttempts(word: Word): number {
    return this.getTotalCorrect(word) + this.getTotalIncorrect(word);
  }

  getAvgEaseFactor(word: Word): number {
    const sum =
      word.flipCardSourceToTarget.easeFactor +
      word.flipCardTargetToSource.easeFactor +
      word.quizSourceToTarget.easeFactor +
      word.quizTargetToSource.easeFactor;
    return Math.round((sum / 4) * 100) / 100;
  }

  getTotalAccuracy(word: Word): number {
    const totalCorrect = this.getTotalCorrect(word);
    const total = this.getTotalAttempts(word);
    return total > 0 ? Math.round((totalCorrect / total) * 100) : 0;
  }

  private getWeaknessScore(word: Word): number {
    const avgEase = this.getAvgEaseFactor(word);
    const accuracy = this.getTotalAccuracy(word);
    return (100 - accuracy) * 2 + (2.5 - avgEase) * 40;
  }

  getDaysSinceReview(word: Word): number {
    const dates = [
      word.flipCardSourceToTarget.lastReview,
      word.flipCardTargetToSource.lastReview,
      word.quizSourceToTarget.lastReview,
      word.quizTargetToSource.lastReview,
    ].filter(Boolean) as Date[];

    if (dates.length === 0) return 999;
    const latest = Math.max(...dates.map((d) => new Date(d).getTime()));
    return Math.floor((Date.now() - latest) / 86400000);
  }

  getLastActivityLabel(word: Word): string {
    const daysSinceReview = this.getDaysSinceReview(word);

    if (daysSinceReview === 999) {
      return this.i18n.t('words.lastActivity.never');
    }

    if (daysSinceReview <= 0) {
      return this.i18n.t('words.lastActivity.today');
    }

    if (daysSinceReview === 1) {
      return this.i18n.t('words.lastActivity.yesterday');
    }

    return this.i18n.t('words.lastActivity.daysAgo', { count: daysSinceReview });
  }

  getWordStatusLabel(word: Word): string {
    if (this.getTotalAttempts(word) === 0) {
      return this.i18n.t('words.status.new');
    }

    if (this.isDueForReview(word)) {
      return this.i18n.t('words.status.review');
    }

    if (this.isWeakWord(word)) {
      return this.i18n.t('words.status.weak');
    }

    if (this.isMasteredWord(word)) {
      return this.i18n.t('words.status.stable');
    }

    return this.i18n.t('words.status.inProgress');
  }

  getWordStatusClass(word: Word): string {
    if (this.getTotalAttempts(word) === 0) {
      return 'bg-slate-100 text-slate-700';
    }

    if (this.isDueForReview(word)) {
      return 'bg-amber-100 text-amber-700';
    }

    if (this.isWeakWord(word)) {
      return 'bg-red-100 text-red-700';
    }

    if (this.isMasteredWord(word)) {
      return 'bg-emerald-100 text-emerald-700';
    }

    return 'bg-blue-100 text-blue-700';
  }

  getWordProgressPercent(word: Word): number {
    const attempts = this.getTotalAttempts(word);
    if (attempts === 0) {
      return 0;
    }

    const accuracyScore = this.getTotalAccuracy(word);
    const easeScore = Math.max(0, Math.min(100, ((this.getAvgEaseFactor(word) - 1.3) / 1.4) * 100));
    const repetitionScore = Math.min(100, (attempts / 12) * 100);

    return Math.round(accuracyScore * 0.45 + easeScore * 0.35 + repetitionScore * 0.2);
  }

  getWordProgressBarClass(word: Word): string {
    if (this.isMasteredWord(word)) {
      return 'bg-emerald-500';
    }

    if (this.isDueForReview(word)) {
      return 'bg-amber-500';
    }

    if (this.isWeakWord(word)) {
      return 'bg-red-500';
    }

    if (this.getTotalAttempts(word) > 0) {
      return 'bg-blue-500';
    }

    return 'bg-slate-300';
  }

  private isDueForReview(word: Word): boolean {
    return this.getModes(word).some(
      (mode) => mode.repetitions > 0 && this.spacedRepetition.isDueForReview(mode),
    );
  }

  private isWeakWord(word: Word): boolean {
    return this.getModes(word).some(
      (mode) => mode.repetitions > 0 && (mode.easeFactor < 2.1 || mode.incorrectCount > mode.correctCount),
    );
  }

  private isMasteredWord(word: Word): boolean {
    return this.getTotalAttempts(word) > 0 && this.getAvgEaseFactor(word) >= 2.5 && this.getTotalAccuracy(word) >= 80;
  }

  private getModes(word: Word) {
    return [
      word.flipCardSourceToTarget,
      word.flipCardTargetToSource,
      word.quizSourceToTarget,
      word.quizTargetToSource,
    ];
  }

  // ================================
  // UI HELPERS
  // ================================

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

  getAccuracyColor(accuracy: number): string {
    if (accuracy >= 80) return 'text-green-600';
    if (accuracy >= 60) return 'text-yellow-600';
    return 'text-red-600';
  }

  // ================================
  // NAVIGACIJA / AKCIJE
  // ================================

  public navigateToAdd(): void {
    this.router.navigate(['/words/add']);
  }

  public navigateToEdit(id: string): void {
    this.router.navigate(['/words/edit', id]);
  }

  public getListName(listId: string): string {
    return this.vocabulary.getWordListById(listId)?.name || '';
  }

  public getCategoryLabel(category: WordCategory): string {
    return this.i18n.getCategoryLabel(category);
  }

  openMenuId = signal<string | null>(null);

  toggleMenu(id: string) {
    this.openMenuId.set(this.openMenuId() === id ? null : id);
  }

  closeMenu() {
    this.openMenuId.set(null);
  }

  deleteModalWordId = signal<string | null>(null);

  confirmDelete(id: string) {
    this.deleteModalWordId.set(id);
  }

  closeDeleteModal() {
    this.deleteModalWordId.set(null);
  }

  deleteWordConfirmed() {
    const id = this.deleteModalWordId();
    if (id !== null) {
      this.deleteWord(id);
      this.closeDeleteModal();
    }
  }

  public async deleteWord(id: string): Promise<void> {
    try {
      await this.storage.deleteWord(id);
      this.deleteModalWordId.set(null);
    } catch (error) {
      console.error('Error deleting word:', error);
      alert(this.i18n.t('words.deleteError'));
    }
  }

  private matchesLanguageFilters(languagePair: string): boolean {
    const [source = '', target = ''] = languagePair.split('-');
    const selectedSource = this.languagePairFilter.selectedSourceLanguage();
    const selectedTarget = this.languagePairFilter.selectedTargetLanguage();

    if (selectedSource && source !== selectedSource) return false;
    if (selectedTarget && target !== selectedTarget) return false;
    return true;
  }

  private async materializeSelectedList(listId: string): Promise<void> {
    this.materializingListId.set(listId);

    try {
      const ownedListId = await this.storage.ensureListOwnership(listId);
      this.selectedListId.set(ownedListId);
    } catch (error) {
      console.error('Error materializing default list:', error);
    } finally {
      this.materializingListId.set(null);
    }
  }
}
