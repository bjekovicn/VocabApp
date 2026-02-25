import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

import { StorageService } from '@core/services/abstractions/storage.service';
import { ImportService } from '@core/services/abstractions/import.service';
import { SUPPORTED_LANGUAGES } from '@core/models/language.model';
import { CustomCardComponent } from '@shared/card/custom-card';
import { CustomButtonComponent } from '@shared/button/custom-button';
import { CustomInputComponent } from '@shared/input/custom-input';

import { ImportModeSelectorComponent } from '../components/import-mode-selector/import-mode-selector.component';
import { ListModeSelectorComponent } from '../components/list-mode-selector/list-mode-selector.component';
import { ModeSwitchComponent } from '../components/mode-switch/mode-switch.component';
import { ExistingListSelectorComponent } from '../components/existing-list-selector/existing-list-selector.component';
import { NewListCreatorComponent } from '../components/new-list-creator/new-list-creator.component';
import { FileUploadComponent } from '../components/file-upload/file-upload.component';
import { AiPromptBoxComponent } from '../components/ai-prompt-box/ai-prompt-box.component';
import { buildImportPrompt } from './import.prompt.constant';

@Component({
  selector: 'app-import-page',
  standalone: true,
  imports: [
    CommonModule,
    CustomCardComponent,
    CustomButtonComponent,
    CustomInputComponent,
    ModeSwitchComponent,
    ExistingListSelectorComponent,
    NewListCreatorComponent,
    FileUploadComponent,
    AiPromptBoxComponent,
  ],
  templateUrl: './import.component.html',
})
export class ImportComponent {
  private readonly storage = inject(StorageService);
  private readonly importService = inject(ImportService);
  private readonly router = inject(Router);

  private readonly wordLists = toSignal(this.storage.getWordLists(), { initialValue: [] });

  public readonly importMode = signal<'paste' | 'file'>('paste');
  public readonly listMode = signal<'existing' | 'new'>('new');
  public readonly selectedFile = signal<File | null>(null);
  public readonly pastedJson = signal<string>('');
  public readonly selectedListId = signal<string | null>(null);
  public readonly topicDescription = signal<string>('');
  public readonly isImporting = signal(false);
  public readonly errors = signal<string[]>([]);
  public readonly successCount = signal(0);
  public readonly promptCopied = signal(false);

  // Novi signali za kreiranje liste
  public readonly newListName = signal<string>('');
  public readonly newListSourceLang = signal<string>('');
  public readonly newListTargetLang = signal<string>('');

  public readonly listOptions = computed(() =>
    this.wordLists().map((list) => ({
      value: list.id,
      label: `${list.name} (${list.languagePair})`,
    })),
  );

  public readonly languageOptions = computed(() =>
    SUPPORTED_LANGUAGES.map((lang) => ({
      value: lang.code,
      label: `${lang.flag} ${lang.name}`,
    })),
  );

  public readonly importModeOptions = computed(() => [
    { value: 'paste', label: 'Nalepi AI odgovor', icon: '📋' },
    { value: 'file', label: 'Upload Fajl', icon: '📁' },
  ]);

  public readonly listModeOptions = computed(() => [
    { value: 'new', label: 'Kreiraj novu', icon: '➕' },
    { value: 'existing', label: 'Izaberi postojeću', icon: '📚' },
  ]);
  public readonly canImport = computed(() => {
    const hasFile = this.importMode() === 'file' && this.selectedFile();
    const hasPaste = this.importMode() === 'paste' && this.pastedJson().trim().length > 0;

    const hasValidList =
      this.listMode() === 'existing'
        ? !!this.selectedListId()
        : this.newListName().trim().length > 0 &&
          !!this.newListSourceLang() &&
          !!this.newListTargetLang();

    return (hasFile || hasPaste) && hasValidList && !this.isImporting();
  });

