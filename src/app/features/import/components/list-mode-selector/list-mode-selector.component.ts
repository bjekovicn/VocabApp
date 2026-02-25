import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomButtonComponent } from '@shared/button/custom-button';

@Component({
  selector: 'app-list-mode-selector',
  standalone: true,
  imports: [CommonModule, CustomButtonComponent],
  templateUrl: './list-mode-selector.component.html',
})
export class ListModeSelectorComponent {
  public readonly mode = input<'existing' | 'new'>('new');
  public readonly modeChange = output<'existing' | 'new'>();
}
