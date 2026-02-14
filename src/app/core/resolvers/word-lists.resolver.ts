import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { Observable, firstValueFrom } from 'rxjs';
import { WordList } from '@core/models/word-list.model';
import { StorageService } from '@core/services/abstractions/storage.service';

export const wordListsResolver: ResolveFn<WordList[]> = (): Observable<WordList[]> => {
  const storage = inject(StorageService);
  return storage.getWordLists();
};
