import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18nService } from '@core/services/i18n.service';
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
import { ImportFacade } from './import.facade';

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
  protected readonly facade = inject(ImportFacade);
  protected readonly i18n = inject(I18nService);

  protected readonly importMode = this.facade.importMode;
  protected readonly listMode = this.facade.listMode;
  protected readonly selectedFile = this.facade.selectedFile;
  protected readonly pastedJson = this.facade.pastedJson;
  protected readonly selectedListId = this.facade.selectedListId;
  protected readonly topicDescription = this.facade.topicDescription;
  protected readonly isImporting = this.facade.isImporting;
  protected readonly errors = this.facade.errors;
  protected readonly successCount = this.facade.successCount;
  protected readonly promptCopied = this.facade.promptCopied;
  protected readonly newListName = this.facade.newListName;
  protected readonly newListSourceLang = this.facade.newListSourceLang;
  protected readonly newListTargetLang = this.facade.newListTargetLang;
  protected readonly listOptions = this.facade.listOptions;
  protected readonly languageOptions = this.facade.languageOptions;
  protected readonly importModeOptions = this.facade.importModeOptions;
  protected readonly listModeOptions = this.facade.listModeOptions;
  protected readonly canImport = this.facade.canImport;
  protected readonly showPrompt = this.facade.showPrompt;
  protected readonly aiFullPrompt = this.facade.aiFullPrompt;

  public handleImportModeChange(mode: string): void {
    this.facade.handleImportModeChange(mode);
  }

  public handleListModeChange(mode: string): void {
    this.facade.handleListModeChange(mode);
  }

  public handleFileSelected(file: File): void {
    this.facade.handleFileSelected(file);
  }

  public async handleImport(): Promise<void> {
    await this.facade.handleImport();
  }

  public async copyFullPrompt(): Promise<void> {
    await this.facade.copyFullPrompt();
  }

  public async handleCancel(): Promise<void> {
    await this.facade.cancel();
  }
}
