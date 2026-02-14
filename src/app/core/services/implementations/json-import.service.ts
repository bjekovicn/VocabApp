import { Injectable } from '@angular/core';
import {
  ImportService,
  ImportFileData,
  ImportWordData,
} from '@core/services/abstractions/import.service';
import { CreateWordDto } from '@core/models/word.model';
import { LanguagePair } from '@core/models/language.model';

@Injectable({
  providedIn: 'root',
})
export class JsonImportService extends ImportService {
  public async parseJsonFile(file: File): Promise<ImportFileData> {
    const text = await file.text();
    const data = JSON.parse(text);

    if (!data.words || !Array.isArray(data.words)) {
      throw new Error('Invalid JSON format: missing "words" array');
    }

    return data as ImportFileData;
  }

  public validateImportData(data: ImportFileData): string[] {
    const errors: string[] = [];

    data.words.forEach((word, index) => {
      if (!word.sourceText || word.sourceText.trim() === '') {
        errors.push(`Word ${index + 1}: missing sourceText`);
      }
      if (!word.targetText || word.targetText.trim() === '') {
        errors.push(`Word ${index + 1}: missing targetText`);
      }
      if (!word.category) {
        errors.push(`Word ${index + 1}: missing category`);
      }
      if (!word.quizDistractorsSourceToTarget || word.quizDistractorsSourceToTarget.length !== 2) {
        errors.push(`Word ${index + 1}: quizDistractorsSourceToTarget must have exactly 2 items`);
      }
      if (!word.quizDistractorsTargetToSource || word.quizDistractorsTargetToSource.length !== 2) {
        errors.push(`Word ${index + 1}: quizDistractorsTargetToSource must have exactly 2 items`);
      }
    });

    return errors;
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
      listId,
      languagePair,
      quizDistractorsSourceToTarget: word.quizDistractorsSourceToTarget,
      quizDistractorsTargetToSource: word.quizDistractorsTargetToSource,
    }));
  }
}
