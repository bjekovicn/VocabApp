export interface Language {
  code: string;
  name: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'de', name: 'Nemački', flag: '🇩🇪' },
  { code: 'en', name: 'Engleski', flag: '🇬🇧' },
  { code: 'fr', name: 'Francuski', flag: '🇫🇷' },
  { code: 'es', name: 'Španski', flag: '🇪🇸' },
  { code: 'it', name: 'Italijanski', flag: '🇮🇹' },
  { code: 'sr', name: 'Srpski', flag: '🇷🇸' },
];

export type LanguagePair = `${string}-${string}`; // e.g., "de-sr", "en-sr"
