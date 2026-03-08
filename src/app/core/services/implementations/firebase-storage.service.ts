import { Injectable } from '@angular/core';
import {
  addDoc,
  Firestore,
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { Auth, getAuth } from 'firebase/auth';
import { Observable, combineLatest, map } from 'rxjs';

import { defaultWordListConverter } from '@core/converters/default-word-list.converter';
import { StorageService } from '@core/services/abstractions/storage.service';
import { Word, CreateWordDto } from '@core/models/word.model';
import { WordList, CreateWordListDto } from '@core/models/word-list.model';
import { createDefaultProgress } from '@core/models/spaced-repetition.model';
import {
  createDefaultCloneListId,
  createDefaultCloneWordId,
  createDefaultVirtualListId,
  DefaultWordListTemplate,
  parseDefaultVirtualListId,
} from '@core/models/default-word-list.model';
import { LanguagePair, SUPPORTED_LANGUAGES } from '@core/models/language.model';

import { collection$, doc$ } from '@core/utils/firestore.util';
import { wordConverter, progressToFirestore } from '@core/converters/word.converter';
import { wordListConverter } from '@core/converters/word-list.converter';

interface DefaultListOverride {
  virtualListId: string;
  hiddenAt: Date;
}

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

  private defaultWordListsRef() {
    return collection(this.db, 'defaultWordLists').withConverter(defaultWordListConverter);
  }

  private defaultWordListDocRef(id: string) {
    return doc(this.db, `defaultWordLists/${id}`).withConverter(defaultWordListConverter);
  }

  private defaultListOverridesRef() {
    return collection(this.db, `users/${this.uid}/defaultListOverrides`);
  }

  private defaultListOverrideDocRef(id: string) {
    return doc(this.db, `users/${this.uid}/defaultListOverrides/${id}`);
  }

  // ─── Word Lists ───────────────────────────────────────────────────────────────

  public getWordLists(): Observable<WordList[]> {
    return combineLatest([
      collection$<WordList>(this.wordListsRef()),
      collection$<DefaultWordListTemplate>(this.defaultWordListsRef()),
      collection$<DefaultListOverride>(this.defaultListOverridesRef()),
    ]).pipe(
      map(([userLists, defaultLists, overrides]) =>
        this.mergeDefaultListsIntoUserLists(userLists, defaultLists, overrides),
      ),
    );
  }

  public getWordListById(id: string): Observable<WordList | null> {
    return this.getWordLists().pipe(map((lists) => lists.find((list) => list.id === id) ?? null));
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

  public async ensureListOwnership(listId: string): Promise<string> {
    const parsed = parseDefaultVirtualListId(listId);
    if (!parsed) {
      return listId;
    }

    const templateSnapshot = await getDoc(this.defaultWordListDocRef(parsed.defaultListId));
    if (!templateSnapshot.exists()) {
      throw new Error(`Default list "${parsed.defaultListId}" not found.`);
    }

    const template = templateSnapshot.data();
    const cloneListId = createDefaultCloneListId(parsed.defaultListId, parsed.targetLanguage);
    const cloneListRef = this.wordListDocRef(cloneListId);
    const cloneSnapshot = await getDoc(cloneListRef);

    if (cloneSnapshot.exists()) {
      return cloneListId;
    }

    const now = Timestamp.now().toDate();
    const languagePair = `${template.sourceLanguage}-${parsed.targetLanguage}` as LanguagePair;
    const batch = writeBatch(this.db);

    batch.set(cloneListRef, {
      name: template.name,
      languagePair,
      isDefault: true,
      originDefaultListId: template.id,
      wordCount: template.words.length,
      createdAt: now,
      updatedAt: now,
    } as any);

    const cloneWords = this.buildCloneWords(template, parsed.targetLanguage, cloneListId, languagePair, now);

    for (const word of cloneWords) {
      batch.set(this.wordDocRef(word.id), word as any);
    }

    batch.delete(this.defaultListOverrideDocRef(listId));
    await batch.commit();

    return cloneListId;
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
    const parsedVirtualList = parseDefaultVirtualListId(listId);
    if (parsedVirtualList) {
      await this.hideDefaultList(listId, parsedVirtualList.defaultListId, parsedVirtualList.targetLanguage);
      return;
    }

    const listSnapshot = await getDoc(this.wordListDocRef(listId));
    const list = listSnapshot.data();

    if (list?.originDefaultListId) {
      const [, targetLanguage = ''] = list.languagePair.split('-');
      const virtualListId = createDefaultVirtualListId(list.originDefaultListId, targetLanguage);
      await this.hideDefaultList(virtualListId, list.originDefaultListId, targetLanguage);
    }

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

  public async migrateData(fromUid: string, toUid: string): Promise<void> {
    const sourceWordListsRef = collection(this.db, `users/${fromUid}/wordLists`).withConverter(
      wordListConverter,
    );
    const sourceWordsRef = collection(this.db, `users/${fromUid}/words`).withConverter(wordConverter);

    const sourceOverridesRef = collection(this.db, `users/${fromUid}/defaultListOverrides`);

    const [wordListsSnapshot, wordsSnapshot, overridesSnapshot] = await Promise.all([
      getDocs(sourceWordListsRef),
      getDocs(sourceWordsRef),
      getDocs(sourceOverridesRef),
    ]);

    let batch = writeBatch(this.db);
    let operationCount = 0;
    const BATCH_SIZE = 500;

    const commitBatch = async () => {
      if (operationCount > 0) {
        await batch.commit();
        batch = writeBatch(this.db);
        operationCount = 0;
      }
    };

    // Migrate WordLists
    for (const docSnapshot of wordListsSnapshot.docs) {
      const data = docSnapshot.data();
      const newDocRef = doc(
        this.db,
        `users/${toUid}/wordLists/${docSnapshot.id}`,
      ).withConverter(wordListConverter);
      batch.set(newDocRef, data);
      operationCount++;

      if (operationCount >= BATCH_SIZE) {
        await commitBatch();
      }
    }

    // Migrate Words
    for (const docSnapshot of wordsSnapshot.docs) {
      const data = docSnapshot.data();
      const newDocRef = doc(
        this.db,
        `users/${toUid}/words/${docSnapshot.id}`,
      ).withConverter(wordConverter);
      batch.set(newDocRef, data);
      operationCount++;

      if (operationCount >= BATCH_SIZE) {
        await commitBatch();
      }
    }

    // Migrate default list overrides
    for (const docSnapshot of overridesSnapshot.docs) {
      const data = docSnapshot.data();
      const newDocRef = doc(this.db, `users/${toUid}/defaultListOverrides/${docSnapshot.id}`);
      batch.set(newDocRef, data);
      operationCount++;

      if (operationCount >= BATCH_SIZE) {
        await commitBatch();
      }
    }

    await commitBatch();
  }

  private mergeDefaultListsIntoUserLists(
    userLists: WordList[],
    defaultLists: DefaultWordListTemplate[],
    overrides: DefaultListOverride[],
  ): WordList[] {
    const hiddenVirtualListIds = new Set(overrides.map((override) => override.virtualListId));
    const materializedKeys = new Set(
      userLists
        .filter((list) => list.originDefaultListId)
        .map((list) => `${list.originDefaultListId}:${list.languagePair}`),
    );

    const virtualLists = defaultLists.flatMap((defaultList) =>
      SUPPORTED_LANGUAGES.filter((language) => language.code !== defaultList.sourceLanguage)
        .filter((language) => this.hasCompleteTranslations(defaultList, language.code))
        .map((language) => {
          const languagePair = `${defaultList.sourceLanguage}-${language.code}` as LanguagePair;
          const virtualListId = createDefaultVirtualListId(defaultList.id, language.code);

          return {
            id: virtualListId,
            name: defaultList.name,
            languagePair,
            isDefault: true,
            isReadOnlyDefault: true,
            originDefaultListId: defaultList.id,
            wordCount: defaultList.words.length,
            createdAt: defaultList.createdAt,
            updatedAt: defaultList.updatedAt,
          } satisfies WordList;
        })
        .filter(
          (list) =>
            !hiddenVirtualListIds.has(list.id) &&
            !materializedKeys.has(`${list.originDefaultListId}:${list.languagePair}`),
        ),
    );

    return [...userLists, ...virtualLists];
  }

  private hasCompleteTranslations(defaultList: DefaultWordListTemplate, targetLanguage: string): boolean {
    return defaultList.words.every((word) => this.getTranslatedText(word.translations, targetLanguage) !== null);
  }

  private getTranslatedText(
    translations: Partial<Record<string, string>>,
    targetLanguage: string,
  ): string | null {
    const value = translations[targetLanguage]?.trim();
    return value ? value : null;
  }

  private buildCloneWords(
    template: DefaultWordListTemplate,
    targetLanguage: string,
    listId: string,
    languagePair: LanguagePair,
    now: Date,
  ): Word[] {
    const defaultProgress = createDefaultProgress();

    return template.words.map((templateWord) => {
      const targetText = this.getTranslatedText(templateWord.translations, targetLanguage);
      if (!targetText) {
        throw new Error(`Missing "${targetLanguage}" translation for default word "${templateWord.id}".`);
      }

      return {
        id: createDefaultCloneWordId(template.id, targetLanguage, templateWord.id),
        sourceText: templateWord.sourceText,
        targetText,
        category: templateWord.category,
        listId,
        languagePair,
        note: templateWord.note,
        originDefaultWordId: templateWord.id,
        quizDistractorsSourceToTarget: this.buildTargetDistractors(
          template.words,
          templateWord.id,
          targetLanguage,
        ),
        quizDistractorsTargetToSource: this.buildSourceDistractors(template.words, templateWord.id),
        flipCardSourceToTarget: defaultProgress,
        flipCardTargetToSource: defaultProgress,
        quizSourceToTarget: defaultProgress,
        quizTargetToSource: defaultProgress,
        createdAt: now,
        updatedAt: now,
      };
    });
  }

  private buildTargetDistractors(
    words: DefaultWordListTemplate['words'],
    currentWordId: string,
    targetLanguage: string,
  ): string[] {
    return Array.from(
      new Set(
        words
          .filter((word) => word.id !== currentWordId)
          .map((word) => this.getTranslatedText(word.translations, targetLanguage))
          .filter((value): value is string => value !== null),
      ),
    ).slice(0, 2);
  }

  private buildSourceDistractors(
    words: DefaultWordListTemplate['words'],
    currentWordId: string,
  ): string[] {
    return Array.from(
      new Set(words.filter((word) => word.id !== currentWordId).map((word) => word.sourceText.trim())),
    ).slice(0, 2);
  }

  private async hideDefaultList(
    virtualListId: string,
    defaultListId: string,
    targetLanguage: string,
  ): Promise<void> {
    await setDoc(this.defaultListOverrideDocRef(virtualListId), {
      virtualListId,
      defaultListId,
      targetLanguage,
      hiddenAt: Timestamp.now().toDate(),
    });
  }
}
