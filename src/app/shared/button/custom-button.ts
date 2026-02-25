import { Component, ElementRef, inject, input, output } from '@angular/core';

@Component({
  selector: 'app-custom-button',
  imports: [],
  templateUrl: './custom-button.html',
})
export class CustomButtonComponent {
  public readonly variant = input<'primary' | 'secondary' | 'danger'>('primary');
  public readonly type = input<'button' | 'submit' | 'reset'>('button');
  public readonly disabled = input<boolean>(false);
  public readonly fullWidth = input<boolean>(false);
  public readonly topIcon = input<string | null>(null);
  public readonly bottomIcon = input<string | null>(null);
  public readonly leftIcon = input<string | null>(null);
  public readonly rightIcon = input<string | null>(null);
  public readonly clicked = output<MouseEvent>();

  public handleClick(event: MouseEvent): void {
    if (!this.disabled()) {
      this.clicked.emit(event);
    }
  }

  private host = inject(ElementRef<HTMLElement>);

  private getHostClasses(): string {
    return this.host.nativeElement.className || '';
  }

  public getButtonClasses(): string {
    const baseClasses = 'btn';
    const variantClass = `btn-${this.variant()}`;
    const widthClass = this.fullWidth() ? 'w-full' : '';
    const disabledClass = this.disabled() ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';

    return `${baseClasses} ${variantClass} ${widthClass} ${disabledClass} ${this.getHostClasses()}`.trim();
  }
}
