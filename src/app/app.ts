import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '@core/services/abstractions/auth.service';
import { I18nService } from '@core/services/i18n.service';
import { NavigationComponent } from '@shared/navigation/navigation';
import { LanguageSwitcherComponent } from '@shared/language-switcher/language-switcher';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavigationComponent, LanguageSwitcherComponent],
  templateUrl: './app.html',
})
export class App {
  private readonly auth = inject(AuthService);
  protected readonly i18n = inject(I18nService);

  protected readonly authReady = this.auth.isReady;
  protected readonly currentUser = this.auth.user;
  protected readonly isAuthBusy = this.auth.isBusy;
  protected readonly authError = this.auth.errorMessage;

  protected async signInWithGoogle(): Promise<void> {
    await this.auth.signInWithGoogle();
  }
}
