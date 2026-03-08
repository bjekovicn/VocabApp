import { Component, computed, effect, inject } from '@angular/core';
import { LanguagePairFilterService } from '@core/services/language-pair-filter.service';
import { VocabularyFacade } from '@core/state/vocabulary.facade';
import { I18nService } from '@core/services/i18n.service';
import { CustomSelectComponent } from '@shared/select/custom-select';
import { SelectOption } from '@shared/select/custom-select.types';

@Component({
  selector: 'app-language-pair-filter',
  standalone: true,
  imports: [CustomSelectComponent],
  templateUrl: './language-pair-filter.html',
})
export class LanguagePairFilterComponent {
  private readonly filter = inject(LanguagePairFilterService);
  private readonly vocabulary = inject(VocabularyFacade);
  public readonly i18n = inject(I18nService);

  public readonly selectedSource = this.filter.selectedSourceLanguage;
  public readonly selectedTarget = this.filter.selectedTargetLanguage;

  private readonly availablePairs = computed(() =>
    [...new Set(this.vocabulary.wordLists().map((list) => list.languagePair))],
  );

  public readonly sourceOptions = computed<SelectOption[]>(() => {
    const target = this.selectedTarget();
    return [...new Set(this.availablePairs().map((p) => p.split('-')[0]))]
      .filter((src) =>
        target ? this.availablePairs().some((p) => p === `${src}-${target}`) : true,
      )
      .sort((a, b) => this.i18n.getLanguageDisplay(a).localeCompare(this.i18n.getLanguageDisplay(b)))
      .map((code) => ({ value: code, label: this.i18n.getLanguageDisplay(code) }));
  });

  public readonly targetOptions = computed<SelectOption[]>(() => {
    const source = this.selectedSource();
    return [...new Set(this.availablePairs().map((p) => p.split('-')[1]))]
      .filter((tgt) =>
        source ? this.availablePairs().some((p) => p === `${source}-${tgt}`) : true,
      )
      .sort((a, b) => this.i18n.getLanguageDisplay(a).localeCompare(this.i18n.getLanguageDisplay(b)))
      .map((code) => ({ value: code, label: this.i18n.getLanguageDisplay(code) }));
  });

  public constructor() {
    effect(() => {
      this.filter.syncAvailablePairs(
        this.vocabulary.wordLists().map((list) => list.languagePair),
      );
    });
  }

  public handleSourceChange(value: string | null): void {
    this.filter.setSourceLanguage(value);
  }

  public handleTargetChange(value: string | null): void {
    this.filter.setTargetLanguage(value);
  }
}
