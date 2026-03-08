import { Injectable, computed, signal, inject } from '@angular/core';
import {
  Auth,
  AuthError,
  GoogleAuthProvider,
  User,
  UserInfo,
  browserLocalPersistence,
  getAuth,
  linkWithPopup,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { Timestamp, doc, getDoc, getFirestore, setDoc } from 'firebase/firestore';

import { UserProfile } from '@core/models/user-profile.model';
import { AuthService } from '@core/services/abstractions/auth.service';
import { I18nService } from '@core/services/i18n.service';
import { FirebaseStorageService } from './firebase-storage.service';

@Injectable({ providedIn: 'root' })
export class FirebaseAuthService extends AuthService {
  private readonly auth: Auth = getAuth();
  private readonly db = getFirestore();
  private readonly i18n = inject(I18nService);
  private readonly storageService = inject(FirebaseStorageService);
  private readonly _user = signal<User | null>(null);
  private readonly _isReady = signal(false);
  private readonly _isBusy = signal(false);
  private readonly _errorMessage = signal<string | null>(null);
  private readonly initialAuthStateReady: Promise<void>;

  public readonly user = this._user.asReadonly();
  public readonly isReady = this._isReady.asReadonly();
  public readonly isBusy = this._isBusy.asReadonly();
  public readonly isAuthenticated = computed(() => this.user() !== null);
  public readonly isAnonymous = computed(() => {
    const user = this.user();
    if (!user) {
      return false;
    }

    return user.isAnonymous || this.getResolvedProviders(user).length === 0;
  });
  public readonly displayName = computed(
    () => this.user()?.displayName ?? this.getPrimaryProviderProfile(this.user())?.displayName ?? null,
  );
  public readonly email = computed(
    () => this.user()?.email ?? this.getPrimaryProviderProfile(this.user())?.email ?? null,
  );
  public readonly photoUrl = computed(
    () => this.user()?.photoURL ?? this.getPrimaryProviderProfile(this.user())?.photoURL ?? null,
  );
  public readonly errorMessage = this._errorMessage.asReadonly();

  public constructor() {
    super();

    this.initialAuthStateReady = new Promise((resolve) => {
      let isFirstEmission = true;

      onAuthStateChanged(this.auth, (user) => {
        this._user.set(user);

        if (user) {
          void this.syncUserProfile(user);
        }

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
      await this.initialAuthStateReady;

      const user = this.auth.currentUser;
      this._user.set(user);

      if (user) {
        void this.syncUserProfile(user);
      }
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
        await this.linkAnonymousWithGoogle(currentUser, provider);
      } else {
        const result = await signInWithPopup(this.auth, provider);
        await result.user.reload();
        this._user.set(result.user);
        await this.syncUserProfile(result.user);
      }
    } catch (error) {
      const message = this.getErrorMessage(error);
      if (message) {
        this._errorMessage.set(message);
      }
    } finally {
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

  private async linkAnonymousWithGoogle(anonymousUser: User, provider: GoogleAuthProvider): Promise<void> {
    const anonymousUid = anonymousUser.uid;

    try {
      const result = await linkWithPopup(anonymousUser, provider);
      await result.user.reload();
      this._user.set(result.user);
      await this.syncUserProfile(result.user);
    } catch (linkError) {
      const code = (linkError as Partial<AuthError>).code;

      if (code === 'auth/credential-already-in-use') {
        const result = await signInWithPopup(this.auth, provider);
        const newUid = result.user.uid;

        if (anonymousUid !== newUid) {
          await this.storageService.migrateData(anonymousUid, newUid);
        }

        await result.user.reload();
        this._user.set(result.user);
        await this.syncUserProfile(result.user);
        return;
      }

      throw linkError;
    }
  }

  private getErrorMessage(error: unknown): string | null {
    const authError = error as Partial<AuthError> | null;

    switch (authError?.code) {
      case 'auth/popup-closed-by-user':
      case 'auth/cancelled-popup-request':
        return null;
      case 'auth/operation-not-allowed':
        return this.i18n.t('errors.auth.operationNotAllowed');
      case 'auth/account-exists-with-different-credential':
        return this.i18n.t('errors.auth.accountExistsDifferentCredential');
      case 'auth/credential-already-in-use':
        return this.i18n.t('errors.auth.credentialAlreadyInUse');
      case 'auth/popup-blocked':
        return this.i18n.t('errors.auth.popupBlocked');
      default:
        return this.i18n.t('errors.auth.default');
    }
  }

  private async syncUserProfile(user: User): Promise<void> {
    const userDocRef = doc(this.db, `users/${user.uid}`);
    const existingProfile = (await getDoc(userDocRef)).data() as Partial<UserProfile> | undefined;
    const now = new Date();
    const primaryProviderProfile = this.getPrimaryProviderProfile(user);
    const providers = this.getResolvedProviders(user);
    const isGoogleUser = providers.includes('google.com');

    const profile: UserProfile = {
      uid: user.uid,
      isAnonymous: providers.length === 0,
      primaryProvider: isGoogleUser ? 'google' : 'anonymous',
      providers: providers.length > 0 ? providers : ['anonymous'],
      email: user.email ?? primaryProviderProfile?.email ?? null,
      displayName: user.displayName ?? primaryProviderProfile?.displayName ?? null,
      photoUrl: user.photoURL ?? primaryProviderProfile?.photoURL ?? null,
      createdAt: this.toDate(existingProfile?.createdAt) ?? now,
      lastLoginAt: now,
      linkedAt: isGoogleUser
        ? this.toDate(existingProfile?.linkedAt) ?? now
        : null,
      upgradedFromAnonymous:
        (existingProfile?.upgradedFromAnonymous as boolean | undefined) ||
        (!!existingProfile?.isAnonymous && !user.isAnonymous),
    };

    await setDoc(userDocRef, profile, { merge: true });
  }

  private toDate(value: unknown): Date | null {
    if (!value) {
      return null;
    }

    if (value instanceof Date) {
      return value;
    }

    if (value instanceof Timestamp) {
      return value.toDate();
    }

    if (typeof value === 'string' || typeof value === 'number') {
      return new Date(value);
    }

    return null;
  }

  private getResolvedProviders(user: User): string[] {
    return Array.from(
      new Set(
        user.providerData
          .map((provider) => provider.providerId)
          .filter((providerId): providerId is string => !!providerId && providerId !== 'firebase'),
      ),
    );
  }

  private getPrimaryProviderProfile(user: User | null): UserInfo | null {
    if (!user) {
      return null;
    }

    return (
      user.providerData.find((provider) => provider.providerId === 'google.com') ??
      user.providerData.find((provider) => provider.providerId !== 'firebase') ??
      null
    );
  }
}
