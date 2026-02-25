import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-practice-type-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './practice-type-selector.component.html',
})
export class PracticeTypeSelectorComponent {
  public readonly type = input<'flip-card' | 'quiz'>('flip-card');
  public readonly typeChange = output<'flip-card' | 'quiz'>();
}
