import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface FilterOption {
  value: 'all' | 'weakest' | 'forgotten' | 'new';
  label: string;
  icon: string;
  count: number;
  disabled: boolean;
  color: 'gray' | 'red' | 'orange' | 'green' | 'blue';
}

@Component({
  selector: 'app-filter-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './filter-selector.component.html',
})
export class FilterSelectorComponent {
  public readonly selected = input<'all' | 'weakest' | 'forgotten' | 'new'>('all');
  public readonly options = input<FilterOption[]>([]);
  public readonly selectedChange = output<'all' | 'weakest' | 'forgotten' | 'new'>();

  public getColorClass(
    isSelected: boolean,
    disabled: boolean,
    color: string,
  ): Record<string, boolean> {
    const classes: Record<string, boolean> = {};

    if (isSelected) {
      classes['border-blue-500'] = true;
      classes['bg-blue-50'] = true;
      classes['text-blue-700'] = true;
      classes['bg-blue-100'] = true;
    } else if (disabled) {
      classes['border-gray-100'] = true;
      classes['bg-gray-50'] = true;
      classes['text-gray-400'] = true;
      classes['bg-gray-100'] = true;
      classes['cursor-not-allowed'] = true;
    } else {
      classes['border-gray-200'] = true;
      classes['text-gray-600'] = true;
      classes['hover:border-gray-300'] = true;
      classes['hover:bg-gray-50'] = true;

      // Color badges for non-selected, enabled buttons
      if (color === 'red') {
        classes['bg-red-100'] = true;
        classes['text-red-600'] = true;
      } else if (color === 'orange') {
        classes['bg-orange-100'] = true;
        classes['text-orange-600'] = true;
      } else if (color === 'green') {
        classes['bg-green-100'] = true;
        classes['text-green-600'] = true;
      } else {
        classes['bg-gray-100'] = true;
        classes['text-gray-500'] = true;
      }
    }

    return classes;
  }
}
