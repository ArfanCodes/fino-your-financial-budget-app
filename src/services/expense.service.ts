import { db, auth } from './firebase';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import type { Expense } from '../types';

// ─── Expense Service ───────────────────────────────────────────────────────────

export const expenseService = {
  /**
   * Fetch all expenses for the current user.
   * Ordered by date desc, then created_at desc.
   */
  async fetchExpenses(): Promise<{ data: Expense[]; error: string | null }> {
    try {
      const user = auth.currentUser;
      if (!user) return { data: [], error: 'Not authenticated' };

      const expensesRef = collection(db, 'expenses');
      const q = query(
        expensesRef,
        where('user_id', '==', user.uid),
        orderBy('date', 'desc'),
        orderBy('created_at', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const expenses = querySnapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          // Normalize Firestore Timestamp → ISO string so the UI never sees a Timestamp object
          date: data.date instanceof Timestamp ? data.date.toDate().toISOString() : data.date,
          created_at:
            data.created_at instanceof Timestamp
              ? data.created_at.toDate().toISOString()
              : (data.created_at ?? new Date().toISOString()),
        };
      }) as Expense[];

      return { data: expenses, error: null };
    } catch (error: any) {
      console.error('[Firebase Firestore] fetchExpenses error:', error);
      return { data: [], error: error.message };
    }
  },

  /**
   * Fetch expenses for a specific month only.
   * Uses string-based date comparison (YYYY-MM-DD format).
   */
  async fetchExpensesForMonth(
    year: number,
    month: number
  ): Promise<{ data: Expense[]; error: string | null }> {
    try {
      const user = auth.currentUser;
      if (!user) return { data: [], error: 'Not authenticated' };

      // Pad month to 2 digits
      const m = String(month).padStart(2, '0');
      const start = `${year}-${m}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const end = `${year}-${m}-${String(lastDay).padStart(2, '0')}`;

      const expensesRef = collection(db, 'expenses');
      const q = query(
        expensesRef,
        where('user_id', '==', user.uid),
        where('date', '>=', start),
        where('date', '<=', end),
        orderBy('date', 'desc'),
        orderBy('created_at', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const expenses = querySnapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Expense[];

      return { data: expenses, error: null };
    } catch (error: any) {
      return { data: [], error: error.message };
    }
  },

  /**
   * Create a new expense.
   */
  async createExpense(payload: {
    category_id: string | null;
    amount: number;
    date: string;
    note: string | null;
    payment_method: Expense['payment_method'];
  }): Promise<{ data: Expense | null; error: string | null }> {
    try {
      const user = auth.currentUser;
      if (!user) return { data: null, error: 'Not authenticated' };

      const now = new Date().toISOString();
      const expensesRef = collection(db, 'expenses');
      const newDoc = await addDoc(expensesRef, {
        ...payload,
        user_id: user.uid,
        created_at: serverTimestamp(),
      });

      return {
        data: {
          id: newDoc.id,
          ...payload,
          user_id: user.uid,
          // Use a local timestamp for the in-memory object; the server value will
          // be correct when the next fetchExpenses() call is made.
          created_at: now,
        } as Expense,
        error: null,
      };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  /**
   * Delete an expense by id.
   * Verifies ownership client-side (defense-in-depth; Firestore rules are the real guard).
   */
  async deleteExpense(id: string): Promise<string | null> {
    try {
      const user = auth.currentUser;
      if (!user) return 'Not authenticated';

      const docRef = doc(db, 'expenses', id);
      const snap = await getDoc(docRef);

      if (!snap.exists()) return 'Expense not found';
      if (snap.data().user_id !== user.uid) return 'Permission denied';

      await deleteDoc(docRef);
      return null;
    } catch (error: any) {
      return error.message;
    }
  },
};
