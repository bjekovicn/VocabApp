import { LanguagePair } from './language.model';

export interface WordList {
  id: string;
  name: string;
  languagePair: LanguagePair; // npr. "de-sr"
  isDefault?: boolean;
  isReadOnlyDefault?: boolean;
  originDefaultListId?: string;
  wordCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWordListDto {
  name: string;
  languagePair: LanguagePair;
  note?: string;
}
