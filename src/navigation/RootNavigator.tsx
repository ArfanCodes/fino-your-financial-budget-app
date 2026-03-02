import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/auth.store';
import { AuthNavigator } from './AuthNavigator';
import { AppNavigator } from './AppNavigator';
import { ScreenLoader } from '../components/ScreenLoader';
import { Colors } from '../utils/constants';
import type { RootStackParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();

// ─── Root Navigator ─────────────────────────────────────────────────────────────
// This is the critical gatekeeper — checks auth state and renders
// Auth or App stack accordingly. Flicker-free because we wait for
// isInitialized before rendering any stack.
export const RootNavigator: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, []);

  // Block render until session is restored from AsyncStorage.
  // This prevents the flicker where auth screens flash before
  // the app realizes the user is already logged in.
  if (!isInitialized) {
    return <ScreenLoader message="Loading FinTrack..." />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'fade',
        animationDuration: 300,
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
