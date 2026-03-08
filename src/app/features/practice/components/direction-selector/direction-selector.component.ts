import { Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18nService } from '@core/services/i18n.service';

@Component({
  selector: 'app-direction-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './direction-selector.component.html',
})
export class DirectionSelectorComponent {
  public readonly i18n = inject(I18nService);
  public readonly direction = input<'source-target' | 'target-source'>('source-target');
  public readonly directionChange = output<'source-target' | 'target-source'>();
}
