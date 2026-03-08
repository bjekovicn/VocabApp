import { Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18nService } from '@core/services/i18n.service';
import { CustomButtonComponent } from '@shared/button/custom-button';

@Component({
  selector: 'app-list-mode-selector',
  standalone: true,
  imports: [CommonModule, CustomButtonComponent],
  templateUrl: './list-mode-selector.component.html',
})
export class ListModeSelectorComponent {
  public readonly i18n = inject(I18nService);
  public readonly mode = input<'existing' | 'new'>('new');
  public readonly modeChange = output<'existing' | 'new'>();
}
