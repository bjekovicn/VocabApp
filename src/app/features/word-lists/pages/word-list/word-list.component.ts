import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, combineLatest } from 'rxjs';
import { StorageService } from '@core/services/abstractions/storage.service';
import { WordCategory, WORD_CATEGORIES } from '@core/models/word-category.model';
import { CustomCardComponent } from '@shared/card/custom-card';
import { CustomButtonComponent } from '@shared/button/custom-button';
import { CustomSelectComponent } from '@shared/select/custom-select';
import { SelectOption } from '@shared/select/custom-select.types';

@Component({
  selector: 'app-word-list-page',
  standalone: true,
  imports: [CommonModule, CustomCardComponent, CustomButtonComponent, CustomSelectComponent],
  templateUrl: './word-list.component.html',
})
export class WordListComponent {
  private readonly storage = inject(StorageService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly queryListId = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('listId'))),
    { initialValue: null },
  );

  private readonly allWords = toSignal(this.storage.getWords(), { initialValue: [] });
  private readonly wordLists = toSignal(this.storage.getWordLists(), { initialValue: [] });

  public readonly selectedListId = signal<string | null>(null);
  public readonly selectedCategory = signal<WordCategory | 'all'>('all');
  public readonly deleteConfirmId = signal<string | null>(null);

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

    return words;
  });

  constructor() {
    const queryId = this.queryListId();
    if (queryId) {
      this.selectedListId.set(queryId);
    }
  }

  public navigateToAdd(): void {
    this.router.navigate(['/words/add']);
  }

  public navigateToEdit(id: string): void {
    this.router.navigate(['/words/edit', id]);
  }

  public confirmDelete(id: string): void {
    this.deleteConfirmId.set(id);
  }

  public cancelDelete(): void {
    this.deleteConfirmId.set(null);
  }

  public async deleteWord(id: string): Promise<void> {
    try {
      await this.storage.deleteWord(id);
      this.deleteConfirmId.set(null);
    } catch (error) {
      console.error('Error deleting word:', error);
      alert('Greška pri brisanju reči');
    }
  }

  public getListName(listId: string): string {
    return this.wordLists().find((l) => l.id === listId)?.name || '';
  }

  public getCategoryLabel(category: WordCategory): string {
    return WORD_CATEGORIES.find((c) => c.value === category)?.label || '';
  }
}
