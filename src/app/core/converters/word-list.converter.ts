import {
  FirestoreDataConverter,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { WordList } from '@core/models/word-list.model';

export const wordListConverter: FirestoreDataConverter<WordList> = {
  toFirestore(list: WordList): DocumentData {
    return {
      name: list.name,
      languagePair: list.languagePair,
      isDefault: list.isDefault ?? false,
      originDefaultListId: list.originDefaultListId ?? null,
      wordCount: list.wordCount ?? null,
      createdAt: Timestamp.fromDate(list.createdAt),
      updatedAt: Timestamp.fromDate(list.updatedAt),
    };
  },

  fromFirestore(snapshot: QueryDocumentSnapshot): WordList {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      name: data['name'],
      languagePair: data['languagePair'],
      isDefault: data['isDefault'] ?? false,
      originDefaultListId: data['originDefaultListId'] ?? undefined,
      wordCount: data['wordCount'] ?? undefined,
      createdAt: data['createdAt']?.toDate() ?? new Date(),
      updatedAt: data['updatedAt']?.toDate() ?? new Date(),
    };
  },
};
