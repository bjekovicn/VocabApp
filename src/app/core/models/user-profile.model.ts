export interface UserProfile {
  uid: string;
  isAnonymous: boolean;
  primaryProvider: 'anonymous' | 'google';
  providers: string[];
  email: string | null;
  displayName: string | null;
  photoUrl: string | null;
  createdAt: Date;
  lastLoginAt: Date;
  linkedAt: Date | null;
  upgradedFromAnonymous: boolean;
}
