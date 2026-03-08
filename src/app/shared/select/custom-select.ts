import { Component, computed, input, model, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { SelectOption } from './custom-select.types';

export type SelectVariant = 'primary' | 'secondary' | 'tertiary';
export type SelectSize = 'default' | 'small';

@Component({
  selector: 'app-custom-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomSelectComponent),
      multi: true,
    },
  ],
  templateUrl: './custom-select.html',
})
export class CustomSelectComponent implements ControlValueAccessor {
  public readonly label = input<string>('');
  public readonly placeholder = input<string>('Izaberi...');
  public readonly showPlaceholderOption = input<boolean>(true);
  public readonly options = input<SelectOption[]>([]);
  public readonly disabled = input<boolean>(false);
  public readonly required = input<boolean>(false);
  public readonly variant = input<SelectVariant>('primary');
  public readonly size = input<SelectSize>('default');

  public readonly value = model<string | null>(null);

  public readonly selectClasses = computed(() => {
    const baseClasses = 'w-full rounded-lg border transition-colors focus:ring-2 focus:outline-none appearance-none';
    
    const sizeClasses = this.size() === 'small' 
      ? 'px-2 py-1 text-sm' 
      : 'px-4 py-2 text-base';

    let variantClasses = '';
    switch (this.variant()) {
      case 'secondary':
        variantClasses = 'bg-gray-50 border-gray-300 text-slate-900 focus:ring-primary-500 focus:border-primary-500';
        break;
      case 'tertiary':
        variantClasses = 'bg-primary-700/50 border-white/20 text-white placeholder-white/50 focus:bg-primary-700 focus:ring-white/30 focus:border-white/50';
        break;
      case 'primary':
      default:
        variantClasses = 'bg-white border-gray-300 text-slate-900 focus:ring-primary-500 focus:border-primary-500';
        break;
    }

    return `${baseClasses} ${sizeClasses} ${variantClasses}`;
  });

  public readonly labelClasses = computed(() => {
    if (this.variant() === 'tertiary') {
      return 'block text-sm font-medium text-primary-100 mb-1';
    }
    return 'block text-sm font-medium text-gray-700 mb-1';
  });

  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  public onModelChange(newValue: string): void {
    const val = newValue === '' ? null : newValue;
    this.value.set(val);
    this.onChange(val);
    this.onTouched();
  }

  public writeValue(value: string | null): void {
    this.value.set(value || null);
  }

  public registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  public registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  public setDisabledState(isDisabled: boolean): void {
    // Handled by input signal binding in parent
  }
}
