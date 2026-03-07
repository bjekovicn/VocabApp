import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { of, switchMap } from 'rxjs';

import { StorageService } from '@core/services/abstractions/storage.service';
import { WORD_CATEGORIES, WordCategory } from '@core/models/word-category.model';
import { SUPPORTED_LANGUAGES } from '@core/models/language.model';
import { CreateWordDto } from '@core/models/word.model';
import { VocabularyFacade } from '@core/state/vocabulary.facade';

import { CustomCardComponent } from '@shared/card/custom-card';
import { CustomButtonComponent } from '@shared/button/custom-button';
import { CustomInputComponent } from '@shared/input/custom-input';
import { CustomSelectComponent } from '@shared/select/custom-select';
import { SelectOption } from '@shared/select/custom-select.types';
import { QuizDistractorsEditorComponent } from '../components/quiz-distractors-editor/quiz-distractors-editor.component';

@Component({
  selector: 'app-add-word-page',
  standalone: true,
  imports: [
    CommonModule,
    CustomCardComponent,
    CustomButtonComponent,
    CustomInputComponent,
    CustomSelectComponent,
    QuizDistractorsEditorComponent,
  ],
  templateUrl: './add-word.component.html',
})
export class AddWordComponent {
  private readonly storage = inject(StorageService);
  private readonly vocabulary = inject(VocabularyFacade);
  private readonly router = inject(Router);

  public readonly id = input<string | null>(null);
  private readonly currentWord = toSignal(
    toObservable(this.id).pipe(
      switchMap((wordId) => (wordId ? this.storage.getWordById(wordId) : of(null))),
    ),
    { initialValue: null },
  );

  // ===== STATE =====
  public readonly sourceText = signal('');
  public readonly targetText = signal('');
  public readonly category = signal<WordCategory | null>(null);
  public readonly listId = signal('');
  public readonly note = signal('');

  public readonly quiz = signal({
    sourceToTarget: ['', ''],
    targetToSource: ['', ''],
  });

  public readonly isSaving = signal(false);

  // ===== COMPUTED =====
  public readonly isEditMode = computed(() => this.id() !== null);

  public readonly pageTitle = computed(() => (this.isEditMode() ? 'Izmeni reč' : 'Dodaj novu reč'));

  public readonly categoryOptions = signal<SelectOption[]>(
    WORD_CATEGORIES.map((c) => ({ value: c.value, label: c.label })),
  );

  public readonly listOptions = computed(() =>
    this.vocabulary
      .sortedWordLists()
      .slice()
      .map((list) => ({ value: list.id, label: list.name })),
  );

  public readonly selectedList = computed(
    () => this.vocabulary.getWordListById(this.listId()) ?? null,
  );

  public readonly languageLabels = computed(() => {
    const list = this.selectedList();
    if (!list) return null;

    const [sourceCode, targetCode] = list.languagePair.split('-');
    const sourceLang = SUPPORTED_LANGUAGES.find((l) => l.code === sourceCode);
    const targetLang = SUPPORTED_LANGUAGES.find((l) => l.code === targetCode);

    return {
      source: sourceLang ? `${sourceLang.flag} ${sourceLang.name}` : sourceCode.toUpperCase(),
      target: targetLang ? `${targetLang.flag} ${targetLang.name}` : targetCode.toUpperCase(),
      sourceCode,
      targetCode,
    };
  });

  public readonly isValid = computed(() => {
    const q = this.quiz();
    return !!(
      this.sourceText().trim() &&
      this.targetText().trim() &&
      this.category() &&
      this.listId() &&
      q.sourceToTarget.every((v) => v.trim()) &&
      q.targetToSource.every((v) => v.trim())
    );
  });

  constructor() {
    effect(() => {
      const word = this.currentWord();
      if (!word) {
        return;
      }

      this.sourceText.set(word.sourceText);
      this.targetText.set(word.targetText);
      this.category.set(word.category);
      this.listId.set(word.listId);
      this.note.set(word.note ?? '');
      this.quiz.set({
        sourceToTarget: word.quizDistractorsSourceToTarget ?? ['', ''],
        targetToSource: word.quizDistractorsTargetToSource ?? ['', ''],
      });
    });
  }

  // ===== UPDATE QUIZ SIGNAL =====
  updateQuizSourceToTarget(data: { index: number; value: string }): void {
    this.quiz.update((q) => ({
      ...q,
      sourceToTarget: q.sourceToTarget.map((v, i) => (i === data.index ? data.value : v)),
    }));
  }

  updateQuizTargetToSource(data: { index: number; value: string }): void {
    this.quiz.update((q) => ({
      ...q,
      targetToSource: q.targetToSource.map((v, i) => (i === data.index ? data.value : v)),
    }));
  }

  // ===== SAVE =====
  public async handleSubmit(): Promise<void> {
    if (!this.isValid() || this.isSaving()) return;

    this.isSaving.set(true);

    try {
      const list = this.selectedList();
      if (!list || !this.category()) throw new Error('Lista ili kategorija nisu izabrani');

      const wordData: CreateWordDto = {
        sourceText: this.sourceText(),
        targetText: this.targetText(),
        category: this.category()!,
        listId: this.listId(),
        note: this.note(),
        languagePair: list.languagePair,
        quizDistractorsSourceToTarget: this.quiz().sourceToTarget,
        quizDistractorsTargetToSource: this.quiz().targetToSource,
      };

      if (this.isEditMode()) {
        await this.storage.updateWord(this.id()!, wordData);
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

  public setCategory(value: string | null): void {
    this.category.set((value as WordCategory) ?? null);
  }

  public setList(value: string | null): void {
    this.listId.set(value ?? '');
  }
}
