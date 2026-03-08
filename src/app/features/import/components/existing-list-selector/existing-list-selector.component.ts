import { Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18nService } from '@core/services/i18n.service';
import { CustomSelectComponent } from '@shared/select/custom-select';

export interface ListOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-existing-list-selector',
  standalone: true,
  imports: [CommonModule, CustomSelectComponent],
  templateUrl: './existing-list-selector.component.html',
})
export class ExistingListSelectorComponent {
  public readonly i18n = inject(I18nService);
  public readonly selectedListId = input<string | null>(null);
  public readonly listOptions = input<ListOption[]>([]);

  public readonly selectedListIdChange = output<string>();
}
