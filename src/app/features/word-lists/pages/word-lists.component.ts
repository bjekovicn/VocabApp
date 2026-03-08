import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { StorageService } from '@core/services/abstractions/storage.service';
import { LanguagePairFilterService } from '@core/services/language-pair-filter.service';
import { VocabularyFacade } from '@core/state/vocabulary.facade';
import { I18nService } from '@core/services/i18n.service';
import { CustomCardComponent } from '@shared/card/custom-card';
import { CustomButtonComponent } from '@shared/button/custom-button';
import { CustomSelectComponent } from '@shared/select/custom-select';
import { SelectOption } from '@shared/select/custom-select.types';

type ListSortOption =
  | 'name-asc'
  | 'name-desc'
  | 'least-used'
  | 'most-used'
  | 'least-mastered'
  | 'most-mastered';

interface WordListProgressViewModel {
  id: string;
  name: string;
  languagePair: string;
  isDefault: boolean;
  isReadOnlyDefault: boolean;
  wordCount: number;
  languagePairDisplay: string;
  studiedWordCount: number;
  masteredWordCount: number;
  coveragePercent: number;
  masteryPercent: number;
  lastActivityDays: number | null;
  lastActivityLabel: string;
  statusLabel: string;
  statusClass: string;
  progressBarClass: string;
}

@Component({
  selector: 'app-word-lists-page',
  standalone: true,
  imports: [CommonModule, CustomCardComponent, CustomButtonComponent, CustomSelectComponent],
  templateUrl: './word-lists.component.html',
})
export class WordListsPage {
  private readonly storage = inject(StorageService);
  private readonly languagePairFilter = inject(LanguagePairFilterService);
  private readonly vocabulary = inject(VocabularyFacade);
  private readonly router = inject(Router);
  public readonly i18n = inject(I18nService);

  public readonly selectedSort = signal<ListSortOption>('name-asc');
  public readonly sortOptions = computed<SelectOption[]>(() => [
    { value: 'name-asc', label: this.i18n.t('wordLists.sort.nameAsc') },
    { value: 'name-desc', label: this.i18n.t('wordLists.sort.nameDesc') },
    { value: 'least-used', label: this.i18n.t('wordLists.sort.leastUsed') },
    { value: 'most-used', label: this.i18n.t('wordLists.sort.mostUsed') },
    { value: 'least-mastered', label: this.i18n.t('wordLists.sort.leastMastered') },
    { value: 'most-mastered', label: this.i18n.t('wordLists.sort.mostMastered') },
  ]);
  public readonly openMenuId = signal<string | null>(null);
  public readonly deleteModalListId = signal<string | null>(null);
  private readonly listViewModels = computed<WordListProgressViewModel[]>(() =>
    this.vocabulary
      .sortedWordLists()
      .filter((list) => this.matchesLanguageFilters(list.languagePair))
      .map((list) => {
      const insight = this.vocabulary.getWordListInsight(list.id);

      return {
        id: list.id,
        name: list.name,
        languagePair: list.languagePair,
        isDefault: list.isDefault ?? false,
        isReadOnlyDefault: list.isReadOnlyDefault ?? false,
        wordCount: insight.wordCount,
        languagePairDisplay: this.i18n.getLanguagePairDisplay(list.languagePair),
        studiedWordCount: insight.studiedWordCount,
        masteredWordCount: insight.masteredWordCount,
        coveragePercent: insight.coveragePercent,
        masteryPercent: insight.masteryPercent,
        lastActivityDays: insight.lastActivityDays,
        lastActivityLabel: this.getLastActivityLabel(insight.lastActivityDays),
        statusLabel: this.getStatusLabel(
          insight.wordCount,
          insight.studiedWordCount,
          insight.masteryPercent,
          insight.lastActivityDays,
        ),
        statusClass: this.getStatusClass(
          insight.wordCount,
          insight.studiedWordCount,
          insight.masteryPercent,
          insight.lastActivityDays,
        ),
        progressBarClass: this.getProgressBarClass(insight.coveragePercent, insight.masteryPercent),
      };
    }),
  );
  public readonly lists = computed<WordListProgressViewModel[]>(() => {
    const sort = this.selectedSort();
    const lists = this.listViewModels().slice();

    switch (sort) {
      case 'name-desc':
        return lists.sort((a, b) => b.name.localeCompare(a.name));
      case 'least-used':
        return lists.sort((a, b) => this.compareLeastUsed(a, b));
      case 'most-used':
        return lists.sort((a, b) => this.compareMostUsed(a, b));
      case 'least-mastered':
        return lists.sort((a, b) => this.compareLeastMastered(a, b));
      case 'most-mastered':
        return lists.sort((a, b) => this.compareMostMastered(a, b));
      case 'name-asc':
      default:
        return lists.sort((a, b) => a.name.localeCompare(b.name));
    }
  });

  // ================================
  // NAVIGACIJA
  // ================================

  public navigateToCreate(): void {
    this.router.navigate(['/word-lists/create']);
  }

  public async navigateToEdit(id: string): Promise<void> {
    const listId = await this.storage.ensureListOwnership(id);
    await this.router.navigate(['/word-lists/edit', listId]);
  }

  public async navigateToWords(listId: string): Promise<void> {
    const ownedListId = await this.storage.ensureListOwnership(listId);
    await this.router.navigate(['/words'], { queryParams: { listId: ownedListId } });
  }

