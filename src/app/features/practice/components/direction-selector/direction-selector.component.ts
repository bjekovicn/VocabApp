import { Component, computed, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18nService } from '@core/services/i18n.service';
import { LanguagePairFilterService } from '@core/services/language-pair-filter.service';

@Component({
  selector: 'app-direction-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './direction-selector.component.html',
})
export class DirectionSelectorComponent {
  public readonly i18n = inject(I18nService);
  private readonly languagePairFilter = inject(LanguagePairFilterService);
  public readonly direction = input<'source-target' | 'target-source'>('source-target');
  public readonly directionChange = output<'source-target' | 'target-source'>();

  public readonly sourceLabel = computed(() => {
    const source = this.languagePairFilter.selectedSourceLanguage();
    return source ? this.i18n.getLanguageName(source) : this.i18n.t('listForm.sourceLanguage');
  });

  public readonly targetLabel = computed(() => {
    const target = this.languagePairFilter.selectedTargetLanguage();
    return target ? this.i18n.getLanguageName(target) : this.i18n.t('listForm.targetLanguage');
  });
}
