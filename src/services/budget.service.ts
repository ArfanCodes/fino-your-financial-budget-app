import { db, auth } from './firebase';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import type { Budget } from '../types';

// ─── Budget Service ────────────────────────────────────────────────────────────
//
// Firestore collection: "budgets"
// Schema per document:
//   userId        : string
//   categoryId    : string | null   (null = total monthly budget)
//   monthlyLimit  : number
//   month         : string          (YYYY-MM)
//   createdAt     : Timestamp
//   updatedAt     : Timestamp
//
// Unique constraint enforced in service: one doc per (userId, categoryId, month).

export const budgetService = {
  /**
   * Fetch all budgets for the current user for a given month.
   * @param month - YYYY-MM string, e.g. "2026-03"
   */
  async fetchBudgets(
    month: string
  ): Promise<{ data: Budget[]; error: string | null }> {
    try {
      const user = auth.currentUser;
      if (!user) return { data: [], error: 'Not authenticated' };

      const budgetsRef = collection(db, 'budgets');
      const q = query(
        budgetsRef,
        where('userId', '==', user.uid),
        where('month', '==', month)
      );

      const snapshot = await getDocs(q);
      const budgets = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          user_id: data.userId,
          category_id: data.categoryId ?? null,
          monthly_limit: data.monthlyLimit,
          month: data.month,
        } as Budget;
      });

      return { data: budgets, error: null };
    } catch (err: any) {
      console.error('[budgetService] fetchBudgets error:', err);
      return { data: [], error: err.message };
    }
  },

  /**
   * Create or update a budget.
   * If a budget already exists for this (userId, categoryId, month), it is
   * updated in-place; otherwise a new document is created.  This gives
   * idempotent "set" semantics without requiring a composite index on the
   * combination or a separate check.
   *
   * @param categoryId - null for the total monthly budget
   * @param monthlyLimit - the spending limit
   * @param month - YYYY-MM
   * @returns The persisted Budget object, or an error string
   */
  async createOrUpdateBudget(
    categoryId: string | null,
    monthlyLimit: number,
    month: string
  ): Promise<{ data: Budget | null; error: string | null }> {
    try {
      const user = auth.currentUser;
      if (!user) return { data: null, error: 'Not authenticated' };

      const budgetsRef = collection(db, 'budgets');

      // Try to find an existing doc for this slot
      const q = query(
        budgetsRef,
        where('userId', '==', user.uid),
        where('categoryId', '==', categoryId),
        where('month', '==', month)
      );
      const existing = await getDocs(q);

      if (!existing.empty) {
        // Update existing
        const docRef = doc(db, 'budgets', existing.docs[0].id);
        await updateDoc(docRef, {
          monthlyLimit,
          updatedAt: serverTimestamp(),
        });
        return {
          data: {
            id: existing.docs[0].id,
            user_id: user.uid,
            category_id: categoryId,
            monthly_limit: monthlyLimit,
            month,
          },
          error: null,
        };
      }

      // Create new
      const newDoc = await addDoc(budgetsRef, {
        userId: user.uid,
        categoryId,
        monthlyLimit,
        month,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return {
        data: {
          id: newDoc.id,
          user_id: user.uid,
          category_id: categoryId,
          monthly_limit: monthlyLimit,
          month,
        },
        error: null,
      };
    } catch (err: any) {
      console.error('[budgetService] createOrUpdateBudget error:', err);
      return { data: null, error: err.message };
    }
  },

  /**
   * Delete a budget document by id.
   * Verifies ownership before deleting.
   */
  async deleteBudget(id: string): Promise<string | null> {
    try {
      const user = auth.currentUser;
      if (!user) return 'Not authenticated';

      const docRef = doc(db, 'budgets', id);
      const snap = await getDoc(docRef);

      if (!snap.exists()) return 'Budget not found';
      if (snap.data().userId !== user.uid) return 'Permission denied';

      await deleteDoc(docRef);
      return null;
    } catch (err: any) {
      console.error('[budgetService] deleteBudget error:', err);
      return err.message;
    }
  },
};
