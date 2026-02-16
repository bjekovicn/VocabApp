import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

import { StorageService } from '@core/services/abstractions/storage.service';
import { ImportService } from '@core/services/abstractions/import.service';
import { CustomCardComponent } from '@shared/card/custom-card';
import { CustomButtonComponent } from '@shared/button/custom-button';
import { CustomSelectComponent } from '@shared/select/custom-select';

@Component({
  selector: 'app-import-page',
  standalone: true,
  imports: [CommonModule, CustomCardComponent, CustomButtonComponent, CustomSelectComponent],
  templateUrl: './import.component.html',
})
export class ImportComponent {
  private readonly storage = inject(StorageService);
  private readonly importService = inject(ImportService);
  private readonly router = inject(Router);

  private readonly wordLists = toSignal(this.storage.getWordLists(), {
    initialValue: [],
  });

  // UI STATE
  public readonly importMode = signal<'paste' | 'file'>('paste');
  public readonly selectedFile = signal<File | null>(null);
  public readonly pastedJson = signal<string>('');
  public readonly selectedListId = signal<string | null>(null);
  public readonly isImporting = signal(false);
  public readonly errors = signal<string[]>([]);
  public readonly successCount = signal(0);

  // LIST OPTIONS
  public readonly listOptions = computed(() =>
    this.wordLists().map((list) => ({
      value: list.id,
      label: `${list.name} (${list.languagePair})`,
    })),
  );

  // CAN IMPORT
  public readonly canImport = computed(() => {
    const hasFile = this.importMode() === 'file' && this.selectedFile();
    const hasPaste = this.importMode() === 'paste' && this.pastedJson().trim().length > 0;

    return (hasFile || hasPaste) && !!this.selectedListId() && !this.isImporting();
  });

  // AI FULL PROMPT (JSON + CATEGORY ENUM)
  public readonly aiFullPrompt = `Generiši JSON u sledećem formatu.

DOZVOLJENE category vrednosti (koristi ISKLJUČIVO jednu od ovih):
- "noun"
- "verb"
- "adjective"
- "adverb"
- "pronoun"
- "preposition"
- "conjunction"
- "other"

Pravila:
- category mora biti jedna od dozvoljenih vrednosti
- Uključi TAČNO 2 quizDistractorsSourceToTarget
- Uključi TAČNO 2 quizDistractorsTargetToSource
- Vrati ISKLJUČIVO validan JSON
- Ne dodaj objašnjenja, komentare, markdown, niti tekst van JSON-a

Format mora biti OVAKAV:

{
  "words": [
    {
      "sourceText": "teuer",
      "targetText": "skup",
      "category": "adjective",
      "quizDistractorsSourceToTarget": ["jeftin", "besplatan"],
      "quizDistractorsTargetToSource": ["billig", "kostenlos"]
    }
  ]
}

Jezik: nemački → srpski
Tema: ?`;

  // FILE SELECT
  public handleFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile.set(input.files[0]);
      this.pastedJson.set('');
      this.errors.set([]);
      this.successCount.set(0);
    }
  }

  public async handleImport(): Promise<void> {
    const listId = this.selectedListId();
    if (!listId) return;

    this.isImporting.set(true);
    this.errors.set([]);
    this.successCount.set(0);

    try {
      let data: any;

      if (this.importMode() === 'file' && this.selectedFile()) {
        data = await this.importService.parseJsonFile(this.selectedFile()!);
      } else if (this.importMode() === 'paste') {
        data = JSON.parse(this.pastedJson());
      } else {
        return;
      }

      const validationErrors = this.importService.validateImportData(data);

      if (validationErrors.length > 0) {
        this.errors.set(validationErrors);
        return;
      }

      const wordList = this.wordLists().find((l) => l.id === listId);

      if (!wordList) {
        this.errors.set(['Lista nije pronađena']);
        return;
      }

      const dtos = this.importService.convertToCreateDtos(data, listId, wordList.languagePair);

      await this.storage.batchCreateWords(dtos);

      this.successCount.set(dtos.length);

      setTimeout(() => {
        this.router.navigate(['/words'], {
          queryParams: { listId },
        });
      }, 1500);
    } catch (error) {
      console.error(error);
      this.errors.set(['Greška pri parsiranju JSON-a. Proveri format.']);
    } finally {
      this.isImporting.set(false);
    }
  }

  // COPY PROMPT
  public copyFullPrompt(): void {
    navigator.clipboard.writeText(this.aiFullPrompt);
  }

  public handleCancel(): void {
    this.router.navigate(['/']);
  }
}
