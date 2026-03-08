import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LanguagePairFilterService {
  private readonly sourceStorageKey = 'vocab-app.selected-source-language';
  private readonly targetStorageKey = 'vocab-app.selected-target-language';
  private readonly _selectedSourceLanguage = signal<string | null>(this.readInitialValue(this.sourceStorageKey));
  private readonly _selectedTargetLanguage = signal<string | null>(this.readInitialValue(this.targetStorageKey));

  public readonly selectedSourceLanguage = this._selectedSourceLanguage.asReadonly();
  public readonly selectedTargetLanguage = this._selectedTargetLanguage.asReadonly();

  public setSourceLanguage(language: string | null): void {
    this._selectedSourceLanguage.set(language);
    this.persistValue(this.sourceStorageKey, language);
  }

  public setTargetLanguage(language: string | null): void {
    this._selectedTargetLanguage.set(language);
    this.persistValue(this.targetStorageKey, language);
  }

  public syncAvailablePairs(pairs: string[]): void {
    const uniquePairs = [...new Set(pairs.filter(Boolean))];
    if (uniquePairs.length === 0) {
      return;
    }

    const availableSources = new Set(uniquePairs.map((pair) => this.parsePair(pair).source));
    const selectedSource = this._selectedSourceLanguage();
    const selectedTarget = this._selectedTargetLanguage();

    if (selectedSource && !availableSources.has(selectedSource)) {
      this.setSourceLanguage(null);
    }

    const activeSource = this._selectedSourceLanguage();
    const availableTargets = new Set(
      uniquePairs
        .map((pair) => this.parsePair(pair))
        .filter((pair) => !activeSource || pair.source === activeSource)
        .map((pair) => pair.target),
    );

    if (selectedTarget && !availableTargets.has(selectedTarget)) {
      this.setTargetLanguage(null);
    }
  }

  public setPair(pair: string | null): void {
    if (!pair) {
      this.setSourceLanguage(null);
      this.setTargetLanguage(null);
      return;
    }

    const { source, target } = this.parsePair(pair);
    this.setSourceLanguage(source);
    this.setTargetLanguage(target);
  }

  private persistValue(key: string, value: string | null): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    if (value) {
      localStorage.setItem(key, value);
    } else {
      localStorage.removeItem(key);
    }
  }

  private readInitialValue(key: string): string | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    return localStorage.getItem(key);
  }

  private parsePair(pair: string): { source: string; target: string } {
    const [source = '', target = ''] = pair.split('-');
    return { source, target };
  }
}