  // ================================
  // THREE DOTS MENU
  // ================================

  public toggleMenu(id: string, event: Event): void {
    event.stopPropagation();
    this.openMenuId.set(this.openMenuId() === id ? null : id);
  }

  public closeMenu(): void {
    this.openMenuId.set(null);
  }

  // ================================
  // DELETE DIALOG
  // ================================

  public confirmDelete(id: string): void {
    this.deleteModalListId.set(id);
  }

  public closeDeleteModal(): void {
    this.deleteModalListId.set(null);
  }

  public async deleteListConfirmed(): Promise<void> {
    const id = this.deleteModalListId();
    if (!id) return;

    try {
      await this.storage.deleteWordListWithWords(id);
      this.closeDeleteModal();
    } catch (error) {
      console.error('Error deleting list:', error);
      alert(this.i18n.t('wordLists.deleteError'));
    }
  }

  // ================================
  // HELPERS
  // ================================

  private getLastActivityLabel(lastActivityDays: number | null): string {
    if (lastActivityDays === null) {
      return this.i18n.t('wordLists.lastActivity.never');
    }

    if (lastActivityDays <= 0) {
      return this.i18n.t('wordLists.lastActivity.today');
    }

    if (lastActivityDays === 1) {
      return this.i18n.t('wordLists.lastActivity.yesterday');
    }

    return this.i18n.t('wordLists.lastActivity.daysAgo', { count: lastActivityDays });
  }

  private getStatusLabel(
    wordCount: number,
    studiedWordCount: number,
    masteryPercent: number,
    lastActivityDays: number | null,
  ): string {
    if (wordCount === 0) {
      return this.i18n.t('wordLists.status.empty');
    }

    if (studiedWordCount === 0) {
      return this.i18n.t('wordLists.status.notStarted');
    }

    if (masteryPercent >= 80) {
      return this.i18n.t('wordLists.status.mastered');
    }

    if (lastActivityDays !== null && lastActivityDays <= 3) {
      return this.i18n.t('wordLists.status.active');
    }

    if (studiedWordCount === wordCount) {
      return this.i18n.t('wordLists.status.reviewed');
    }

    return this.i18n.t('wordLists.status.inProgress');
  }

  private getStatusClass(
    wordCount: number,
    studiedWordCount: number,
    masteryPercent: number,
    lastActivityDays: number | null,
  ): string {
    if (wordCount === 0) {
      return 'bg-gray-100 text-gray-700';
    }

    if (studiedWordCount === 0) {
      return 'bg-amber-100 text-amber-700';
    }

    if (masteryPercent >= 80) {
      return 'bg-green-100 text-green-700';
    }

    if (lastActivityDays !== null && lastActivityDays <= 3) {
      return 'bg-blue-100 text-blue-700';
    }

    return 'bg-violet-100 text-violet-700';
  }

  private getProgressBarClass(coveragePercent: number, masteryPercent: number): string {
    if (masteryPercent >= 80) {
      return 'bg-green-500';
    }

    if (coveragePercent >= 50) {
      return 'bg-blue-500';
    }

    if (coveragePercent > 0) {
      return 'bg-amber-500';
    }

    return 'bg-gray-300';
  }

  private compareLeastUsed(a: WordListProgressViewModel, b: WordListProgressViewModel): number {
    if (a.coveragePercent !== b.coveragePercent) {
      return a.coveragePercent - b.coveragePercent;
    }

    const aDays = a.lastActivityDays ?? Number.MAX_SAFE_INTEGER;
    const bDays = b.lastActivityDays ?? Number.MAX_SAFE_INTEGER;

    if (aDays !== bDays) {
      return bDays - aDays;
    }

    return a.name.localeCompare(b.name);
  }

  private compareMostUsed(a: WordListProgressViewModel, b: WordListProgressViewModel): number {
    if (a.coveragePercent !== b.coveragePercent) {
      return b.coveragePercent - a.coveragePercent;
    }

    const aDays = a.lastActivityDays ?? Number.MAX_SAFE_INTEGER;
    const bDays = b.lastActivityDays ?? Number.MAX_SAFE_INTEGER;

    if (aDays !== bDays) {
      return aDays - bDays;
    }

    return a.name.localeCompare(b.name);
  }

  private compareMostMastered(a: WordListProgressViewModel, b: WordListProgressViewModel): number {
    if (a.masteryPercent !== b.masteryPercent) {
      return b.masteryPercent - a.masteryPercent;
    }

    if (a.masteredWordCount !== b.masteredWordCount) {
      return b.masteredWordCount - a.masteredWordCount;
    }

    return a.name.localeCompare(b.name);
  }

  private compareLeastMastered(a: WordListProgressViewModel, b: WordListProgressViewModel): number {
    if (a.masteryPercent !== b.masteryPercent) {
      return a.masteryPercent - b.masteryPercent;
    }

    if (a.masteredWordCount !== b.masteredWordCount) {
      return a.masteredWordCount - b.masteredWordCount;
    }

    return a.name.localeCompare(b.name);
  }

  private matchesLanguageFilters(languagePair: string): boolean {
    const [source = '', target = ''] = languagePair.split('-');
    const selectedSource = this.languagePairFilter.selectedSourceLanguage();
    const selectedTarget = this.languagePairFilter.selectedTargetLanguage();

    if (selectedSource && source !== selectedSource) return false;
    if (selectedTarget && target !== selectedTarget) return false;
    return true;
  }
}
