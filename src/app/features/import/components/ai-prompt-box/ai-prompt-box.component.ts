import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomButtonComponent } from '@shared/button/custom-button';

@Component({
  selector: 'app-ai-prompt-box',
  standalone: true,
  imports: [CommonModule, CustomButtonComponent],
  templateUrl: './ai-prompt-box.component.html',
})
export class AiPromptBoxComponent {
  public readonly topic = input<string>('');
  public readonly prompt = input<string>('');
  public readonly copied = input<boolean>(false);
  public readonly pastedJson = input<string>('');

  public readonly copyPrompt = output<void>();
  public readonly jsonChange = output<string>();
}
