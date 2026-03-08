import { I18nService } from '@core/services/i18n.service';

export function buildImportPrompt(
  i18n: I18nService,
  sourceLanguage: string,
  targetLanguage: string,
  topic: string,
): string {
  return `${i18n.t('import.prompt.header')}

${i18n.t('import.prompt.allowedCategories')}
"noun" | "verb" | "adjective" | "adverb" | "pronoun" | "preposition" | "conjunction" | "other"

${i18n.t('import.prompt.rules')}
${i18n.t('import.prompt.rule1')}
${i18n.t('import.prompt.rule2')}
${i18n.t('import.prompt.rule3')}
${i18n.t('import.prompt.rule4')}
    ${i18n.t('import.prompt.rule4a')}
    ${i18n.t('import.prompt.rule4b')}
    ${i18n.t('import.prompt.rule4c')}
    ${i18n.t('import.prompt.rule4d')}
    ${i18n.t('import.prompt.rule4e')}
${i18n.t('import.prompt.rule5')}

${i18n.t('import.prompt.format')}
{
  "words": [
    {
      "sourceText": "laufen",
      "targetText": "trčati",
      "category": "verb",
      "note": "Nepravilan glagol: läuft, lief, ist gelaufen",
      "quizDistractorsSourceToTarget": ["hodati", "skakati"],
      "quizDistractorsTargetToSource": ["gehen", "springen"]
    },
    {
      "sourceText": "der Tisch",
      "targetText": "sto",
      "category": "noun",
      "quizDistractorsSourceToTarget": ["stolica", "polica"],
      "quizDistractorsTargetToSource": ["der Stuhl", "das Regal"]
    }
  ]
}

${i18n.t('import.prompt.sourceLanguage', { language: sourceLanguage })}
${i18n.t('import.prompt.targetLanguage', { language: targetLanguage })}
${i18n.t('import.prompt.topic', {
  topic: topic || i18n.t('import.prompt.noTopic'),
})}`;
}
