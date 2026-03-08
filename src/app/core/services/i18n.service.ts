import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';
import { WordCategory } from '@core/models/word-category.model';
import { SUPPORTED_LANGUAGES } from '@core/models/language.model';
import {
  DEFAULT_UI_LOCALE,
  SUPPORTED_UI_LOCALES,
  UiLocale,
  UiLocaleOption,
} from '@core/i18n/ui-locale.model';
import { TRANSLATIONS } from '@core/i18n/translations';
import { SelectOption } from '@shared/select/custom-select.types';

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly document = inject(DOCUMENT);
  private readonly storageKey = 'vocab-app.ui-locale';
  private readonly _locale = signal<UiLocale>(this.readInitialLocale());

  public readonly locale = this._locale.asReadonly();
  public readonly uiLocaleOptions = computed<SelectOption[]>(() =>
    SUPPORTED_UI_LOCALES.map((locale) => ({
      value: locale.code,
      label: `${locale.flag} ${this.t(locale.labelKey)}`,
    })),
  );

  public constructor() {
    this.applyDocumentLocale(this._locale());
  }

  public setLocale(locale: string | null): void {
    if (!locale || !this.isSupportedLocale(locale)) {
      return;
    }

    this._locale.set(locale);
    localStorage.setItem(this.storageKey, locale);
    this.applyDocumentLocale(locale);
  }

  public t(key: string, params?: Record<string, string | number | null | undefined>): string {
    const locale = this._locale();
    const template = TRANSLATIONS[locale][key] ?? TRANSLATIONS[DEFAULT_UI_LOCALE][key] ?? key;

    if (!params) {
      return template;
    }

    return Object.entries(params).reduce((result, [paramKey, value]) => {
      return result.replaceAll(`{{${paramKey}}}`, String(value ?? ''));
    }, template);
  }

  public getLanguageDisplay(code: string): string {
    const language = SUPPORTED_LANGUAGES.find((item) => item.code === code);
    if (!language) {
      return code.toUpperCase();
    }

    return `${language.flag} ${this.getLanguageName(language.code)}`;
  }

  public getLanguageName(code: string): string {
    return this.t(`language.name.${code}`);
  }

  public getLanguagePairDisplay(languagePair: string): string {
    const [source, target] = languagePair.split('-');
    return `${this.getLanguageDisplay(source)} → ${this.getLanguageDisplay(target)}`;
  }

  public getCategoryLabel(category: WordCategory): string {
    return this.t(`wordCategory.${category}`);
  }

  public getUiLocaleOption(code: UiLocale): UiLocaleOption | undefined {
    return SUPPORTED_UI_LOCALES.find((locale) => locale.code === code);
  }

  private readInitialLocale(): UiLocale {
    const stored = localStorage.getItem(this.storageKey);
    if (stored && this.isSupportedLocale(stored)) {
      return stored;
    }

    const browserLocale = navigator.language.slice(0, 2);
    if (this.isSupportedLocale(browserLocale)) {
      return browserLocale;
    }

    return DEFAULT_UI_LOCALE;
  }

  private isSupportedLocale(locale: string): locale is UiLocale {
    return SUPPORTED_UI_LOCALES.some((item) => item.code === locale);
  }

  private applyDocumentLocale(locale: UiLocale): void {
    this.document.documentElement.lang = locale;
  }
}
