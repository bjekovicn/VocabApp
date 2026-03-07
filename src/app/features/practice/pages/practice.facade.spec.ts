import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { Word } from '@core/models/word.model';
import { createDefaultProgress } from '@core/models/spaced-repetition.model';
import { SpacedRepetitionService } from '@core/services/abstractions/spaced-repetition.service';
import { StorageService } from '@core/services/abstractions/storage.service';
import { VocabularyFacade } from '@core/state/vocabulary.facade';
import { PracticeFacade } from './practice.facade';

function createWord(overrides: Partial<Word>): Word {
  return {
    id: 'word-1',
    sourceText: 'Haus',
    targetText: 'Kuća',
    category: 'noun',
    listId: 'list-1',
    languagePair: 'de-sr',
    note: null as any,
    quizDistractorsSourceToTarget: ['Stan', 'Zgrada'],
    quizDistractorsTargetToSource: ['Baum', 'Auto'],
    flipCardSourceToTarget: createDefaultProgress(),
    flipCardTargetToSource: createDefaultProgress(),
    quizSourceToTarget: createDefaultProgress(),
    quizTargetToSource: createDefaultProgress(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('PracticeFacade', () => {
  const wordsSignal = signal<Word[]>([]);
  const listsSignal = signal([{ id: 'list-1', name: 'Osnovno', languagePair: 'de-sr', createdAt: new Date(), updatedAt: new Date() }]);

  const storageMock = {
    batchUpdateWords: vi.fn().mockResolvedValue(undefined),
  };

  const spacedRepetitionMock = {
    isDueForReview: vi.fn((progress) => new Date(progress.nextReview) <= new Date()),
    calculateNextReview: vi.fn((progress, correct) => ({
      ...progress,
      repetitions: progress.repetitions + 1,
      correctCount: progress.correctCount + (correct ? 1 : 0),
      incorrectCount: progress.incorrectCount + (correct ? 0 : 1),
    })),
  };

  beforeEach(() => {
    wordsSignal.set([]);
    storageMock.batchUpdateWords.mockClear();
    spacedRepetitionMock.isDueForReview.mockClear();
    spacedRepetitionMock.calculateNextReview.mockClear();

    TestBed.configureTestingModule({
      providers: [
        PracticeFacade,
        { provide: StorageService, useValue: storageMock },
        { provide: SpacedRepetitionService, useValue: spacedRepetitionMock },
        {
          provide: VocabularyFacade,
          useValue: {
            words: wordsSignal,
            wordLists: listsSignal,
            sortedWordLists: listsSignal,
            getWordListById: (id: string | null | undefined) =>
              listsSignal().find((list) => list.id === id) ?? null,
          },
        },
      ],
    });
  });

  it('computes weakest and forgotten filter counts from shared vocabulary signals', () => {
    wordsSignal.set([
      createWord({
        id: 'new-word',
      }),
      createWord({
        id: 'weak-word',
        flipCardSourceToTarget: {
          ...createDefaultProgress(),
          repetitions: 2,
          easeFactor: 1.9,
          incorrectCount: 3,
        },
      }),
      createWord({
        id: 'due-word',
        flipCardSourceToTarget: {
          ...createDefaultProgress(),
          repetitions: 1,
          nextReview: new Date(Date.now() - 60_000),
        },
      }),
    ]);

    const facade = TestBed.inject(PracticeFacade);

    expect(facade.filterCounts()).toEqual({
      all: 3,
      new: 1,
      forgotten: 2,
      weakest: 1,
    });
  });

  it('persists progress updates when practice finishes', async () => {
    const word = createWord({ id: 'word-finish' });
    const facade = TestBed.inject(PracticeFacade);

    await facade.finishPractice([{ word, correct: true }]);

    expect(storageMock.batchUpdateWords).toHaveBeenCalledWith([
      {
        id: 'word-finish',
        data: {
          flipCardSourceToTarget: expect.objectContaining({ repetitions: 1, correctCount: 1 }),
        },
      },
    ]);
    expect(facade.state()).toBe('results');
  });
});
