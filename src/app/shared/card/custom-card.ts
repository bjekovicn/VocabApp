import { Component, ElementRef, inject, input } from '@angular/core';

@Component({
  selector: 'app-custom-card',
  imports: [],
  templateUrl: './custom-card.html',
})
export class CustomCardComponent {
  public readonly padding = input<'none' | 'sm' | 'md' | 'lg'>('md');
  public readonly hover = input<boolean>(false);

  private host = inject(ElementRef<HTMLElement>);

  private getHostClasses(): string {
    return this.host.nativeElement.className || '';
  }

  public getCardClasses(): string {
    const paddingClasses: Record<string, string> = {
      none: 'p-0',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };

    const baseClasses = 'bg-white rounded-xl shadow-sm border border-gray-200';
    const paddingClass = paddingClasses[this.padding()];
    const hoverClass = this.hover() ? 'hover:shadow-md transition-shadow cursor-pointer' : '';

    return `${baseClasses} ${paddingClass} ${hoverClass} ${this.getHostClasses()}`.trim();
  }
}
