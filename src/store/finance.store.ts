import { create } from "zustand";
import { auth } from "../services/firebase";
import { categoryService } from "../services/category.service";
import { expenseService } from "../services/expense.service";
import type { Category, Expense } from "../types";

// ─── State Shape ───────────────────────────────────────────────────────────────
interface FinanceStore {
  // ── Data
  categories: Category[];
  expenses: Expense[];

  // ── Loading flags (granular to avoid blocking unrelated UI)
  categoriesLoading: boolean;
  expensesLoading: boolean;

  // ── Error
  categoriesError: string | null;
  expensesError: string | null;

  // ── Actions: Categories
  fetchCategories: (force?: boolean) => Promise<void>;
  addCategory: (name: string, color: string) => Promise<string | null>;
  removeCategory: (id: string) => Promise<string | null>;

  // ── Actions: Expenses
  fetchExpenses: (force?: boolean) => Promise<void>;
  addExpense: (payload: {
    category_id: string | null;
    amount: number;
    date: string;
    note: string | null;
    payment_method: Expense["payment_method"];
  }) => Promise<string | null>;
  removeExpense: (id: string) => Promise<string | null>;

  // ── Utility
  clearFinanceErrors: () => void;
  resetFinance: () => void;
}

// ─── Finance Store ─────────────────────────────────────────────────────────────
export const useFinanceStore = create<FinanceStore>((set, get) => ({
  // ── Initial State
  categories: [],
  expenses: [],
  categoriesLoading: false,
  expensesLoading: false,
  categoriesError: null,
  expensesError: null,

  // ────────────────────────────────────────────────────────────────
  // CATEGORIES
  // ────────────────────────────────────────────────────────────────

  fetchCategories: async (force = false) => {
    // Skip network round-trip if data is already in memory and not forced
    if (!force && get().categories.length > 0) return;
    set({ categoriesLoading: true, categoriesError: null });
    const { data, error } = await categoryService.fetchCategories();
    set({ categories: data, categoriesLoading: false, categoriesError: error });
  },

  addCategory: async (name: string, color: string) => {
    const user = auth.currentUser;
    if (!user) return "Not authenticated";

    // Build optimistic item with a temp ID so UI updates instantly
    const tempId = `__opt_${Date.now()}`;
    const optimistic: Category = {
      id: tempId,
      name: name.trim(),
      color,
      user_id: user.uid,
    };
    set((state) => ({
      categories: [...state.categories, optimistic].sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    }));

    // Write in background — don't block the caller
    categoryService.createCategory(name, color).then(({ data, error }) => {
      if (error) {
        // Rollback optimistic item and surface error
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== tempId),
          categoriesError: error,
        }));
      } else {
        // Swap temp ID for the real Firestore ID
        set((state) => ({
          categories: state.categories.map((c) =>
            c.id === tempId ? data! : c,
          ),
        }));
      }
    });

    return null; // Caller gets null immediately → screen navigates back at once
  },

  removeCategory: async (id: string) => {
    const error = await categoryService.deleteCategory(id);
    if (error) return error;
    // Remove from local state immediately (optimistic)
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== id),
      // Also clear from expenses for correct UI reflection
      expenses: state.expenses.map((e) =>
        e.category_id === id ? { ...e, category_id: "" } : e,
      ),
    }));
    return null;
  },

  // ────────────────────────────────────────────────────────────────
  // EXPENSES
  // ────────────────────────────────────────────────────────────────

  fetchExpenses: async (force = false) => {
    // Skip network round-trip if data is already in memory and not forced
    if (!force && get().expenses.length > 0) return;
    set({ expensesLoading: true, expensesError: null });
    const { data, error } = await expenseService.fetchExpenses();
    set({ expenses: data, expensesLoading: false, expensesError: error });
  },

  addExpense: async (payload) => {
    const user = auth.currentUser;
    if (!user) return "Not authenticated";

    // Build optimistic item with a temp ID so UI updates instantly
    const tempId = `__opt_${Date.now()}`;
    const optimistic: Expense = {
      id: tempId,
      ...payload,
      category_id: payload.category_id ?? "",
      user_id: user.uid,
      created_at: new Date().toISOString(),
    };
    set((state) => ({ expenses: [optimistic, ...state.expenses] }));

    // Write in background — don't block the caller
    expenseService.createExpense(payload).then(({ data, error }) => {
      if (error) {
        // Rollback optimistic item and surface error
        set((state) => ({
          expenses: state.expenses.filter((e) => e.id !== tempId),
          expensesError: error,
        }));
      } else {
        // Swap temp ID for the real Firestore ID
        set((state) => ({
          expenses: state.expenses.map((e) => (e.id === tempId ? data! : e)),
        }));
      }
    });

    return null; // Caller gets null immediately → screen navigates back at once
  },

  removeExpense: async (id: string) => {
    const error = await expenseService.deleteExpense(id);
    if (error) return error;
    set((state) => ({
      expenses: state.expenses.filter((e) => e.id !== id),
    }));
    return null;
  },

  // ────────────────────────────────────────────────────────────────
  // UTILITY
  // ────────────────────────────────────────────────────────────────

  clearFinanceErrors: () => set({ categoriesError: null, expensesError: null }),

  // Called on sign out so next user gets a clean slate
  resetFinance: () =>
    set({
      categories: [],
      expenses: [],
      categoriesLoading: false,
      expensesLoading: false,
      categoriesError: null,
      expensesError: null,
    }),
}));

// ─── Selectors ─────────────────────────────────────────────────────────────────
// Use these in components to prevent unnecessary re-renders.

export const selectCategories = (
  s: ReturnType<typeof useFinanceStore.getState>,
) => s.categories;
export const selectExpenses = (
  s: ReturnType<typeof useFinanceStore.getState>,
) => s.expenses;
export const selectCategoriesLoading = (
  s: ReturnType<typeof useFinanceStore.getState>,
) => s.categoriesLoading;
export const selectExpensesLoading = (
  s: ReturnType<typeof useFinanceStore.getState>,
) => s.expensesLoading;

/** Returns total spent this month from local expense state (no extra DB call) */
export const selectCurrentMonthTotal = (
  s: ReturnType<typeof useFinanceStore.getState>,
) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  return s.expenses
    .filter((e) => {
      const d = new Date(e.date);
      return d.getFullYear() === year && d.getMonth() === month;
    })
    .reduce((sum, e) => sum + Number(e.amount), 0);
};

/**
 * NOTE: Don't use selectors that return new arrays (like .slice, .filter).
 * Instead, select the full list and use useMemo in your component,
 * or use useShallow from 'zustand/react/shallow'.
 */
