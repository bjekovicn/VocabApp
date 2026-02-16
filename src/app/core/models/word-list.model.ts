import { LanguagePair } from './language.model';

export interface WordList {
  id: string;
  name: string;
  languagePair: LanguagePair; // npr. "de-sr"
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWordListDto {
  name: string;
  languagePair: LanguagePair;
  note?: string;
}
