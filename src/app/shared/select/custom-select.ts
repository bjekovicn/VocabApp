import { Component, input, model, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { SelectOption } from './custom-select.types';

@Component({
  selector: 'app-custom-select',
  standalone: true,
  imports: [CommonModule],
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
  public readonly options = input<SelectOption[]>([]);
  public readonly disabled = input<boolean>(false);
  public readonly required = input<boolean>(false);

  public readonly value = model<string | null>(null);

  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  public handleChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const newValue = target.value === '' ? null : target.value;
    this.value.set(newValue);
    this.onChange(newValue);
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

  public setDisabledState(isDisabled: boolean): void {}
}
