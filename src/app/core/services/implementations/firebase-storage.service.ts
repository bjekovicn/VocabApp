import { Injectable } from '@angular/core';
import { initializeApp, FirebaseApp } from 'firebase/app';
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
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { getAuth, Auth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { Observable } from 'rxjs';
import { StorageService } from '@core/services/abstractions/storage.service';
import { Word, CreateWordDto } from '@core/models/word.model';
import { WordList, CreateWordListDto } from '@core/models/word-list.model';
import { createDefaultProgress } from '@core/models/spaced-repetition.model';

@Injectable({
  providedIn: 'root',
})
export class FirebaseStorageService extends StorageService {
  private readonly firestore: Firestore;
  private readonly auth: Auth;
  private currentUserId: string | null = null;

  constructor() {
    super();
    this.firestore = getFirestore();
    this.auth = getAuth();
    this.currentUserId = this.auth.currentUser?.uid || null;
  }

  public getCurrentUserId(): string | null {
    return this.currentUserId;
  }

  // Word Lists Methods
  public getWordLists(): Observable<WordList[]> {
    return new Observable((observer) => {
      if (!this.currentUserId) {
        observer.error('User not authenticated');
        return;
      }

      const listsRef = collection(this.firestore, `users/${this.currentUserId}/wordLists`);

      const unsubscribe = onSnapshot(
        listsRef,
        (snapshot) => {
          const lists: WordList[] = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data['name'],
              description: data['description'],
              languagePair: data['languagePair'],
              createdAt: data['createdAt']?.toDate() || new Date(),
              updatedAt: data['updatedAt']?.toDate() || new Date(),
            };
          });
          observer.next(lists);
        },
        (error) => observer.error(error),
      );

      return () => unsubscribe();
    });
  }

  public getWordListById(id: string): Observable<WordList | null> {
    return new Observable((observer) => {
      if (!this.currentUserId) {
        observer.error('User not authenticated');
        return;
      }

      const listRef = doc(this.firestore, `users/${this.currentUserId}/wordLists/${id}`);

      const unsubscribe = onSnapshot(
        listRef,
        (snapshot) => {
          if (!snapshot.exists()) {
            observer.next(null);
            return;
          }

          const data = snapshot.data();
          const list: WordList = {
            id: snapshot.id,
            name: data['name'],
            description: data['description'],
            languagePair: data['languagePair'],
            createdAt: data['createdAt']?.toDate() || new Date(),
            updatedAt: data['updatedAt']?.toDate() || new Date(),
          };
          observer.next(list);
        },
        (error) => observer.error(error),
      );

      return () => unsubscribe();
    });
  }

  public async createWordList(dto: CreateWordListDto): Promise<string> {
    if (!this.currentUserId) {
      throw new Error('User not authenticated');
    }

    const listsRef = collection(this.firestore, `users/${this.currentUserId}/wordLists`);
    const now = Timestamp.now();

    const docRef = await addDoc(listsRef, {
      name: dto.name,
      description: dto.description,
      languagePair: dto.languagePair,
      createdAt: now,
      updatedAt: now,
    });

    return docRef.id;
  }

  public async updateWordList(id: string, updates: Partial<WordList>): Promise<void> {
    if (!this.currentUserId) {
      throw new Error('User not authenticated');
    }

    const listRef = doc(this.firestore, `users/${this.currentUserId}/wordLists/${id}`);
    await updateDoc(listRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  }

  // Words Methods
  public getWords(): Observable<Word[]> {
    return new Observable((observer) => {
      if (!this.currentUserId) {
        observer.error('User not authenticated');
        return;
      }

      const wordsRef = collection(this.firestore, `users/${this.currentUserId}/words`);

      const unsubscribe = onSnapshot(
        wordsRef,
        (snapshot) => {
          const words: Word[] = snapshot.docs.map((doc) => this.mapDocToWord(doc.id, doc.data()));
          observer.next(words);
        },
        (error) => observer.error(error),
      );

      return () => unsubscribe();
    });
  }

  public getWordsByListId(listId: string): Observable<Word[]> {
    return new Observable((observer) => {
      if (!this.currentUserId) {
        observer.error('User not authenticated');
        return;
      }

      const wordsRef = collection(this.firestore, `users/${this.currentUserId}/words`);
      const q = query(wordsRef, where('listId', '==', listId));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const words: Word[] = snapshot.docs.map((doc) => this.mapDocToWord(doc.id, doc.data()));
          observer.next(words);
        },
        (error) => observer.error(error),
      );

      return () => unsubscribe();
    });
  }

  public getWordById(id: string): Observable<Word | null> {
    return new Observable((observer) => {
      if (!this.currentUserId) {
        observer.error('User not authenticated');
        return;
      }

      const wordRef = doc(this.firestore, `users/${this.currentUserId}/words/${id}`);

      const unsubscribe = onSnapshot(
        wordRef,
        (snapshot) => {
          if (!snapshot.exists()) {
            observer.next(null);
            return;
          }

          const word = this.mapDocToWord(snapshot.id, snapshot.data());
          observer.next(word);
        },
        (error) => observer.error(error),
      );

      return () => unsubscribe();
    });
  }

  public async createWord(dto: CreateWordDto): Promise<string> {
    if (!this.currentUserId) {
      throw new Error('User not authenticated');
    }

    const wordsRef = collection(this.firestore, `users/${this.currentUserId}/words`);
    const now = Timestamp.now();
    const defaultProgress = createDefaultProgress();

    const docRef = await addDoc(wordsRef, {
      sourceText: dto.sourceText,
      targetText: dto.targetText,
      category: dto.category,
      listId: dto.listId,
      languagePair: dto.languagePair,
      quizDistractorsSourceToTarget: dto.quizDistractorsSourceToTarget,
      quizDistractorsTargetToSource: dto.quizDistractorsTargetToSource,
      flipCardSourceToTarget: this.progressToFirestore(defaultProgress),
      flipCardTargetToSource: this.progressToFirestore(defaultProgress),
      quizSourceToTarget: this.progressToFirestore(defaultProgress),
      quizTargetToSource: this.progressToFirestore(defaultProgress),
      createdAt: now,
      updatedAt: now,
    });

    return docRef.id;
  }

  public async updateWord(id: string, updates: Partial<Word>): Promise<void> {
    if (!this.currentUserId) {
      throw new Error('User not authenticated');
    }

    const wordRef = doc(this.firestore, `users/${this.currentUserId}/words/${id}`);
    const updateData: any = { ...updates, updatedAt: Timestamp.now() };

    // Convert progress objects to Firestore format
    if (updates.flipCardSourceToTarget) {
      updateData.flipCardSourceToTarget = this.progressToFirestore(updates.flipCardSourceToTarget);
    }
    if (updates.flipCardTargetToSource) {
      updateData.flipCardTargetToSource = this.progressToFirestore(updates.flipCardTargetToSource);
    }
    if (updates.quizSourceToTarget) {
      updateData.quizSourceToTarget = this.progressToFirestore(updates.quizSourceToTarget);
    }
    if (updates.quizTargetToSource) {
      updateData.quizTargetToSource = this.progressToFirestore(updates.quizTargetToSource);
    }

    await updateDoc(wordRef, updateData);
  }

  public async deleteWord(id: string): Promise<void> {
    if (!this.currentUserId) {
      throw new Error('User not authenticated');
    }

    const wordRef = doc(this.firestore, `users/${this.currentUserId}/words/${id}`);
    await deleteDoc(wordRef);
  }

  // Helper Methods
  private mapDocToWord(id: string, data: any): Word {
    return {
      id,
      sourceText: data['sourceText'],
      targetText: data['targetText'],
      category: data['category'],
      listId: data['listId'],
      languagePair: data['languagePair'],
      quizDistractorsSourceToTarget: data['quizDistractorsSourceToTarget'] || [],
      quizDistractorsTargetToSource: data['quizDistractorsTargetToSource'] || [],
      flipCardSourceToTarget: this.firestoreToProgress(
        data['flipCardSourceToTarget'] || data['flipCard'],
      ),
      flipCardTargetToSource: this.firestoreToProgress(
        data['flipCardTargetToSource'] || data['flipCard'],
      ),
      quizSourceToTarget: this.firestoreToProgress(data['quizSourceToTarget']),
      quizTargetToSource: this.firestoreToProgress(data['quizTargetToSource']),
      createdAt: data['createdAt']?.toDate() || new Date(),
      updatedAt: data['updatedAt']?.toDate() || new Date(),
    };
  }

  private progressToFirestore(progress: any): any {
    return {
      repetitions: progress.repetitions,
      easeFactor: progress.easeFactor,
      nextReview: Timestamp.fromDate(new Date(progress.nextReview)),
      lastReview: progress.lastReview ? Timestamp.fromDate(new Date(progress.lastReview)) : null,
      correctCount: progress.correctCount,
      incorrectCount: progress.incorrectCount,
    };
  }

  private firestoreToProgress(data: any): any {
    return {
      repetitions: data?.repetitions || 0,
      easeFactor: data?.easeFactor || 2.5,
      nextReview: data?.nextReview?.toDate() || new Date(),
      lastReview: data?.lastReview?.toDate() || null,
      correctCount: data?.correctCount || 0,
      incorrectCount: data?.incorrectCount || 0,
    };
  }

  private async getWordsSnapshot(listId: string): Promise<Word[]> {
    if (!this.currentUserId) {
      throw new Error('User not authenticated');
    }

    const wordsRef = collection(this.firestore, `users/${this.currentUserId}/words`);
    const q = query(wordsRef, where('listId', '==', listId));

    return new Promise((resolve, reject) => {
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const words: Word[] = snapshot.docs.map((doc) => this.mapDocToWord(doc.id, doc.data()));
          unsubscribe();
          resolve(words);
        },
        (error) => reject(error),
      );
    });
  }

  public async batchUpdateWords(
    updates: Array<{ id: string; data: Partial<Word> }>,
  ): Promise<void> {
    if (!this.currentUserId) {
      throw new Error('User not authenticated');
    }

    if (updates.length === 0) return;

    // Firestore batch može max 500 operacija
    const BATCH_SIZE = 500;
    const batches: any[] = [];

    for (let i = 0; i < updates.length; i += BATCH_SIZE) {
      const batch = writeBatch(this.firestore);
      const chunk = updates.slice(i, i + BATCH_SIZE);

      chunk.forEach(({ id, data }) => {
        const wordRef = doc(this.firestore, `users/${this.currentUserId}/words/${id}`);
        const updateData: any = { ...data, updatedAt: Timestamp.now() };

        // Convert progress objects to Firestore format
        if (data.flipCardSourceToTarget) {
          updateData.flipCardSourceToTarget = this.progressToFirestore(data.flipCardSourceToTarget);
        }
        if (data.flipCardTargetToSource) {
          updateData.flipCardTargetToSource = this.progressToFirestore(data.flipCardTargetToSource);
        }
        if (data.quizSourceToTarget) {
          updateData.quizSourceToTarget = this.progressToFirestore(data.quizSourceToTarget);
        }
        if (data.quizTargetToSource) {
          updateData.quizTargetToSource = this.progressToFirestore(data.quizTargetToSource);
        }

        batch.update(wordRef, updateData);
      });

      batches.push(batch.commit());
    }

    await Promise.all(batches);
  }

  public async batchCreateWords(dtos: CreateWordDto[]): Promise<string[]> {
    if (!this.currentUserId) {
      throw new Error('User not authenticated');
    }

    if (dtos.length === 0) return [];

    const BATCH_SIZE = 500;
    const createdIds: string[] = [];

    for (let i = 0; i < dtos.length; i += BATCH_SIZE) {
      const batch = writeBatch(this.firestore);
      const chunk = dtos.slice(i, i + BATCH_SIZE);

      chunk.forEach((dto) => {
        const wordsRef = collection(this.firestore, `users/${this.currentUserId}/words`);
        const newDocRef = doc(wordsRef);
        const now = Timestamp.now();
        const defaultProgress = createDefaultProgress();

        batch.set(newDocRef, {
          sourceText: dto.sourceText,
          targetText: dto.targetText,
          category: dto.category,
          listId: dto.listId,
          languagePair: dto.languagePair,
          quizDistractorsSourceToTarget: dto.quizDistractorsSourceToTarget,
          quizDistractorsTargetToSource: dto.quizDistractorsTargetToSource,
          flipCardSourceToTarget: this.progressToFirestore(defaultProgress),
          flipCardTargetToSource: this.progressToFirestore(defaultProgress),
          quizSourceToTarget: this.progressToFirestore(defaultProgress),
          quizTargetToSource: this.progressToFirestore(defaultProgress),
          createdAt: now,
          updatedAt: now,
        });

        createdIds.push(newDocRef.id);
      });

      await batch.commit();
    }

    return createdIds;
  }

  public async deleteWordListWithWords(listId: string): Promise<void> {
    if (!this.currentUserId) {
      throw new Error('User not authenticated');
    }

    // Get all words for this list
    const words = await this.getWordsSnapshot(listId);

    // Create batch for deletion
    const BATCH_SIZE = 500;

    for (let i = 0; i < words.length; i += BATCH_SIZE) {
      const batch = writeBatch(this.firestore);
      const chunk = words.slice(i, i + BATCH_SIZE);

      chunk.forEach((word) => {
        const wordRef = doc(this.firestore, `users/${this.currentUserId}/words/${word.id}`);
        batch.delete(wordRef);
      });

      await batch.commit();
    }

    // Delete the list itself
    const listRef = doc(this.firestore, `users/${this.currentUserId}/wordLists/${listId}`);
    await deleteDoc(listRef);
  }
}
