import React, { useEffect, useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuthStore } from "../store/auth.store";
import { useFinanceStore } from "../store/finance.store";
import { AuthNavigator } from "./AuthNavigator";
import { AppNavigator } from "./AppNavigator";
import { SplashScreen } from "../components/SplashScreen";
import { Colors } from "../utils/constants";
import type { RootStackParamList } from "../types";

const Stack = createNativeStackNavigator<RootStackParamList>();

// Minimum splash hold so the initial mount jitter (auth restore → tab
// nav warm-up → first data fetch) finishes behind the splash and the
// user only sees a single clean fade from splash → app.
const MIN_SPLASH_MS = 750;

// ─── Root Navigator ─────────────────────────────────────────────────────────────
export const RootNavigator: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const initialize = useAuthStore((s) => s.initialize);
  const fetchCategories = useFinanceStore((s) => s.fetchCategories);
  const fetchExpenses = useFinanceStore((s) => s.fetchExpenses);

  const [minHoldDone, setMinHoldDone] = useState(false);

  useEffect(() => {
    initialize();
    const t = setTimeout(() => setMinHoldDone(true), MIN_SPLASH_MS);
    return () => clearTimeout(t);
  }, [initialize]);

  // Prefetch the two most-used datasets as soon as auth resolves to a
  // logged-in user. The store no-ops if data is already cached, so this
  // is safe to call freely. By the time the splash fades, the dashboard
  // has data ready and skips the empty → populated flash.
  useEffect(() => {
    if (isInitialized && user) {
      fetchCategories();
      fetchExpenses();
    }
  }, [isInitialized, user, fetchCategories, fetchExpenses]);

  // Hold the splash until BOTH auth has resolved AND the minimum hold
  // window has elapsed. This masks the initial layout pass.
  if (!isInitialized || !minHoldDone) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: "fade",
        animationDuration: 320,
      }}
    >
      {user ? (
        <Stack.Screen name="App" component={AppNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
};
