import { Observable } from 'rxjs';
import { Word, CreateWordDto } from '@core/models/word.model';
import { WordList, CreateWordListDto } from '@core/models/word-list.model';

export abstract class StorageService {
  // Auth
  public abstract getCurrentUserId(): string | null;

  // Word Lists
  public abstract getWordLists(): Observable<WordList[]>;
  public abstract getWordListById(id: string): Observable<WordList | null>;
  public abstract createWordList(dto: CreateWordListDto): Promise<string>;
  public abstract updateWordList(id: string, updates: Partial<WordList>): Promise<void>;

  // Words
  public abstract getWords(): Observable<Word[]>;
  public abstract getWordsByListId(listId: string): Observable<Word[]>;
  public abstract getWordById(id: string): Observable<Word | null>;
  public abstract createWord(dto: CreateWordDto): Promise<string>;
  public abstract updateWord(id: string, updates: Partial<Word>): Promise<void>;
  public abstract deleteWord(id: string): Promise<void>;

  // BATCH OPERATIONS (PERFORMANCE OPTIMIZATIONS)
  public abstract batchUpdateWords(
    updates: Array<{ id: string; data: Partial<Word> }>,
  ): Promise<void>;
  public abstract batchCreateWords(dtos: CreateWordDto[]): Promise<string[]>;
  public abstract deleteWordListWithWords(listId: string): Promise<void>;
}
