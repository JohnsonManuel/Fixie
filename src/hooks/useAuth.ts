import { useState, useEffect } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,

} from 'firebase/auth';
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { auth, googleProvider, githubProvider } from '../services/firebase';
import { AuthError } from '../types';

const db = getFirestore();

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signUpAdmin = async (email: string, password: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;

    // send verification
    await sendEmailVerification(user);

    // Firestore record
    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      role: "admin",
      verified: false,
      profileComplete: false,
      createdAt: new Date().toISOString(),
    });

    return user;
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string) => {
    try {
      setError(null);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      return result;
    } catch (err: any) {
      const authError: AuthError = {
        code: err.code,
        message: err.message
      };
      setError(authError);
      throw authError;
    }
  };

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result;
    } catch (err: any) {
      const authError: AuthError = {
        code: err.code,
        message: err.message
      };
      setError(authError);
      throw authError;
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      setError(null);
      const result = await signInWithPopup(auth, googleProvider);
      return result;
    } catch (err: any) {
      const authError: AuthError = {
        code: err.code,
        message: err.message
      };
      setError(authError);
      throw authError;
    }
  };

  // Sign in with GitHub
  const signInWithGithub = async () => {
    try {
      setError(null);
      const result = await signInWithPopup(auth, githubProvider);
      return result;
    } catch (err: any) {
      const authError: AuthError = {
        code: err.code,
        message: err.message
      };
      setError(authError);
      throw authError;
    }
  };

  // Sign out
  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
    } catch (err: any) {
      const authError: AuthError = {
        code: err.code,
        message: err.message
      };
      setError(authError);
      throw authError;
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  return {
    user,
    loading,
    error,
    signUp,
    signIn,
    signInWithGoogle,
    signInWithGithub,
    logout,
    clearError,
    signUpAdmin
  };
}; 