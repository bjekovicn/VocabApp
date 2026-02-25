import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-shuffle-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './shuffle-selector.component.html',
})
export class ShuffleSelectorComponent {
  public readonly shuffled = input<boolean>(true);
  public readonly shuffledChange = output<boolean>();
}
