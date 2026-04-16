// ─── Auth Types ────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  created_at: string;
}

// ─── Form Types ────────────────────────────────────────────────────────────────
export interface LoginFormValues {
  email: string;
  password: string;
}

export interface SignupFormValues {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AddExpenseFormValues {
  amount: string;
  category_id: string;
  date: string;
  note: string;
  payment_method: PaymentMethod;
}

export interface AddCategoryFormValues {
  name: string;
  color: string;
}

// ─── PaymentMethod (kept near form types for reference) ───────────────────────
export type PaymentMethod = "cash" | "card" | "upi" | "bank_transfer" | "other";

// ─── Navigation Types ──────────────────────────────────────────────────────────
export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Signup: undefined;
};

export type AppStackParamList = {
  MainTabs: undefined;
  Settings: undefined;
  Recovery: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
};

export type TabParamList = {
  Overview: undefined;
  TransactionsTab: undefined;
  BudgetTab: undefined;
  Analytics: undefined;
};

// ─── Transactions Stack (Transactions tab: list → add → categories) ───────────
export type TransactionsStackParamList = {
  ExpenseList: undefined;
  AddExpense: { expenseId?: string } | undefined;
  CategoryList: undefined;
  AddCategory: { fromAddExpense?: boolean } | undefined;
};

// ─── Budget Stack (Budget tab: home → categories) ────────────────────────────
export type BudgetStackParamList = {
  BudgetHome: undefined;
  CategoryList: undefined;
  AddCategory: { fromAddExpense?: boolean } | undefined;
};

// ─── Categories Stack (shared type for Categories + AddCategory screens) ──────
export type CategoriesStackParamList = {
  CategoryList: undefined;
  AddCategory: { fromAddExpense?: boolean } | undefined;
};

// ─── Settings Stack (modal: Settings only) ────────────────────────────────────
export type SettingsStackParamList = {
  SettingsHome: undefined;
};

// ─── Expenses Stack (kept as alias for backward compat) ───────────────────────
export type ExpensesStackParamList = TransactionsStackParamList;

// ─── Category Types ────────────────────────────────────────────────────────────
export interface Category {
  id: string;
  user_id: string;
  name: string;
  color: string;
}

// ─── Expense Types ─────────────────────────────────────────────────────────────

export interface Expense {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  date: string;
  note: string | null;
  payment_method: PaymentMethod;
  created_at: string;
}

// ─── Budget Types ──────────────────────────────────────────────────────────────
export interface Budget {
  id: string;
  user_id: string;
  /** null → "total" monthly budget; non-null → per-category budget */
  category_id: string | null;
  monthly_limit: number;
  /** YYYY-MM format, e.g. "2026-03" */
  month: string;
}

export interface BudgetFormValues {
  monthly_limit: string;
  category_id: string | null;
}
