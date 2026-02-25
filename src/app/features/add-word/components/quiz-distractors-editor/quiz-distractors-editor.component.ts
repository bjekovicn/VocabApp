import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomInputComponent } from '@shared/input/custom-input';

@Component({
  selector: 'app-quiz-distractors-editor',
  standalone: true,
  imports: [CommonModule, CustomInputComponent],
  templateUrl: './quiz-distractors-editor.component.html',
})
export class QuizDistractorsEditorComponent {
  public readonly sourceToTarget = input<string[]>(['', '']);
  public readonly targetToSource = input<string[]>(['', '']);
  public readonly sourceLanguage = input<string>('');
  public readonly targetLanguage = input<string>('');

  public readonly sourceToTargetChange = output<{ index: number; value: string }>();
  public readonly targetToSourceChange = output<{ index: number; value: string }>();

  public handleSourceToTargetChange(index: number, value: string): void {
    this.sourceToTargetChange.emit({ index, value });
  }

  public handleTargetToSourceChange(index: number, value: string): void {
    this.targetToSourceChange.emit({ index, value });
  }
}
