import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { StorageService } from '@core/services/abstractions/storage.service';
import { WORD_CATEGORIES, WordCategory } from '@core/models/word-category.model';
import { CustomCardComponent } from '@shared/card/custom-card';
import { CustomButtonComponent } from '@shared/button/custom-button';
import { CustomInputComponent } from '@shared/input/custom-input';
import { CustomSelectComponent } from '@shared/select/custom-select';
import { SelectOption } from '@shared/select/custom-select.types';

@Component({
  selector: 'app-add-word-page',
  standalone: true,
  imports: [
    CommonModule,
    CustomCardComponent,
    CustomButtonComponent,
    CustomInputComponent,
    CustomSelectComponent,
  ],
  templateUrl: './add-word.component.html',
})
export class AddWordComponent {
  private readonly storage = inject(StorageService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly wordId = toSignal(this.route.paramMap.pipe(map((params) => params.get('id'))), {
    initialValue: null,
  });

  private readonly wordLists = toSignal(this.storage.getWordLists(), { initialValue: [] });

  public readonly isEditMode = computed(() => this.wordId() !== null);
  public readonly pageTitle = computed(() => (this.isEditMode() ? 'Izmeni Reč' : 'Dodaj Novu Reč'));

  public readonly sourceText = signal('');
  public readonly targetText = signal('');
  public readonly category = signal<WordCategory | ''>('');
  public readonly listId = signal('');
  public readonly distractor1Source = signal('');
  public readonly distractor2Source = signal('');
  public readonly distractor1Target = signal('');
  public readonly distractor2Target = signal('');

  public readonly categoryOptions = signal<SelectOption[]>(
    WORD_CATEGORIES.map((cat) => ({
      value: cat.value,
      label: cat.label,
    })),
  );

  public readonly listOptions = computed(() =>
    this.wordLists().map((list) => ({
      value: list.id,
      label: `${list.name} (${list.languagePair})`,
    })),
  );

  public readonly isValid = computed(
    () =>
      this.sourceText().trim() !== '' &&
      this.targetText().trim() !== '' &&
      this.category() !== '' &&
      this.listId() !== '' &&
      this.distractor1Source().trim() !== '' &&
      this.distractor2Source().trim() !== '' &&
      this.distractor1Target().trim() !== '' &&
      this.distractor2Target().trim() !== '',
  );

  public readonly isSaving = signal(false);

  constructor() {
    effect(() => {
      const id = this.wordId();
      if (id) {
        this.loadWord(id);
      }
    });
  }

  private loadWord(id: string): void {
    this.storage.getWordById(id).subscribe((word) => {
      if (word) {
        this.sourceText.set(word.sourceText);
        this.targetText.set(word.targetText);
        this.category.set(word.category);
        this.listId.set(word.listId);
        this.distractor1Source.set(word.quizDistractorsTargetToSource[0] || '');
        this.distractor2Source.set(word.quizDistractorsTargetToSource[1] || '');
        this.distractor1Target.set(word.quizDistractorsSourceToTarget[0] || '');
        this.distractor2Target.set(word.quizDistractorsSourceToTarget[1] || '');
      }
    });
  }

  public async handleSubmit(): Promise<void> {
    if (!this.isValid() || this.isSaving()) return;

    this.isSaving.set(true);

    try {
      const selectedList = this.wordLists().find((l) => l.id === this.listId());
      if (!selectedList) {
        throw new Error('Lista nije pronađena');
      }

      const wordData = {
        sourceText: this.sourceText(),
        targetText: this.targetText(),
        category: this.category() as WordCategory,
        listId: this.listId(),
        languagePair: selectedList.languagePair,
        quizDistractorsSourceToTarget: [this.distractor1Target(), this.distractor2Target()],
        quizDistractorsTargetToSource: [this.distractor1Source(), this.distractor2Source()],
      };

      if (this.isEditMode()) {
        await this.storage.updateWord(this.wordId()!, wordData);
      } else {
        await this.storage.createWord(wordData);
      }

      this.router.navigate(['/words']);
    } catch (error) {
      console.error('Error saving word:', error);
      alert('Greška pri čuvanju reči');
    } finally {
      this.isSaving.set(false);
    }
  }

  public handleCancel(): void {
    this.router.navigate(['/words']);
  }
}
