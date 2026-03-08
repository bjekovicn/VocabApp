import { Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18nService } from '@core/services/i18n.service';

@Component({
  selector: 'app-shuffle-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './shuffle-selector.component.html',
})
export class ShuffleSelectorComponent {
  public readonly i18n = inject(I18nService);
  public readonly shuffled = input<boolean>(true);
  public readonly shuffledChange = output<boolean>();
}
