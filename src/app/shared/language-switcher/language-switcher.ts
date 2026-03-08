import { Component, inject } from '@angular/core';
import { CustomSelectComponent } from '@shared/select/custom-select';
import { I18nService } from '@core/services/i18n.service';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CustomSelectComponent],
  templateUrl: './language-switcher.html',
})
export class LanguageSwitcherComponent {
  public readonly i18n = inject(I18nService);
  public readonly locale = this.i18n.locale;
  public readonly options = this.i18n.uiLocaleOptions;

  public handleLocaleChange(value: string | null): void {
    this.i18n.setLocale(value);
  }
}
