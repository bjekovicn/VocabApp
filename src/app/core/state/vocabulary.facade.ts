import { computed, inject, Injectable, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { Word } from '@core/models/word.model';
import { WordList } from '@core/models/word-list.model';
import { StorageService } from '@core/services/abstractions/storage.service';

export interface WordListInsight {
  wordCount: number;
  studiedWordCount: number;
  masteredWordCount: number;
  coveragePercent: number;
  masteryPercent: number;
  lastActivityDays: number | null;
}

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

  public readonly wordListInsightsById = computed(() => {
    const wordsByListId = new Map<string, Word[]>();

    for (const word of this.words()) {
      const existingWords = wordsByListId.get(word.listId) ?? [];
      existingWords.push(word);
      wordsByListId.set(word.listId, existingWords);
    }

    const insights = new Map<string, WordListInsight>();

    for (const wordList of this.wordLists()) {
      const words = wordsByListId.get(wordList.id) ?? [];
      const wordCount = words.length;
      const studiedWordCount = words.filter((word) => this.getTotalAttempts(word) > 0).length;
      const masteredWordCount = words.filter((word) => this.isMastered(word)).length;
      const coveragePercent = wordCount > 0 ? Math.round((studiedWordCount / wordCount) * 100) : 0;
      const masteryPercent = wordCount > 0 ? Math.round((masteredWordCount / wordCount) * 100) : 0;

      insights.set(wordList.id, {
        wordCount,
        studiedWordCount,
        masteredWordCount,
        coveragePercent,
        masteryPercent,
        lastActivityDays: this.getLastActivityDays(words),
      });
    }

    return insights;
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

  public getWordListInsight(listId: string): WordListInsight {
    return (
      this.wordListInsightsById().get(listId) ?? {
        wordCount: 0,
        studiedWordCount: 0,
        masteredWordCount: 0,
        coveragePercent: 0,
        masteryPercent: 0,
        lastActivityDays: null,
      }
    );
  }

  private getTotalAttempts(word: Word): number {
    return (
      word.flipCardSourceToTarget.correctCount +
      word.flipCardSourceToTarget.incorrectCount +
      word.flipCardTargetToSource.correctCount +
      word.flipCardTargetToSource.incorrectCount +
      word.quizSourceToTarget.correctCount +
      word.quizSourceToTarget.incorrectCount +
      word.quizTargetToSource.correctCount +
      word.quizTargetToSource.incorrectCount
    );
  }

  private isMastered(word: Word): boolean {
    if (this.getTotalAttempts(word) === 0) {
      return false;
    }

    const averageEase =
      (word.flipCardSourceToTarget.easeFactor +
        word.flipCardTargetToSource.easeFactor +
        word.quizSourceToTarget.easeFactor +
        word.quizTargetToSource.easeFactor) /
      4;

    return averageEase >= 2.5;
  }

  private getLastActivityDays(words: Word[]): number | null {
    const reviewDates = words
      .flatMap((word) => [
        word.flipCardSourceToTarget.lastReview,
        word.flipCardTargetToSource.lastReview,
        word.quizSourceToTarget.lastReview,
        word.quizTargetToSource.lastReview,
      ])
      .filter((date): date is Date => date instanceof Date);

    if (reviewDates.length === 0) {
      return null;
    }

    const latestReviewTimestamp = Math.max(...reviewDates.map((date) => date.getTime()));
    return Math.floor((Date.now() - latestReviewTimestamp) / 86400000);
  }
}
