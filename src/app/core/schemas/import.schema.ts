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
  sourceText: z.string().min(1, 'sourceText ne smije biti prazan'),
  targetText: z.string().min(1, 'targetText ne smije biti prazan'),
  category: z.enum(VALID_CATEGORIES, {
    error: `category mora biti jedna od: ${VALID_CATEGORIES.join(', ')}`,
  }),
  note: z.string().max(300, 'note ne smije biti duži od 300 znakova').optional(),
  quizDistractorsSourceToTarget: z
    .array(z.string().min(1))
    .length(2, 'quizDistractorsSourceToTarget mora imati tačno 2 elementa'),
  quizDistractorsTargetToSource: z
    .array(z.string().min(1))
    .length(2, 'quizDistractorsTargetToSource mora imati tačno 2 elementa'),
}) satisfies z.ZodType<ImportWordData>;

const ImportFileSchema = z.object({
  words: z.array(ImportWordSchema).min(1, '"words" niz ne smije biti prazan'),
}) satisfies z.ZodType<ImportFileData>;

export { ImportFileSchema };
