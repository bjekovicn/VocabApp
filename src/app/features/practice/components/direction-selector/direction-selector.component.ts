import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-direction-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './direction-selector.component.html',
})
export class DirectionSelectorComponent {
  public readonly direction = input<'source-target' | 'target-source'>('source-target');
  public readonly directionChange = output<'source-target' | 'target-source'>();
}
