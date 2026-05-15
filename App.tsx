import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { RootNavigator } from './src/navigation/RootNavigator';
import { EmergencyModeProvider, useEmergencyMode } from './src/context/EmergencyModeContext';
import { Colors } from './src/utils/constants';

// ─── Inner shell: reads emergency context to shift NavigationContainer theme ──
const AppShell: React.FC = () => {
  const { isEmergencyModeActive } = useEmergencyMode();

  return (
    <>
      <StatusBar
        style={isEmergencyModeActive ? "light" : "dark"}
        backgroundColor={isEmergencyModeActive ? '#0d0101' : Colors.background}
      />
      <NavigationContainer
        theme={{
          dark: true,
          colors: {
            // Emergency: deep blood-red tones. Normal: standard dark theme.
            primary:      isEmergencyModeActive ? '#ff2020'  : Colors.primary,
            background:   isEmergencyModeActive ? '#0d0101'  : Colors.background,
            card:         isEmergencyModeActive ? '#1a0202'  : Colors.surface,
            text:         Colors.textPrimary,
            border:       isEmergencyModeActive ? '#400505'  : Colors.surfaceBorder,
            notification: isEmergencyModeActive ? '#ff2020'  : Colors.primary,
          },
          fonts: {
            regular: { fontFamily: 'System', fontWeight: '400' },
            medium:  { fontFamily: 'System', fontWeight: '500' },
            bold:    { fontFamily: 'System', fontWeight: '700' },
            heavy:   { fontFamily: 'System', fontWeight: '900' },
          },
        }}
      >
        <RootNavigator />
      </NavigationContainer>
    </>
  );
};

// ─── Root export ───────────────────────────────────────────────────────────────
export default function App() {
  return (
    // Use the brand background so the very first paint (before any RN
    // content renders) matches the splash — eliminates the brief dark
    // flash on cold boot.
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.background }}>
      <SafeAreaProvider>
        <EmergencyModeProvider>
          <AppShell />
        </EmergencyModeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
