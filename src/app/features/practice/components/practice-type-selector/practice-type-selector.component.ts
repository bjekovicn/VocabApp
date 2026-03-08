import { Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18nService } from '@core/services/i18n.service';

@Component({
  selector: 'app-practice-type-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './practice-type-selector.component.html',
})
export class PracticeTypeSelectorComponent {
  public readonly i18n = inject(I18nService);
  public readonly type = input<'flip-card' | 'quiz'>('flip-card');
  public readonly typeChange = output<'flip-card' | 'quiz'>();
}
