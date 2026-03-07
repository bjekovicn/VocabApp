import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '@core/services/abstractions/auth.service';

@Component({
  selector: 'app-navigation',
  imports: [RouterModule],
  templateUrl: './navigation.html',
})
export class NavigationComponent {
  private readonly auth = inject(AuthService);

  public readonly isMenuOpen = signal(false);
  public readonly isAnonymousUser = this.auth.isAnonymous;
  public readonly isAuthBusy = this.auth.isBusy;
  public readonly authError = this.auth.errorMessage;
  public readonly userPhotoUrl = this.auth.photoUrl;
  public readonly userLabel = computed(
    () => this.auth.displayName() ?? this.auth.email() ?? 'Google nalog',
  );
  public readonly userSubLabel = computed(() =>
    this.auth.displayName() && this.auth.email() ? this.auth.email() : 'Povezan Google nalog',
  );
  public readonly userInitials = computed(() => {
    const source = this.auth.displayName() ?? this.auth.email() ?? 'G';
    const parts = source
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (parts.length === 0) {
      return 'G';
    }

    return parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  });

  constructor(private router: Router) {}

  public toggleMenu(): void {
    this.isMenuOpen.set(!this.isMenuOpen());
  }

  public closeMenu(): void {
    this.isMenuOpen.set(false);
  }

  public async handleGoogleSignIn(): Promise<void> {
    this.closeMenu();
    await this.auth.signInWithGoogle();
  }

  public async handleSignOut(): Promise<void> {
    this.closeMenu();
    await this.auth.signOut();
    await this.router.navigateByUrl('/');
  }
}
