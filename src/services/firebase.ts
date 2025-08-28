import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your Firebase configuration object
// You'll get this from Firebase Console > Project Settings > General > Your apps
const firebaseConfig = {
  apiKey: "AIzaSyA1U9nJgk2IlYYL-TLazmrcvxcwGvrVG4s",
  authDomain: "jj-ai-platform.firebaseapp.com",
  projectId: "jj-ai-platform",
  storageBucket: "jj-ai-platform.firebasestorage.app",
  messagingSenderId: "308405783967",
  appId: "1:308405783967:web:40a3fbdb903262092dc1aa",
  measurementId: "G-P3PFKHR81H"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
// Initialize Firestore
export const db = getFirestore(app);

// Initialize providers
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();

// Configure providers
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

githubProvider.setCustomParameters({
  prompt: 'select_account'
});

export default app; 