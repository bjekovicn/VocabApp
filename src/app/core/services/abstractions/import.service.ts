import { CreateWordDto } from '@core/models/word.model';
import { WordCategory } from '@core/models/word-category.model';
import { LanguagePair } from '@core/models/language.model';

export interface ImportWordData {
  sourceText: string;
  targetText: string;
  category: WordCategory;
  quizDistractorsSourceToTarget: string[];
  quizDistractorsTargetToSource: string[];
}

export interface ImportFileData {
  words: ImportWordData[];
}

export abstract class ImportService {
  public abstract parseJsonFile(file: File): Promise<ImportFileData>;
  public abstract validateImportData(data: ImportFileData): string[];
  public abstract convertToCreateDtos(
    data: ImportFileData,
    listId: string,
    languagePair: LanguagePair,
  ): CreateWordDto[];
}
