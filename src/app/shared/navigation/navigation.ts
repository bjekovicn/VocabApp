import { Component, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-navigation',
  imports: [RouterModule],
  templateUrl: './navigation.html',
})
export class NavigationComponent {
  public readonly isMenuOpen = signal(false);

  constructor(private router: Router) {}

  public toggleMenu(): void {
    this.isMenuOpen.set(!this.isMenuOpen());
  }

  public closeMenu(): void {
    this.isMenuOpen.set(false);
  }
}
