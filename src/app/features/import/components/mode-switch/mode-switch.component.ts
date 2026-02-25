import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ModeOption {
  value: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-mode-switch',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mode-switch.component.html',
  styleUrls: ['./mode-switch.component.css'],
})
export class ModeSwitchComponent {
  public readonly selectedValue = input<string>('');
  public readonly options = input<ModeOption[]>([]);
  public readonly valueChange = output<string>();

  public handleSelect(value: string): void {
    this.valueChange.emit(value);
  }
}
