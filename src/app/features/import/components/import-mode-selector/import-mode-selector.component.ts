import { Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18nService } from '@core/services/i18n.service';
import { CustomButtonComponent } from '@shared/button/custom-button';

@Component({
  selector: 'app-import-mode-selector',
  standalone: true,
  imports: [CommonModule, CustomButtonComponent],
  templateUrl: './import-mode-selector.component.html',
})
export class ImportModeSelectorComponent {
  public readonly i18n = inject(I18nService);
  public readonly mode = input<'paste' | 'file'>('paste');
  public readonly modeChange = output<'paste' | 'file'>();
}
