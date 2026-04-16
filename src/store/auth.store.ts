import { create } from 'zustand';
import { authService } from '../services/auth.service';
import { useFinanceStore } from './finance.store';
import type { User, LoginFormValues, SignupFormValues } from '../types';

// Keep a module-level handle so initialize() is idempotent.
let _unsubscribeAuth: (() => void) | null = null;

// ─── State Shape ───────────────────────────────────────────────────────────────
interface AuthStore {
  // State
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  signIn: (values: LoginFormValues) => Promise<boolean>;
  signUp: (values: SignupFormValues) => Promise<{ success: boolean; needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
  updateProfile: (username: string, avatar_url?: string) => Promise<{ success: boolean; error: string | null }>;
  clearError: () => void;
}

// ─── Auth Store ────────────────────────────────────────────────────────────────
export const useAuthStore = create<AuthStore>((set, _get) => ({
  user: null,
  isLoading: false,
  isInitialized: false,
  error: null,

  /**
   * Called once on app start. Restores session from AsyncStorage.
   */
  initialize: async () => {
    // Guard: prevent stacking duplicate listeners on hot-reload / StrictMode double-invoke
    if (_unsubscribeAuth) {
      _unsubscribeAuth();
      _unsubscribeAuth = null;
    }

    // onAuthStateChanged fires immediately with the persisted user (from AsyncStorage).
    // We rely on that single event to set both `user` and `isInitialized`, which
    // eliminates the race between getCurrentUser() and the listener firing.
    _unsubscribeAuth = authService.onAuthStateChange((user) => {
      set({ user, isInitialized: true });
    });
  },

  signIn: async (values: LoginFormValues) => {
    set({ isLoading: true, error: null });
    const result = await authService.signIn(values);

    if (result.error) {
      set({ isLoading: false, error: result.error });
      return false;
    }

    set({ isLoading: false, user: result.user, error: null });
    return true;
  },

  signUp: async (values: SignupFormValues) => {
    set({ isLoading: true, error: null });
    const result = await authService.signUp(values);

    if (result.error) {
      set({ isLoading: false, error: result.error });
      return { success: false, needsConfirmation: false };
    }

    // If no email confirmation needed, set user immediately
    if (!result.needsConfirmation && result.user) {
      set({ isLoading: false, user: result.user, error: null });
    } else {
      set({ isLoading: false, error: null });
    }

    return { success: true, needsConfirmation: result.needsConfirmation };
  },

  signOut: async () => {
    set({ isLoading: true, error: null });
    await authService.signOut();
    // Clear all cached finance data so next user starts fresh
    useFinanceStore.getState().resetFinance();
    set({ isLoading: false, user: null, error: null });
  },

  updateProfile: async (username: string, avatar_url?: string) => {
    const s = _get();
    if (!s.user) return { success: false, error: "Not logged in" };
    set({ isLoading: true, error: null });
    const err = await authService.updateProfile(s.user.id, username, avatar_url ?? s.user.avatar_url);
    if (err) {
      set({ isLoading: false, error: err });
      return { success: false, error: err };
    }
    // Update local user state
    set({ isLoading: false, user: { ...s.user, username: username.trim(), avatar_url: avatar_url ?? s.user.avatar_url }, error: null });
    return { success: true, error: null };
  },

  clearError: () => set({ error: null }),
}));

// ─── Selectors (prevents unnecessary re-renders) ───────────────────────────────
export const selectUser = (s: ReturnType<typeof useAuthStore.getState>) => s.user;
export const selectIsLoading = (s: ReturnType<typeof useAuthStore.getState>) => s.isLoading;
export const selectIsInitialized = (s: ReturnType<typeof useAuthStore.getState>) => s.isInitialized;
export const selectError = (s: ReturnType<typeof useAuthStore.getState>) => s.error;
