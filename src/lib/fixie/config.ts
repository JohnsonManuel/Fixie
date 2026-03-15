// Fixie dashboard configuration
// Set REACT_APP_FIXIE_API_BASE_URL in .env if the backend is on a different origin.
// Leave blank for same-origin (production default).

export const FIREBASE_CONFIG = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || 'AIzaSyA1U9nJgk2IlYYL-TLazmrcvxcwGvrVG4s',
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'jj-ai-platform.firebaseapp.com',
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || 'jj-ai-platform',
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || 'jj-ai-platform.firebasestorage.app',
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '308405783967',
  appId: process.env.REACT_APP_FIREBASE_APP_ID || '1:308405783967:web:40a3fbdb903262092dc1aa',
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || 'G-P3PFKHR81H'
};

/** Login page route within this app. */
export const LOGIN_SITE_URL: string = '/login';

/** API base URL — empty means same origin. */
export const API_BASE = process.env.REACT_APP_FIXIE_API_BASE_URL ?? 'https://fixie-chat-308405783967.us-central1.run.app';
