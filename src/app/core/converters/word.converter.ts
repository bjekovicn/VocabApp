import {
  FirestoreDataConverter,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { Word } from '@core/models/word.model';
import {
  SpacedRepetitionProgress,
  createDefaultProgress,
} from '@core/models/spaced-repetition.model';

function progressToFirestore(progress: SpacedRepetitionProgress): DocumentData {
  return {
    repetitions: progress.repetitions,
    easeFactor: progress.easeFactor,
    nextReview: Timestamp.fromDate(new Date(progress.nextReview)),
    lastReview: progress.lastReview ? Timestamp.fromDate(new Date(progress.lastReview)) : null,
    correctCount: progress.correctCount,
    incorrectCount: progress.incorrectCount,
  };
}

function progressFromFirestore(data: any): SpacedRepetitionProgress {
  if (!data) return createDefaultProgress();
  return {
    repetitions: data.repetitions ?? 0,
    easeFactor: data.easeFactor ?? 2.5,
    nextReview: data.nextReview?.toDate() ?? new Date(),
    lastReview: data.lastReview?.toDate() ?? null,
    correctCount: data.correctCount ?? 0,
    incorrectCount: data.incorrectCount ?? 0,
  };
}

export const wordConverter: FirestoreDataConverter<Word> = {
  toFirestore(word: Word): DocumentData {
    return {
      sourceText: word.sourceText,
      targetText: word.targetText,
      category: word.category,
      listId: word.listId,
      languagePair: word.languagePair,
      note: word.note ?? null,
      quizDistractorsSourceToTarget: word.quizDistractorsSourceToTarget,
      quizDistractorsTargetToSource: word.quizDistractorsTargetToSource,
      flipCardSourceToTarget: progressToFirestore(word.flipCardSourceToTarget),
      flipCardTargetToSource: progressToFirestore(word.flipCardTargetToSource),
      quizSourceToTarget: progressToFirestore(word.quizSourceToTarget),
      quizTargetToSource: progressToFirestore(word.quizTargetToSource),
      createdAt: Timestamp.fromDate(word.createdAt),
      updatedAt: Timestamp.fromDate(word.updatedAt),
    };
  },

  fromFirestore(snapshot: QueryDocumentSnapshot): Word {
    const d = snapshot.data();
    return {
      id: snapshot.id,
      sourceText: d['sourceText'],
      targetText: d['targetText'],
      category: d['category'],
      listId: d['listId'],
      languagePair: d['languagePair'],
      note: d['note'] ?? undefined,
      quizDistractorsSourceToTarget: d['quizDistractorsSourceToTarget'] ?? [],
      quizDistractorsTargetToSource: d['quizDistractorsTargetToSource'] ?? [],
      flipCardSourceToTarget: progressFromFirestore(d['flipCardSourceToTarget'] ?? d['flipCard']),
      flipCardTargetToSource: progressFromFirestore(d['flipCardTargetToSource'] ?? d['flipCard']),
      quizSourceToTarget: progressFromFirestore(d['quizSourceToTarget']),
      quizTargetToSource: progressFromFirestore(d['quizTargetToSource']),
      createdAt: d['createdAt']?.toDate() ?? new Date(),
      updatedAt: d['updatedAt']?.toDate() ?? new Date(),
    };
  },
};

export { progressToFirestore, progressFromFirestore };
