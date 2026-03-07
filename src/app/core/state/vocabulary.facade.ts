import { computed, inject, Injectable, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { Word } from '@core/models/word.model';
import { WordList } from '@core/models/word-list.model';
import { StorageService } from '@core/services/abstractions/storage.service';

@Injectable({ providedIn: 'root' })
export class VocabularyFacade {
  private readonly storage = inject(StorageService);
  private readonly rawWords = toSignal(this.storage.getWords(), { initialValue: [] as Word[] });
  private readonly rawWordLists = toSignal(this.storage.getWordLists(), {
    initialValue: [] as WordList[],
  });

  public readonly words: Signal<Word[]> = computed(() => this.rawWords() ?? []);
  public readonly wordLists: Signal<WordList[]> = computed(() => this.rawWordLists() ?? []);

  public readonly sortedWordLists = computed(() =>
    this.wordLists()
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name)),
  );

  public readonly wordListMap = computed(
    () => new Map(this.wordLists().map((wordList) => [wordList.id, wordList])),
  );

  public readonly wordCountByListId = computed(() => {
    const counts = new Map<string, number>();

    for (const word of this.words()) {
      counts.set(word.listId, (counts.get(word.listId) ?? 0) + 1);
    }

    return counts;
  });

  public getWordListById(id: string | null | undefined): WordList | null {
    if (!id) {
      return null;
    }

    return this.wordListMap().get(id) ?? null;
  }

  public getWordCountForList(listId: string): number {
    return this.wordCountByListId().get(listId) ?? 0;
  }
}
