import { auth, db } from "./firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import type { LoginFormValues, SignupFormValues, User } from "../types";

const fetchUserData = async (uid: string): Promise<{ username: string; avatar_url?: string }> => {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists()) {
      const data = snap.data();
      return { username: data.username ?? "", avatar_url: data.avatar_url };
    }
  } catch (e) {
    console.warn("[Auth] Failed to fetch user data:", e);
  }
  return { username: "" };
};

// Map Firebase User to our App User type
const mapUser = async (user: FirebaseUser): Promise<User> => {
  const { username, avatar_url } = await fetchUserData(user.uid);
  return {
    id: user.uid,
    email: user.email!,
    username,
    avatar_url,
    created_at: user.metadata.creationTime || new Date().toISOString(),
  };
};

export const authService = {
  /**
   * Sign in with email and password.
   */
  async signIn(
    values: LoginFormValues,
  ): Promise<{ user: User | null; error: string | null }> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        values.email.trim().toLowerCase(),
        values.password,
      );

      return {
        user: await mapUser(userCredential.user),
        error: null,
      };
    } catch (err: any) {
      console.error("[Firebase Auth] signIn error:", err);
      // Simplify Firebase error messages
      let message = err.message || "An unexpected error occurred.";
      if (err.code === "auth/invalid-credential")
        message = "Invalid email or password.";
      if (err.code === "auth/user-not-found")
        message = "No user found with this email.";
      if (err.code === "auth/wrong-password") message = "Incorrect password.";
      if (err.code === "auth/network-request-failed")
        message = "Network error. Please check your internet connection.";
      return { user: null, error: message };
    }
  },

  /**
   * Sign up with email and password.
   */
  async signUp(
    values: SignupFormValues,
  ): Promise<{
    user: User | null;
    error: string | null;
    needsConfirmation: boolean;
  }> {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email.trim().toLowerCase(),
        values.password,
      );

      // Save username to Firestore users collection
      await setDoc(doc(db, "users", userCredential.user.uid), {
        username: values.username.trim(),
        email: values.email.trim().toLowerCase(),
        created_at: new Date().toISOString(),
      });

      // Firebase automatically logs in the user after signup, so we don't need manual email confirmation routing yet.
      return {
        user: await mapUser(userCredential.user),
        error: null,
        needsConfirmation: false,
      };
    } catch (err: any) {
      console.error("[Firebase Auth] signUp error:", err);
      let message = err.message || "An unexpected error occurred.";
      if (err.code === "auth/email-already-in-use")
        message = "An account already exists with this email.";
      if (err.code === "auth/weak-password") message = "Password is too weak.";
      if (err.code === "auth/network-request-failed")
        message = "Network error. Please check your internet connection.";
      return { user: null, error: message, needsConfirmation: false };
    }
  },

  /**
   * Sign out the current user.
   */
  async signOut(): Promise<string | null> {
    try {
      await firebaseSignOut(auth);
      return null;
    } catch (err: any) {
      return err.message || "Failed to sign out";
    }
  },

  /**
   * Get the current session (synced via async storage implicitly).
   */
  async getSession() {
    return auth.currentUser ? { user: await mapUser(auth.currentUser) } : null;
  },

  /**
   * Get current user from session.
   */
  async getCurrentUser(): Promise<User | null> {
    return auth.currentUser ? await mapUser(auth.currentUser) : null;
  },

  /**
   * Subscribe to auth state changes.
   */
  onAuthStateChange(callback: (user: User | null) => void) {
    // Return the unsubscribe function immediately
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        callback(await mapUser(firebaseUser));
      } else {
        callback(null);
      }
    });
  },

  /**
   * Update User Profile
   */
  async updateProfile(uid: string, username: string, avatar_url?: string): Promise<string | null> {
    try {
      await setDoc(doc(db, "users", uid), { username: username.trim(), avatar_url }, { merge: true });
      return null;
    } catch (err: any) {
      return err.message || "Failed to update profile";
    }
  },
};
