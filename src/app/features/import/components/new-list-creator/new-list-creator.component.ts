import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomInputComponent } from '@shared/input/custom-input';
import { CustomSelectComponent } from '@shared/select/custom-select';

export interface LanguageOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-new-list-creator',
  standalone: true,
  imports: [CommonModule, CustomInputComponent, CustomSelectComponent],
  templateUrl: './new-list-creator.component.html',
})
export class NewListCreatorComponent {
  public readonly name = input<string>('');
  public readonly sourceLanguage = input<string>('');
  public readonly targetLanguage = input<string>('');
  public readonly languageOptions = input<LanguageOption[]>([]);

  public readonly nameChange = output<string>();
  public readonly sourceLanguageChange = output<string>();
  public readonly targetLanguageChange = output<string>();
}
