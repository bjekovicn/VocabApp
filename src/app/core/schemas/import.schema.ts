import { z } from 'zod';
import { ImportFileData, ImportWordData } from '@core/models/import.model';

const VALID_CATEGORIES = [
  'noun',
  'verb',
  'adjective',
  'adverb',
  'pronoun',
  'preposition',
  'conjunction',
  'other',
] as const;

const ImportWordSchema = z.object({
  sourceText: z.string().min(1, 'import.validation.sourceTextRequired'),
  targetText: z.string().min(1, 'import.validation.targetTextRequired'),
  category: z.enum(VALID_CATEGORIES, {
    error: 'import.validation.categoryInvalid',
  }),
  note: z.string().max(300, 'import.validation.noteTooLong').optional(),
  quizDistractorsSourceToTarget: z
    .array(z.string().min(1))
    .length(2, 'import.validation.sourceDistractorsLength'),
  quizDistractorsTargetToSource: z
    .array(z.string().min(1))
    .length(2, 'import.validation.targetDistractorsLength'),
}) satisfies z.ZodType<ImportWordData>;

const ImportFileSchema = z.object({
  words: z.array(ImportWordSchema).min(1, 'import.validation.wordsRequired'),
}) satisfies z.ZodType<ImportFileData>;

export { ImportFileSchema };
