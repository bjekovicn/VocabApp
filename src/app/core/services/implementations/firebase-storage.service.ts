import { Injectable } from '@angular/core';
import {
  getFirestore,
  Firestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
  writeBatch,
  getDocs,
} from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { Observable } from 'rxjs';

import { StorageService } from '@core/services/abstractions/storage.service';
import { Word, CreateWordDto } from '@core/models/word.model';
import { WordList, CreateWordListDto } from '@core/models/word-list.model';
import { createDefaultProgress } from '@core/models/spaced-repetition.model';

import { collection$, doc$ } from '@core/utils/firestore.util';
import { wordConverter, progressToFirestore } from '@core/converters/word.converter';
import { wordListConverter } from '@core/converters/word-list.converter';

@Injectable({ providedIn: 'root' })
export class FirebaseStorageService extends StorageService {
  private readonly db: Firestore = getFirestore();
  private readonly auth: Auth = getAuth();

  // ─── Auth ────────────────────────────────────────────────────────────────────

  public getCurrentUserId(): string | null {
    return this.auth.currentUser?.uid ?? null;
  }

  private get uid(): string {
    const uid = this.auth.currentUser?.uid;
    if (!uid) throw new Error('User not authenticated');
    return uid;
  }

  // ─── Collection refs (with converters) ───────────────────────────────────────

  private wordsRef() {
    return collection(this.db, `users/${this.uid}/words`).withConverter(wordConverter);
  }

  private wordListsRef() {
    return collection(this.db, `users/${this.uid}/wordLists`).withConverter(wordListConverter);
  }

  private wordDocRef(id: string) {
    return doc(this.db, `users/${this.uid}/words/${id}`).withConverter(wordConverter);
  }

  private wordListDocRef(id: string) {
    return doc(this.db, `users/${this.uid}/wordLists/${id}`).withConverter(wordListConverter);
  }

  // ─── Word Lists ───────────────────────────────────────────────────────────────

  public getWordLists(): Observable<WordList[]> {
    return collection$<WordList>(this.wordListsRef());
  }

  public getWordListById(id: string): Observable<WordList | null> {
    return doc$<WordList>(this.wordListDocRef(id));
  }

  public async createWordList(dto: CreateWordListDto): Promise<string> {
    const now = Timestamp.now().toDate();
    const ref = await addDoc(this.wordListsRef(), {
      name: dto.name,
      languagePair: dto.languagePair,
      createdAt: now,
      updatedAt: now,
    } as any);
    return ref.id;
  }

  public async updateWordList(id: string, updates: Partial<WordList>): Promise<void> {
    await updateDoc(this.wordListDocRef(id), {
      ...updates,
      updatedAt: Timestamp.now().toDate(),
    } as any);
  }

  // ─── Words ────────────────────────────────────────────────────────────────────

  public getWords(): Observable<Word[]> {
    return collection$<Word>(this.wordsRef());
  }

  public getWordsByListId(listId: string): Observable<Word[]> {
    const q = query(this.wordsRef(), where('listId', '==', listId));
    return collection$<Word>(q);
  }

  public getWordById(id: string): Observable<Word | null> {
    return doc$<Word>(this.wordDocRef(id));
  }

  public async createWord(dto: CreateWordDto): Promise<string> {
    const now = new Date();
    const defaultProgress = createDefaultProgress();

    const ref = await addDoc(this.wordsRef(), {
      sourceText: dto.sourceText,
      targetText: dto.targetText,
      category: dto.category,
      listId: dto.listId,
      languagePair: dto.languagePair,
      note: dto.note ?? null,
      quizDistractorsSourceToTarget: dto.quizDistractorsSourceToTarget,
      quizDistractorsTargetToSource: dto.quizDistractorsTargetToSource,
      flipCardSourceToTarget: defaultProgress,
      flipCardTargetToSource: defaultProgress,
      quizSourceToTarget: defaultProgress,
      quizTargetToSource: defaultProgress,
      createdAt: now,
      updatedAt: now,
    } as any);
    return ref.id;
  }

