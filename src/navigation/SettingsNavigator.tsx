import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SettingsScreen } from "../screens/app/SettingsScreen";
import type { SettingsStackParamList } from "../types";
import { Colors } from "../utils/constants";

const Stack = createNativeStackNavigator<SettingsStackParamList>();

// ─── Settings Navigator (modal stack) ─────────────────────────────────────────
export const SettingsNavigator: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: Colors.background },
      animation: "slide_from_bottom",
    }}
  >
    <Stack.Screen name="SettingsHome" component={SettingsScreen} />
  </Stack.Navigator>
);
