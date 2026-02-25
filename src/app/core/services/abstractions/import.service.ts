import { LanguagePair } from '@core/models/language.model';
import { CreateWordDto } from '@core/models/word.model';
import { ImportFileData } from '@core/models/import.model';

export abstract class ImportService {
  public abstract parseJson(source: File | string): Promise<ImportFileData>;

  public abstract convertToCreateDtos(
    data: ImportFileData,
    listId: string,
    languagePair: LanguagePair,
  ): CreateWordDto[];
}
