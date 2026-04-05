import { initializeApp, getApps } from 'firebase/app';
import { getAuth, onAuthStateChanged, signOut as fbSignOut, User as FbUser } from 'firebase/auth';
import { FIREBASE_CONFIG, LOGIN_SITE_URL } from './config';

export function redirectToLogin(): void {
  window.location.href = LOGIN_SITE_URL;
}

export async function signOutAndRedirect(): Promise<void> {
  try {
    if (getApps().length) {
      await fbSignOut(getAuth());
    }
  } catch { /* ignore */ }
  redirectToLogin();
}

/**
 * Subscribe to Firebase auth state. Returns an unsubscribe function.
 * Uses the existing Firebase app (already initialised by JJAI) if available.
 */
export function initAuth(
  onFbUser: (user: FbUser) => void,
  onNoAuth: () => void,
): () => void {
  if (!getApps().length) {
    initializeApp(FIREBASE_CONFIG);
  }
  const auth = getAuth();
  let unsub: (() => void) | null = null;

  // authStateReady() resolves only after Firebase has fully restored auth state
  // from storage — prevents false null → redirect on page refresh.
  auth.authStateReady().then(() => {
    unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        onFbUser(user);
      } else {
        onNoAuth();
      }
    });
  });

  return () => { if (unsub) unsub(); };
}
