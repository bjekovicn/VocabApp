import {
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { DefaultWordListTemplate } from '@core/models/default-word-list.model';

export const defaultWordListConverter: FirestoreDataConverter<DefaultWordListTemplate> = {
  toFirestore(list: DefaultWordListTemplate): DocumentData {
    return {
      name: list.name,
      slug: list.slug,
      sourceLanguage: list.sourceLanguage,
      words: list.words.map((word) => ({
        id: word.id,
        sourceText: word.sourceText,
        category: word.category,
        note: word.note ?? null,
        translations: word.translations,
      })),
      createdAt: Timestamp.fromDate(list.createdAt),
      updatedAt: Timestamp.fromDate(list.updatedAt),
    };
  },

  fromFirestore(snapshot: QueryDocumentSnapshot): DefaultWordListTemplate {
    const data = snapshot.data();

    return {
      id: snapshot.id,
      name: data['name'],
      slug: data['slug'],
      sourceLanguage: data['sourceLanguage'],
      words: (data['words'] ?? []).map((word: any) => ({
        id: word.id,
        sourceText: word.sourceText,
        category: word.category,
        note: word.note ?? undefined,
        translations: word.translations ?? {},
      })),
      createdAt: data['createdAt']?.toDate() ?? new Date(),
      updatedAt: data['updatedAt']?.toDate() ?? new Date(),
    };
  },
};
