import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';

import { ImportService } from '@core/services/abstractions/import.service';
import { StorageService } from '@core/services/abstractions/storage.service';
import { LanguagePair, SUPPORTED_LANGUAGES } from '@core/models/language.model';
import { VocabularyFacade } from '@core/state/vocabulary.facade';
import { I18nService } from '@core/services/i18n.service';
import { buildImportPrompt } from './import.prompt.constant';

@Injectable()
export class ImportFacade {
  private readonly storage = inject(StorageService);
  private readonly importService = inject(ImportService);
  private readonly router = inject(Router);
  private readonly vocabulary = inject(VocabularyFacade);
  private readonly i18n = inject(I18nService);

  public readonly importMode = signal<'paste' | 'file'>('paste');
  public readonly listMode = signal<'existing' | 'new'>('new');
  public readonly selectedFile = signal<File | null>(null);
  public readonly pastedJson = signal('');
  public readonly selectedListId = signal<string | null>(null);
  public readonly topicDescription = signal('');
  public readonly isImporting = signal(false);
  public readonly errors = signal<string[]>([]);
  public readonly successCount = signal(0);
  public readonly promptCopied = signal(false);

  public readonly newListName = signal('');
  public readonly newListSourceLang = signal('');
  public readonly newListTargetLang = signal('');

  public readonly listOptions = computed(() =>
    this.vocabulary.sortedWordLists().map((list) => ({
      value: list.id,
      label: `${list.name}${list.isDefault ? ` • ${this.i18n.t('wordLists.defaultBadge')}` : ''} (${this.i18n.getLanguagePairDisplay(list.languagePair)})`,
    })),
  );

  public readonly languageOptions = computed(() =>
    SUPPORTED_LANGUAGES.map((lang) => ({
      value: lang.code,
      label: this.i18n.getLanguageDisplay(lang.code),
    })),
  );

  public readonly importModeOptions = computed(() => [
    { value: 'paste', label: this.i18n.t('import.mode.paste'), icon: '📋' },
    { value: 'file', label: this.i18n.t('import.mode.file'), icon: '📁' },
  ]);

  public readonly listModeOptions = computed(() => [
    { value: 'new', label: this.i18n.t('import.list.new'), icon: '➕' },
    { value: 'existing', label: this.i18n.t('import.list.existing'), icon: '📚' },
  ]);

  public readonly selectedList = computed(
    () => this.vocabulary.getWordListById(this.selectedListId()) ?? null,
  );

  public readonly hasValidListSelection = computed(() =>
    this.listMode() === 'existing'
      ? !!this.selectedListId()
      : this.newListName().trim().length > 0 &&
        !!this.newListSourceLang() &&
        !!this.newListTargetLang() &&
        this.newListSourceLang() !== this.newListTargetLang(),
  );

  public readonly canImport = computed(() => {
    const hasFile = this.importMode() === 'file' && this.selectedFile();
    const hasPaste = this.importMode() === 'paste' && this.pastedJson().trim().length > 0;

    return (hasFile || hasPaste) && this.hasValidListSelection() && !this.isImporting();
  });

  public readonly showPrompt = computed(
    () =>
      this.hasValidListSelection() &&
      this.topicDescription().trim().length > 0 &&
      this.importMode() === 'paste',
  );

  public readonly languageLabels = computed(() => {
    if (this.listMode() === 'new') {
      return this.getLanguageLabels(this.newListSourceLang(), this.newListTargetLang());
    }

    const existingList = this.selectedList();
    if (!existingList) {
      return { source: '?', target: '?' };
    }

    const [sourceCode, targetCode] = existingList.languagePair.split('-');
    return this.getLanguageLabels(sourceCode, targetCode);
  });

  public readonly aiFullPrompt = computed(() => {
    const { source, target } = this.languageLabels();
    return buildImportPrompt(this.i18n, source, target, this.topicDescription().trim());
  });

  public handleImportModeChange(mode: string): void {
    this.importMode.set(mode as 'paste' | 'file');
    this.clearFeedback();
  }

  public handleListModeChange(mode: string): void {
    this.listMode.set(mode as 'existing' | 'new');
    this.clearFeedback();
  }

  public handleFileSelected(file: File): void {
    this.selectedFile.set(file);
    this.pastedJson.set('');
    this.clearFeedback();
  }

  public async handleImport(): Promise<void> {
    this.isImporting.set(true);
    this.errors.set([]);
    this.successCount.set(0);

    try {
      const { listId, languagePair } = await this.resolveListContext();
      const source =
        this.importMode() === 'file' && this.selectedFile() ? this.selectedFile()! : this.pastedJson();

      const data = await this.importService.parseJson(source);
      const dtos = this.importService.convertToCreateDtos(data, listId, languagePair);

      await this.storage.batchCreateWords(dtos);

      this.successCount.set(dtos.length);
      setTimeout(() => {
        void this.router.navigate(['/words'], { queryParams: { listId } });
      }, 1500);
    } catch (error) {
      const message = error instanceof Error ? error.message : this.i18n.t('import.unknownError');
      this.errors.set(message.split('\n'));
    } finally {
      this.isImporting.set(false);
    }
  }

  public async copyFullPrompt(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.aiFullPrompt());
      this.promptCopied.set(true);
      setTimeout(() => this.promptCopied.set(false), 2000);
    } catch {
      this.errors.set([this.i18n.t('import.copyFailed')]);
    }
  }

  public async cancel(): Promise<void> {
    await this.router.navigate(['/']);
  }

  private async resolveListContext(): Promise<{ listId: string; languagePair: LanguagePair }> {
    if (this.listMode() === 'new') {
      const languagePair = `${this.newListSourceLang()}-${this.newListTargetLang()}` as LanguagePair;
      const listId = await this.storage.createWordList({
        name: this.newListName().trim(),
        languagePair,
      });

      return { listId, languagePair };
    }

    const listId = this.selectedListId();
    const selectedList = this.selectedList();
    const languagePair = selectedList?.languagePair;

    if (!listId) {
      throw new Error(this.i18n.t('import.listNotFound'));
    }

    if (!languagePair) {
      throw new Error(this.i18n.t('import.languagePairNotFound'));
    }

    const effectiveListId = selectedList?.isReadOnlyDefault
      ? await this.storage.ensureListOwnership(listId)
      : listId;

    return { listId: effectiveListId, languagePair };
  }

  private getLanguageLabels(sourceCode: string, targetCode: string): { source: string; target: string } {
    const sourceLanguage = SUPPORTED_LANGUAGES.find((lang) => lang.code === sourceCode);
    const targetLanguage = SUPPORTED_LANGUAGES.find((lang) => lang.code === targetCode);

    return {
      source: sourceLanguage ? this.i18n.getLanguageDisplay(sourceLanguage.code) : sourceCode,
      target: targetLanguage ? this.i18n.getLanguageDisplay(targetLanguage.code) : targetCode,
    };
  }

  private clearFeedback(): void {
    this.errors.set([]);
    this.successCount.set(0);
    this.promptCopied.set(false);
  }
}
