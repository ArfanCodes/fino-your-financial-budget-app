import { useMemo } from "react";
import { useFinanceStore } from "../store/finance.store";
import type { Budget, Category, Expense } from "../types";

// ─── Return shape ──────────────────────────────────────────────────────────────
export type BudgetAlertState = "safe" | "warning" | "emergency";

export interface BudgetStatus {
  /** "safe" | "warning" (≥80%) | "emergency" (≥100%) */
  state: BudgetAlertState;
  totalLimit: number;
  totalSpent: number;
  remainingBudget: number;
  /** positive value means over budget */
  overBudgetAmount: number;
  /** Calendar days left in the month including today */
  daysRemaining: number;
  /** How much can be spent per remaining day to stay within budget */
  dailyAllowedSpend: number;
  /** Usage ratio 0–n (can exceed 1.0) */
  usageRatio: number;
  /** Top category by spend this month */
  topCategoryId: string | null;
  topCategoryName: string;
  topCategorySpent: number;
  /** Per-category spending map for the selected month */
  categorySpentMap: Map<string, number>;
  /** Whether a total budget is defined */
  hasBudget: boolean;
}

/** YYYY-MM string for current month */
function currentMonthKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/**
 * Returns memoized budget status derived entirely from the existing
 * finance store state — does NOT trigger any additional fetches.
 */
export function useBudgetStatus(): BudgetStatus {
  const budgets = useFinanceStore((s) => s.budgets);
  const expenses = useFinanceStore((s) => s.expenses);
  const categories = useFinanceStore((s) => s.categories);

  return useMemo<BudgetStatus>(() => {
    const month = currentMonthKey();
    const [y, m] = month.split("-").map(Number);

    // ── Total monthly budget (category_id === null) ──────────────────────────
    const totalBudget: Budget | undefined = budgets.find(
      (b) => b.category_id === null && b.month === month
    );
    const totalLimit = totalBudget?.monthly_limit ?? 0;

    // ── Category lookup map ──────────────────────────────────────────────────
    const categoryMap = new Map<string, Category>();
    categories.forEach((c) => categoryMap.set(c.id, c));

    // ── Filter expenses for current month ────────────────────────────────────
    const monthExpenses = expenses.filter((e) => {
      const d = new Date(e.date);
      return d.getFullYear() === y && d.getMonth() + 1 === m;
    });

    // ── Total spent this month ───────────────────────────────────────────────
    const totalSpent = monthExpenses.reduce(
      (sum, e) => sum + Number(e.amount),
      0
    );

    // ── Per-category spending map ────────────────────────────────────────────
    const categorySpentMap = new Map<string, number>();
    monthExpenses.forEach((e) => {
      if (e.category_id) {
        categorySpentMap.set(
          e.category_id,
          (categorySpentMap.get(e.category_id) ?? 0) + Number(e.amount)
        );
      }
    });

    // ── Top spending category ────────────────────────────────────────────────
    let topCategoryId: string | null = null;
    let topCategorySpent = 0;
    categorySpentMap.forEach((amount, catId) => {
      if (amount > topCategorySpent) {
        topCategorySpent = amount;
        topCategoryId = catId;
      }
    });
    const topCategoryName = topCategoryId
      ? (categoryMap.get(topCategoryId)?.name ?? "Unknown")
      : "";

    // ── Remaining / over budget ──────────────────────────────────────────────
    const remainingBudget = totalLimit - totalSpent;
    const overBudgetAmount = totalSpent - totalLimit;
    const usageRatio = totalLimit > 0 ? totalSpent / totalLimit : 0;

    // ── Days remaining in current month ──────────────────────────────────────
    const now = new Date();
    const lastDay = new Date(y, m, 0).getDate(); // last day of month
    const daysRemaining = Math.max(lastDay - now.getDate() + 1, 0);

    // ── Daily allowed spend to stay on budget ─────────────────────────────
    const dailyAllowedSpend =
      daysRemaining > 0 && remainingBudget > 0
        ? remainingBudget / daysRemaining
        : 0;

    // ── Alert state ──────────────────────────────────────────────────────────
    let state: BudgetAlertState = "safe";
    if (totalLimit > 0) {
      if (usageRatio >= 1) state = "emergency";
      else if (usageRatio >= 0.8) state = "warning";
    }

    return {
      state,
      totalLimit,
      totalSpent,
      remainingBudget,
      overBudgetAmount,
      daysRemaining,
      dailyAllowedSpend,
      usageRatio,
      topCategoryId,
      topCategoryName,
      topCategorySpent,
      categorySpentMap,
      hasBudget: !!totalBudget,
    };
  }, [budgets, expenses, categories]);
}
