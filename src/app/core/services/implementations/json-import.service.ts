import { Injectable, inject } from '@angular/core';
import { ImportService } from '@core/services/abstractions/import.service';
import { ImportFileData } from '@core/models/import.model';
import { CreateWordDto } from '@core/models/word.model';
import { LanguagePair } from '@core/models/language.model';
import { I18nService } from '@core/services/i18n.service';
import { ImportFileSchema } from '../../schemas/import.schema';

@Injectable({ providedIn: 'root' })
export class JsonImportService extends ImportService {
  private readonly i18n = inject(I18nService);

  public async parseJson(source: File | string): Promise<ImportFileData> {
    const text = source instanceof File ? await source.text() : source;

    let raw: unknown;
    try {
      raw = JSON.parse(text);
    } catch {
      throw new Error(this.i18n.t('errors.import.invalidJson'));
    }

    const result = ImportFileSchema.safeParse(raw);

    if (!result.success) {
      const messages = result.error.issues.map((e) => {
        const path = e.path
          .map((p, i) => (typeof p === 'number' ? `[${p}]` : i === 0 ? String(p) : `.${String(p)}`))
          .join('');
        return `${path}: ${this.translateImportIssue(e.message)}`;
      });
      throw new Error(`${this.i18n.t('errors.import.invalidFile')}\n${messages.join('\n')}`);
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

  private translateImportIssue(issueKey: string): string {
    switch (issueKey) {
      case 'import.validation.sourceTextRequired':
        return this.i18n.t('import.validation.sourceTextRequired');
      case 'import.validation.targetTextRequired':
        return this.i18n.t('import.validation.targetTextRequired');
      case 'import.validation.categoryInvalid':
        return this.i18n.t('import.validation.categoryInvalid');
      case 'import.validation.noteTooLong':
        return this.i18n.t('import.validation.noteTooLong');
      case 'import.validation.sourceDistractorsLength':
        return this.i18n.t('import.validation.sourceDistractorsLength');
      case 'import.validation.targetDistractorsLength':
        return this.i18n.t('import.validation.targetDistractorsLength');
      case 'import.validation.wordsRequired':
        return this.i18n.t('import.validation.wordsRequired');
      default:
        return issueKey;
    }
  }
}
