// ─── Auth Types ────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  created_at: string;
}

// ─── Form Types ────────────────────────────────────────────────────────────────
export interface LoginFormValues {
  email: string;
  password: string;
}

export interface SignupFormValues {
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
};

export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
};

export type TabParamList = {
  Dashboard: undefined;
  ExpensesTab: undefined;
  Budget: undefined;
  Analytics: undefined;
  Settings: undefined;
};

// ─── Expenses Stack (nested inside Expenses tab) ───────────────────────────────
export type ExpensesStackParamList = {
  ExpenseList: undefined;
  AddExpense: { expenseId?: string } | undefined;
};

// ─── Categories Stack (legacy — kept for type compat) ────────────────────────
export type CategoriesStackParamList = {
  CategoryList: undefined;
  AddCategory: undefined;
};

// ─── Settings Stack (Settings tab: Settings home → Categories → Add) ──────────
export type SettingsStackParamList = {
  SettingsHome: undefined;
  CategoryList: undefined;
  AddCategory: { fromAddExpense?: boolean } | undefined;
};

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
  category_id: string | null;
  monthly_limit: number;
}
