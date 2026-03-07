import { Injectable, computed, signal } from '@angular/core';
import {
  Auth,
  AuthError,
  GoogleAuthProvider,
  User,
  browserLocalPersistence,
  getAuth,
  getRedirectResult,
  linkWithRedirect,
  onAuthStateChanged,
  setPersistence,
  signInWithRedirect,
  signOut,
} from 'firebase/auth';

import { AuthService } from '@core/services/abstractions/auth.service';

@Injectable({ providedIn: 'root' })
export class FirebaseAuthService extends AuthService {
  private readonly auth: Auth = getAuth();
  private readonly _user = signal<User | null>(null);
  private readonly _isReady = signal(false);
  private readonly _isBusy = signal(false);
  private readonly _errorMessage = signal<string | null>(null);
  private readonly initialAuthStateReady: Promise<void>;

  public readonly user = this._user.asReadonly();
  public readonly isReady = this._isReady.asReadonly();
  public readonly isBusy = this._isBusy.asReadonly();
  public readonly isAuthenticated = computed(() => this.user() !== null);
  public readonly isAnonymous = computed(() => this.user()?.isAnonymous ?? false);
  public readonly displayName = computed(() => this.user()?.displayName ?? null);
  public readonly email = computed(() => this.user()?.email ?? null);
  public readonly photoUrl = computed(() => this.user()?.photoURL ?? null);
  public readonly errorMessage = this._errorMessage.asReadonly();

  public constructor() {
    super();

    this.initialAuthStateReady = new Promise((resolve) => {
      let isFirstEmission = true;

      onAuthStateChanged(this.auth, (user) => {
        this._user.set(user);

        if (isFirstEmission) {
          isFirstEmission = false;
          resolve();
        }
      });
    });
  }

  public async initialize(): Promise<void> {
    if (this.isReady()) {
      return;
    }

    this._isBusy.set(true);
    this._errorMessage.set(null);

    try {
      await setPersistence(this.auth, browserLocalPersistence);
      await getRedirectResult(this.auth);
      await this.initialAuthStateReady;
      this._user.set(this.auth.currentUser);
    } catch (error) {
      this._errorMessage.set(this.getErrorMessage(error));
    } finally {
      this._isBusy.set(false);
      this._isReady.set(true);
    }
  }

  public async signInWithGoogle(): Promise<void> {
    this._errorMessage.set(null);
    this._isBusy.set(true);

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      const currentUser = this.auth.currentUser;

      if (currentUser?.isAnonymous) {
        await linkWithRedirect(currentUser, provider);
        return;
      }

      await signInWithRedirect(this.auth, provider);
    } catch (error) {
      this._errorMessage.set(this.getErrorMessage(error));
      this._isBusy.set(false);
    }
  }

  public async signOut(): Promise<void> {
    this._errorMessage.set(null);
    this._isBusy.set(true);

    try {
      await signOut(this.auth);
      this._user.set(null);
    } catch (error) {
      this._errorMessage.set(this.getErrorMessage(error));
    } finally {
      this._isBusy.set(false);
    }
  }

  private getErrorMessage(error: unknown): string {
    const authError = error as Partial<AuthError> | null;

    switch (authError?.code) {
      case 'auth/operation-not-allowed':
        return 'Google prijava nije omogućena u Firebase konzoli.';
      case 'auth/account-exists-with-different-credential':
        return 'Ovaj email je već povezan sa drugim načinom prijave.';
      case 'auth/credential-already-in-use':
        return 'Ovaj Google nalog je već povezan sa drugim korisnikom. Potrebna je ručna migracija podataka.';
      case 'auth/popup-blocked':
        return 'Pregledač je blokirao prijavu. Pokušaj ponovo.';
      default:
        return 'Google prijava nije uspela. Pokušaj ponovo.';
    }
  }
}
