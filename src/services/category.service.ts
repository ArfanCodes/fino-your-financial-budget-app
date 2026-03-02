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
} from 'firebase/firestore';
import type { Category } from '../types';

// ─── Category Service ──────────────────────────────────────────────────────────

export const categoryService = {
  /**
   * Fetch all categories for the current user, ordered by name.
   */
  async fetchCategories(): Promise<{ data: Category[]; error: string | null }> {
    try {
      const user = auth.currentUser;
      if (!user) return { data: [], error: 'Not authenticated' };

      const categoriesRef = collection(db, 'categories');
      const q = query(
        categoriesRef,
        where('user_id', '==', user.uid),
        orderBy('name', 'asc')
      );

      const querySnapshot = await getDocs(q);
      const categories = querySnapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Category[];

      return { data: categories, error: null };
    } catch (error: any) {
      return { data: [], error: error.message };
    }
  },

  /**
   * Create a new category for the current user.
   */
  async createCategory(
    name: string,
    color: string
  ): Promise<{ data: Category | null; error: string | null }> {
    try {
      const user = auth.currentUser;
      if (!user) return { data: null, error: 'Not authenticated' };

      const categoriesRef = collection(db, 'categories');
      const newDoc = await addDoc(categoriesRef, {
        name: name.trim(),
        color,
        user_id: user.uid,
        created_at: serverTimestamp(),
      });

      return {
        data: { id: newDoc.id, name: name.trim(), color, user_id: user.uid } as Category,
        error: null,
      };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  /**
   * Delete a category by id.
   * Verifies ownership client-side (defense-in-depth; Firestore rules are the real guard).
   */
  async deleteCategory(id: string): Promise<string | null> {
    try {
      const user = auth.currentUser;
      if (!user) return 'Not authenticated';

      const docRef = doc(db, 'categories', id);
      const snap = await getDoc(docRef);

      if (!snap.exists()) return 'Category not found';
      if (snap.data().user_id !== user.uid) return 'Permission denied';

      await deleteDoc(docRef);
      return null;
    } catch (error: any) {
      return error.message;
    }
  },
};
