export type UiLocale = 'sr' | 'en' | 'de' | 'es' | 'it' | 'fr';

export interface UiLocaleOption {
  code: UiLocale;
  flag: string;
  labelKey: string;
}

export const DEFAULT_UI_LOCALE: UiLocale = 'sr';

export const SUPPORTED_UI_LOCALES: UiLocaleOption[] = [
  { code: 'sr', flag: '🇷🇸', labelKey: 'uiLocale.sr' },
  { code: 'en', flag: '🇬🇧', labelKey: 'uiLocale.en' },
  { code: 'de', flag: '🇩🇪', labelKey: 'uiLocale.de' },
  { code: 'es', flag: '🇪🇸', labelKey: 'uiLocale.es' },
  { code: 'it', flag: '🇮🇹', labelKey: 'uiLocale.it' },
  { code: 'fr', flag: '🇫🇷', labelKey: 'uiLocale.fr' },
];
