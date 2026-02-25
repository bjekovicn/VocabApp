import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { StorageService } from '@core/services/abstractions/storage.service';
import { Word } from '@core/models/word.model';
import { WordCategory, WORD_CATEGORIES } from '@core/models/word-category.model';
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
  private readonly storage = inject(StorageService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly queryListId = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('listId'))),
    { initialValue: null },
  );

  private readonly allWords = toSignal(this.storage.getWords(), { initialValue: [] });
  private readonly wordLists = toSignal(this.storage.getWordLists(), { initialValue: [] });

  public readonly selectedListId = signal<string>('all');
  public readonly selectedCategory = signal<WordCategory | 'all'>('all');

  public readonly listOptions = computed(() => [
    { value: 'all', label: 'Sve liste' },
    ...this.wordLists().map((list) => ({
      value: list.id,
      label: list.name,
    })),
  ]);

  public readonly categoryOptions = signal<SelectOption[]>([
    { value: 'all', label: 'Sve kategorije' },
    ...WORD_CATEGORIES.map((cat) => ({
      value: cat.value,
      label: cat.label,
    })),
  ]);

  public readonly filteredWords = computed(() => {
    let words = this.allWords();
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
    // fix: constructor čita toSignal prije nego što route emituje vrijednost — treba effect()
    effect(() => {
      const queryId = this.queryListId();
      if (queryId) {
        this.selectedListId.set(queryId);
      }
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
    return this.wordLists().find((l) => l.id === listId)?.name || '';
  }

  public getCategoryLabel(category: WordCategory): string {
    return WORD_CATEGORIES.find((c) => c.value === category)?.label || '';
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
      alert('Greška pri brisanju reči');
    }
  }
}
