import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

import { StorageService } from '@core/services/abstractions/storage.service';
import { WORD_CATEGORIES, WordCategory } from '@core/models/word-category.model';
import { SUPPORTED_LANGUAGES } from '@core/models/language.model';
import { CreateWordDto } from '@core/models/word.model';

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
  private storage = inject(StorageService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // ===== ROUTE =====
  private wordId = toSignal(this.route.paramMap.pipe(map((p) => p.get('id'))), {
    initialValue: null,
  });

  private wordLists = toSignal(this.storage.getWordLists(), { initialValue: [] });

  // ===== STATE =====
  sourceText = signal('');
  targetText = signal('');
  category = signal<WordCategory | null>(null);
  listId = signal('');
  public readonly note = signal('');

  quiz = signal({
    sourceToTarget: ['', ''],
    targetToSource: ['', ''],
  });

  isSaving = signal(false);

  // ===== COMPUTED =====
  isEditMode = computed(() => this.wordId() !== null);

  pageTitle = computed(() => (this.isEditMode() ? 'Izmeni reč' : 'Dodaj novu reč'));

  categoryOptions = signal<SelectOption[]>(
    WORD_CATEGORIES.map((c) => ({ value: c.value, label: c.label })),
  );

  listOptions = computed(() =>
    this.wordLists()
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((list) => ({ value: list.id, label: list.name })),
  );

  selectedList = computed(() => this.wordLists().find((l) => l.id === this.listId()) ?? null);

  languageLabels = computed(() => {
    const list = this.selectedList();
    if (!list) return null;

    const [sourceCode, targetCode] = list.languagePair.split('-');
    const sourceLang = SUPPORTED_LANGUAGES.find((l) => l.code === sourceCode);
    const targetLang = SUPPORTED_LANGUAGES.find((l) => l.code === targetCode);

    return {
      source: sourceLang ? `${sourceLang.flag} ${sourceLang.name}` : sourceCode.toUpperCase(),
      target: targetLang ? `${targetLang.flag} ${targetLang.name}` : targetCode.toUpperCase(),
    };
  });

  isValid = computed(() => {
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
      const id = this.wordId();
      if (id) this.loadWord(id);
    });
  }

  // ===== LOAD WORD =====
  private loadWord(id: string) {
    this.storage.getWordById(id).subscribe((word) => {
      if (!word) return;

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
  updateQuiz(direction: 'sourceToTarget' | 'targetToSource', index: number, value: string) {
    this.quiz.update((q) => ({
      ...q,
      [direction]: q[direction].map((v, i) => (i === index ? value : v)),
    }));
  }

  // ===== SAVE =====
  async handleSubmit() {
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

  handleCancel() {
    this.router.navigate(['/words']);
  }

  setCategory(value: string | null) {
    this.category.set((value as WordCategory) ?? null);
  }

  setList(value: string | null) {
    this.listId.set(value ?? '');
  }
}