  public readonly showPrompt = computed(() => {
    const hasValidList =
      this.listMode() === 'existing'
        ? !!this.selectedListId()
        : this.newListName().trim().length > 0 &&
          !!this.newListSourceLang() &&
          !!this.newListTargetLang();

    return (
      hasValidList && this.topicDescription().trim().length > 0 && this.importMode() === 'paste'
    );
  });

  private readonly selectedList = computed(
    () => this.wordLists().find((l) => l.id === this.selectedListId()) ?? null,
  );

  private readonly languageLabels = computed(() => {
    if (this.listMode() === 'new') {
      const sourceCode = this.newListSourceLang();
      const targetCode = this.newListTargetLang();
      const sourceLang = SUPPORTED_LANGUAGES.find((l) => l.code === sourceCode);
      const targetLang = SUPPORTED_LANGUAGES.find((l) => l.code === targetCode);

      return {
        source: sourceLang ? `${sourceLang.flag} ${sourceLang.name}` : sourceCode,
        target: targetLang ? `${targetLang.flag} ${targetLang.name}` : targetCode,
      };
    }

    const list = this.selectedList();
    if (!list) return { source: '?', target: '?' };

    const [sourceCode, targetCode] = list.languagePair.split('-');
    const sourceLang = SUPPORTED_LANGUAGES.find((l) => l.code === sourceCode);
    const targetLang = SUPPORTED_LANGUAGES.find((l) => l.code === targetCode);

    return {
      source: sourceLang ? `${sourceLang.flag} ${sourceLang.name}` : sourceCode,
      target: targetLang ? `${targetLang.flag} ${targetLang.name}` : targetCode,
    };
  });

  public handleImportModeChange(mode: string): void {
    this.importMode.set(mode as 'paste' | 'file');
  }

  public handleListModeChange(mode: string): void {
    this.listMode.set(mode as 'new' | 'existing');
  }

  public readonly aiFullPrompt = computed(() => {
    const { source, target } = this.languageLabels();
    const topic = this.topicDescription().trim();
    return buildImportPrompt(source, target, topic);
  });

  public handleFileSelected(file: File): void {
    this.selectedFile.set(file);
    this.pastedJson.set('');
    this.errors.set([]);
    this.successCount.set(0);
  }

  public async handleImport(): Promise<void> {
    this.isImporting.set(true);
    this.errors.set([]);
    this.successCount.set(0);

    try {
      let listId = this.selectedListId();

      // Kreiraj novu listu ako je potrebno
      if (this.listMode() === 'new') {
        const languagePair = `${this.newListSourceLang()}-${this.newListTargetLang()}`;
        listId = await this.storage.createWordList({
          name: this.newListName().trim(),
          languagePair: languagePair as any,
        });
      }

      if (!listId) {
        this.errors.set(['Lista nije pronađena']);
        return;
      }

      const source =
        this.importMode() === 'file' && this.selectedFile()
          ? this.selectedFile()!
          : this.pastedJson();

      const data = await this.importService.parseJson(source);

      const languagePair =
        this.listMode() === 'new'
          ? `${this.newListSourceLang()}-${this.newListTargetLang()}`
          : this.selectedList()?.languagePair;

      if (!languagePair) {
        this.errors.set(['Jezički par nije pronađen']);
        return;
      }

      const dtos = this.importService.convertToCreateDtos(data, listId, languagePair as any);
      await this.storage.batchCreateWords(dtos);

      this.successCount.set(dtos.length);
      setTimeout(() => this.router.navigate(['/words'], { queryParams: { listId } }), 1500);
    } catch (error: any) {
      const message: string = error?.message ?? 'Nepoznata greška';
      this.errors.set(message.split('\n'));
    } finally {
      this.isImporting.set(false);
    }
  }

  public copyFullPrompt(): void {
    navigator.clipboard.writeText(this.aiFullPrompt());
    this.promptCopied.set(true);
    setTimeout(() => this.promptCopied.set(false), 2000);
  }

  public handleCancel(): void {
    this.router.navigate(['/']);
  }
}
