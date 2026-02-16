import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { StorageService } from '@core/services/abstractions/storage.service';
import { SUPPORTED_LANGUAGES } from '@core/models/language.model';
import { CustomCardComponent } from '@shared/card/custom-card';
import { CustomButtonComponent } from '@shared/button/custom-button';

@Component({
  selector: 'app-list-manager-page',
  standalone: true,
  imports: [CommonModule, CustomCardComponent, CustomButtonComponent],
  templateUrl: './list-manager.component.html',
})
export class ListManagerPage {
  private readonly storage = inject(StorageService);
  private readonly router = inject(Router);

  private readonly wordLists = toSignal(this.storage.getWordLists(), { initialValue: [] });
  private readonly allWords = toSignal(this.storage.getWords(), { initialValue: [] });

  public readonly lists = computed(() => {
    const lists = this.wordLists();
    const words = this.allWords();

    return lists.map((list) => ({
      ...list,
      wordCount: words.filter((w) => w.listId === list.id).length,
      languagePairDisplay: this.getLanguagePairDisplay(list.languagePair),
    }));
  });

  public readonly deleteConfirmId = signal<string | null>(null);

  public navigateToCreate(): void {
    this.router.navigate(['/word-lists/create']);
  }

  public navigateToEdit(id: string): void {
    this.router.navigate(['/word-lists/edit', id]);
  }

  public navigateToWords(listId: string): void {
    this.router.navigate(['/words'], { queryParams: { listId } });
  }

  public confirmDelete(id: string): void {
    this.deleteConfirmId.set(id);
  }

  public cancelDelete(): void {
    this.deleteConfirmId.set(null);
  }

  public async deleteList(id: string): Promise<void> {
    try {
      await this.storage.deleteWordListWithWords(id);
      this.deleteConfirmId.set(null);
    } catch (error) {
      console.error('Error deleting list:', error);
      alert('Greška pri brisanju liste');
    }
  }

  private getLanguagePairDisplay(languagePair: string): string {
    const [source, target] = languagePair.split('-');
    const sourceLang = SUPPORTED_LANGUAGES.find((l) => l.code === source);
    const targetLang = SUPPORTED_LANGUAGES.find((l) => l.code === target);
    return `${sourceLang?.flag || ''} ${sourceLang?.name || source} → ${targetLang?.flag || ''} ${targetLang?.name || target}`;
  }
}
