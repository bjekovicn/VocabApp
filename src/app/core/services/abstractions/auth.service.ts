import { Signal } from '@angular/core';
import { User } from 'firebase/auth';

export abstract class AuthService {
  public abstract readonly user: Signal<User | null>;
  public abstract readonly isReady: Signal<boolean>;
  public abstract readonly isBusy: Signal<boolean>;
  public abstract readonly isAuthenticated: Signal<boolean>;
  public abstract readonly isAnonymous: Signal<boolean>;
  public abstract readonly displayName: Signal<string | null>;
  public abstract readonly email: Signal<string | null>;
  public abstract readonly photoUrl: Signal<string | null>;
  public abstract readonly errorMessage: Signal<string | null>;

  public abstract initialize(): Promise<void>;
  public abstract signInWithGoogle(): Promise<void>;
  public abstract signOut(): Promise<void>;
}
