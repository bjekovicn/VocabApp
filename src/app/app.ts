import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavigationComponent } from '@shared/navigation/navigation';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavigationComponent],
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('vocab-app');
}
