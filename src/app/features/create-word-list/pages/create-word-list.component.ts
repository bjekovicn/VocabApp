import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { of, switchMap } from 'rxjs';
import { StorageService } from '@core/services/abstractions/storage.service';
import { SUPPORTED_LANGUAGES, LanguagePair } from '@core/models/language.model';
import { I18nService } from '@core/services/i18n.service';
import { CustomCardComponent } from '@shared/card/custom-card';
import { CustomButtonComponent } from '@shared/button/custom-button';
import { CustomInputComponent } from '@shared/input/custom-input';
import { CustomSelectComponent } from '@shared/select/custom-select';
import { SelectOption } from '@shared/select/custom-select.types';

@Component({
  selector: 'app-create-word-list-page',
  standalone: true,
  imports: [
    CommonModule,
    CustomCardComponent,
    CustomButtonComponent,
    CustomInputComponent,
    CustomSelectComponent,
  ],
  templateUrl: './create-word-list.component.html',
})
export class CreateWordListPage {
  private readonly storage = inject(StorageService);
  private readonly router = inject(Router);
  public readonly i18n = inject(I18nService);

  public readonly id = input<string | null>(null);
  private readonly currentList = toSignal(
    toObservable(this.id).pipe(
      switchMap((listId) => (listId ? this.storage.getWordListById(listId) : of(null))),
    ),
    { initialValue: null },
  );

  public readonly isEditMode = computed(() => this.id() !== null);
  public readonly pageTitle = computed(() =>
    this.isEditMode() ? this.i18n.t('listForm.editTitle') : this.i18n.t('listForm.createTitle'),
  );

  public readonly name = signal('');
  public readonly sourceLanguage = signal('');
  public readonly targetLanguage = signal('');

  public readonly languageOptions = computed<SelectOption[]>(() =>
    SUPPORTED_LANGUAGES.map((lang) => ({
      value: lang.code,
      label: this.i18n.getLanguageDisplay(lang.code),
    })),
  );

  public readonly isValid = computed(
    () =>
      this.name().trim() !== '' &&
      this.sourceLanguage() !== '' &&
      this.targetLanguage() !== '' &&
      this.sourceLanguage() !== this.targetLanguage(),
  );

  public readonly isSaving = signal(false);

  constructor() {
    effect(() => {
      const list = this.currentList();
      if (list) {
        this.name.set(list.name);
        const [source, target] = list.languagePair.split('-');
        this.sourceLanguage.set(source);
        this.targetLanguage.set(target);
      }
    });
  }

  public async handleSubmit(): Promise<void> {
    if (!this.isValid() || this.isSaving()) return;

    this.isSaving.set(true);

    try {
      const languagePair = `${this.sourceLanguage()}-${this.targetLanguage()}` as LanguagePair;

      if (this.isEditMode()) {
        await this.storage.updateWordList(this.id()!, {
          name: this.name(),
          languagePair,
        });
      } else {
        await this.storage.createWordList({
          name: this.name(),
          languagePair,
        });
      }

      this.router.navigate(['/word-lists']);
    } catch (error) {
      console.error('Error saving list:', error);
      alert(this.i18n.t('listForm.saveError'));
    } finally {
      this.isSaving.set(false);
    }
  }

  public handleCancel(): void {
    this.router.navigate(['/word-lists']);
  }
}
