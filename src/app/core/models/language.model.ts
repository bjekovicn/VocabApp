export interface Language {
  code: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'de', flag: '🇩🇪' },
  { code: 'en', flag: '🇬🇧' },
  { code: 'fr', flag: '🇫🇷' },
  { code: 'es', flag: '🇪🇸' },
  { code: 'it', flag: '🇮🇹' },
  { code: 'sr', flag: '🇷🇸' },
];

export type LanguagePair = `${string}-${string}`; // e.g., "de-sr", "en-sr"