  public async updateWord(id: string, updates: Partial<Word>): Promise<void> {
    // Progress polja moraju biti konvertovana u Firestore Timestamp format
    const firestoreUpdates: any = { updatedAt: Timestamp.now() };

    for (const [key, value] of Object.entries(updates)) {
      const progressKeys = [
        'flipCardSourceToTarget',
        'flipCardTargetToSource',
        'quizSourceToTarget',
        'quizTargetToSource',
      ];
      if (progressKeys.includes(key) && value) {
        firestoreUpdates[key] = progressToFirestore(value as any);
      } else {
        firestoreUpdates[key] = value;
      }
    }

    await updateDoc(this.wordDocRef(id), firestoreUpdates);
  }

  public async deleteWord(id: string): Promise<void> {
    await deleteDoc(this.wordDocRef(id));
  }

  // ─── Batch operacije ──────────────────────────────────────────────────────────

  public async batchUpdateWords(
    updates: Array<{ id: string; data: Partial<Word> }>,
  ): Promise<void> {
    if (updates.length === 0) return;

    const BATCH_SIZE = 500;

    for (let i = 0; i < updates.length; i += BATCH_SIZE) {
      const batch = writeBatch(this.db);
      const chunk = updates.slice(i, i + BATCH_SIZE);

      for (const { id, data } of chunk) {
        const firestoreData: any = { updatedAt: Timestamp.now() };
        const progressKeys = [
          'flipCardSourceToTarget',
          'flipCardTargetToSource',
          'quizSourceToTarget',
          'quizTargetToSource',
        ];

        for (const [key, value] of Object.entries(data)) {
          firestoreData[key] =
            progressKeys.includes(key) && value ? progressToFirestore(value as any) : value;
        }

        batch.update(doc(this.db, `users/${this.uid}/words/${id}`), firestoreData);
      }

      await batch.commit();
    }
  }

  public async batchCreateWords(dtos: CreateWordDto[]): Promise<string[]> {
    if (dtos.length === 0) return [];

    const BATCH_SIZE = 500;
    const createdIds: string[] = [];
    const now = Timestamp.now();
    const defaultProgress = createDefaultProgress();

    for (let i = 0; i < dtos.length; i += BATCH_SIZE) {
      const batch = writeBatch(this.db);
      const chunk = dtos.slice(i, i + BATCH_SIZE);

      for (const dto of chunk) {
        const newDocRef = doc(this.wordsRef());
        createdIds.push(newDocRef.id);

        batch.set(newDocRef, {
          sourceText: dto.sourceText,
          targetText: dto.targetText,
          category: dto.category,
          listId: dto.listId,
          languagePair: dto.languagePair,
          note: dto.note ?? null,
          quizDistractorsSourceToTarget: dto.quizDistractorsSourceToTarget,
          quizDistractorsTargetToSource: dto.quizDistractorsTargetToSource,
          flipCardSourceToTarget: defaultProgress,
          flipCardTargetToSource: defaultProgress,
          quizSourceToTarget: defaultProgress,
          quizTargetToSource: defaultProgress,
          createdAt: now.toDate(),
          updatedAt: now.toDate(),
        } as any);
      }

      await batch.commit();
    }

    return createdIds;
  }

  public async deleteWordListWithWords(listId: string): Promise<void> {
    const BATCH_SIZE = 500;

    // Dohvati sve wordsove za listu
    const q = query(collection(this.db, `users/${this.uid}/words`), where('listId', '==', listId));
    const snapshot = await getDocs(q);
    const wordDocs = snapshot.docs;

    // Briši wordove u batchevima
    for (let i = 0; i < wordDocs.length; i += BATCH_SIZE) {
      const batch = writeBatch(this.db);
      wordDocs.slice(i, i + BATCH_SIZE).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }

    // Briši listu
    await deleteDoc(this.wordListDocRef(listId));
  }
}
