import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { Observable } from 'rxjs';
import { Word } from '@core/models/word.model';
import { StorageService } from '@core/services/abstractions/storage.service';

export const wordsResolver: ResolveFn<Word[]> = (): Observable<Word[]> => {
  const storage = inject(StorageService);
  return storage.getWords();
};
