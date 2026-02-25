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
      createdAt: data['createdAt']?.toDate() ?? new Date(),
      updatedAt: data['updatedAt']?.toDate() ?? new Date(),
    };
  },
};
