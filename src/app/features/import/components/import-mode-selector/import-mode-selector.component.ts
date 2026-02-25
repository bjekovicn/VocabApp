import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomButtonComponent } from '@shared/button/custom-button';

@Component({
  selector: 'app-import-mode-selector',
  standalone: true,
  imports: [CommonModule, CustomButtonComponent],
  templateUrl: './import-mode-selector.component.html',
})
export class ImportModeSelectorComponent {
  public readonly mode = input<'paste' | 'file'>('paste');
  public readonly modeChange = output<'paste' | 'file'>();
}
