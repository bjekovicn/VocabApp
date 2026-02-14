import { Component, input, model, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-custom-input',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomInputComponent),
      multi: true,
    },
  ],
  templateUrl: './custom-input.html',
})
export class CustomInputComponent implements ControlValueAccessor {
  public readonly label = input<string>('');
  public readonly placeholder = input<string>('');
  public readonly type = input<string>('text');
  public readonly disabled = input<boolean>(false);
  public readonly required = input<boolean>(false);

  public readonly value = model<string>('');

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  public handleInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const newValue = target.value;
    this.value.set(newValue);
    this.onChange(newValue);
  }

  public handleBlur(): void {
    this.onTouched();
  }

  public writeValue(value: string): void {
    this.value.set(value || '');
  }

  public registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  public registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  public setDisabledState(isDisabled: boolean): void {}
}
