import { Injectable } from '@angular/core';
import { ImportService } from '@core/services/abstractions/import.service';
import { ImportFileData } from '@core/models/import.model';
import { CreateWordDto } from '@core/models/word.model';
import { LanguagePair } from '@core/models/language.model';
import { ImportFileSchema } from '../../schemas/import.schema';

@Injectable({ providedIn: 'root' })
export class JsonImportService extends ImportService {
  public async parseJson(source: File | string): Promise<ImportFileData> {
    const text = source instanceof File ? await source.text() : source;

    let raw: unknown;
    try {
      raw = JSON.parse(text);
    } catch {
      throw new Error('Nevažeći JSON format — provjeri zagrade i zareze');
    }

    const result = ImportFileSchema.safeParse(raw);

    if (!result.success) {
      const messages = result.error.issues.map((e) => {
        const path = e.path
          .map((p, i) => (typeof p === 'number' ? `[${p}]` : i === 0 ? String(p) : `.${String(p)}`))
          .join('');
        return `${path}: ${e.message}`;
      });
      throw new Error(`Nevažeći import fajl:\n${messages.join('\n')}`);
    }

    return result.data;
  }

  public convertToCreateDtos(
    data: ImportFileData,
    listId: string,
    languagePair: LanguagePair,
  ): CreateWordDto[] {
    return data.words.map((word) => ({
      sourceText: word.sourceText,
      targetText: word.targetText,
      category: word.category,
      note: word.note,
      listId,
      languagePair,
      quizDistractorsSourceToTarget: word.quizDistractorsSourceToTarget,
      quizDistractorsTargetToSource: word.quizDistractorsTargetToSource,
    }));
  }
}
