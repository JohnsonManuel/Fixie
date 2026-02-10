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

import { getFirestore, doc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom"; // Keep this import
import { auth, googleProvider, githubProvider } from '../services/firebase';
import { AuthError } from '../types';

const db = getFirestore();

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  // FIX: Moved inside the Hook function to comply with ESLint rules
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signUpAdmin = async (email: string, password: string) => {
    console.log("=== ADMIN SIGNUP STARTED ===");
    console.log("Input email:", email);

    // Extract domain from email
    const domain = email.split("@")[1]?.toLowerCase();
    console.log("Extracted domain:", domain);

    if (!domain) {
      console.log("❌ Invalid email - no domain found");
      throw new Error("Invalid email address");
    }

    // Check 1: Does an organization already exist for this domain?
    console.log("\n--- CHECK 1: Organizations Collection ---");
    console.log("Querying: organizations where domain ==", domain);

    const orgsRef = collection(db, "organizations");
    const orgQuery = query(orgsRef, where("domain", "==", domain));
    const existingOrgs = await getDocs(orgQuery);

    console.log("Organizations found:", existingOrgs.size);
    existingOrgs.docs.forEach((doc) => {
      console.log("  - Org ID:", doc.id, "| Data:", doc.data());
    });

    if (!existingOrgs.empty) {
      console.log("❌ BLOCKED: Organization already exists for domain:", domain);
      throw new Error(
        "An admin has already registered for this organization. Please contact your existing administrator or sign up as a regular user."
      );
    }
    console.log("✅ Check 1 passed - No existing organization");

    // Check 2: Is there already an admin user with the same domain?
    // (Catches the case where admin signed up but hasn't logged in yet)
    const organizationKey = domain.split(".")[0];
    console.log("\n--- CHECK 2: Users Collection ---");
    console.log("Extracted organizationKey:", organizationKey);
    console.log("Querying: users where organizationKey ==", organizationKey);

    const usersRef = collection(db, "users");
    const adminQuery = query(
      usersRef,
      where("organizationKey", "==", organizationKey)
    );
    const usersWithSameOrg = await getDocs(adminQuery);

    console.log("Users found with this organizationKey:", usersWithSameOrg.size);
    usersWithSameOrg.docs.forEach((doc) => {
      const data = doc.data();
      console.log("  - User ID:", doc.id, "| Email:", data.email, "| Role:", data.role, "| OrgKey:", data.organizationKey);
    });

    // Filter for admins in code (avoids needing composite index)
    const existingAdmin = usersWithSameOrg.docs.find(
      (doc) => doc.data().role === "admin"
    );

    console.log("Existing admin found?", existingAdmin ? "YES" : "NO");

    if (existingAdmin) {
      const adminData = existingAdmin.data();
      console.log("❌ BLOCKED: Admin already exists:", adminData.email);
      throw new Error(
        "An admin has already registered for this organization. Please contact your existing administrator or sign up as a regular user."
      );
    }
    console.log("✅ Check 2 passed - No existing admin");

    console.log("\n--- PROCEEDING WITH SIGNUP ---");
    // Proceed with admin signup
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;
    console.log("✅ Firebase Auth user created:", user.uid);

    // Send verification email
    await sendEmailVerification(user);
    console.log("✅ Verification email sent to:", user.email);

    // Create Firestore user record (organizationKey already extracted above)
    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      role: "admin",
      verified: false,
      profileComplete: false,
      organizationKey,
      createdAt: new Date().toISOString(),
    });
    console.log("✅ Firestore user doc created with organizationKey:", organizationKey);
    console.log("=== ADMIN SIGNUP COMPLETE ===\n");

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
      // Don't set error for user-cancelled actions
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        throw err; // Re-throw without setting error state
      }
      
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
      // Don't set error for user-cancelled actions
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        throw err; // Re-throw without setting error state
      }
      
      const authError: AuthError = {
        code: err.code,
        message: err.message
      };
      setError(authError);
      throw authError;
    }
  };

  // Sign out logic
  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
      navigate("/"); 
    } catch (err: any) {
      const authError: AuthError = {
        code: err.code,
        message: err.message
      };
      setError(authError);
      throw authError;
    }
  };

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