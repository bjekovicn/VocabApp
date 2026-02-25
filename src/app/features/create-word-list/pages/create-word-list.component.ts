import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { StorageService } from '@core/services/abstractions/storage.service';
import { SUPPORTED_LANGUAGES, LanguagePair } from '@core/models/language.model';
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
  private readonly route = inject(ActivatedRoute);

  private readonly listId = toSignal(this.route.paramMap.pipe(map((params) => params.get('id'))), {
    initialValue: null,
  });

  public readonly isEditMode = computed(() => this.listId() !== null);
  public readonly pageTitle = computed(() =>
    this.isEditMode() ? 'Izmeni Listu' : 'Kreiraj Novu Listu',
  );

  public readonly name = signal('');
  public readonly sourceLanguage = signal('');
  public readonly targetLanguage = signal('');

  public readonly languageOptions = signal<SelectOption[]>(
    SUPPORTED_LANGUAGES.map((lang) => ({
      value: lang.code,
      label: `${lang.flag} ${lang.name}`,
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
      const id = this.listId();
      if (id) {
        this.loadList(id);
      }
    });
  }

  private loadList(id: string): void {
    this.storage.getWordListById(id).subscribe((list) => {
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
        await this.storage.updateWordList(this.listId()!, {
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
      alert('Greška pri čuvanju liste');
    } finally {
      this.isSaving.set(false);
    }
  }

  public handleCancel(): void {
    this.router.navigate(['/word-lists']);
  }
}
