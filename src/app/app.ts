import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '@core/services/abstractions/auth.service';
import { NavigationComponent } from '@shared/navigation/navigation';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavigationComponent],
  templateUrl: './app.html',
})
export class App {
  private readonly auth = inject(AuthService);

  protected readonly authReady = this.auth.isReady;
  protected readonly currentUser = this.auth.user;
  protected readonly isAuthBusy = this.auth.isBusy;
  protected readonly authError = this.auth.errorMessage;

  protected async signInWithGoogle(): Promise<void> {
    await this.auth.signInWithGoogle();
  }
}
