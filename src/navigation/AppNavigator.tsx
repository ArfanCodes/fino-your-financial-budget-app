import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, Text, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { DashboardScreen } from "../screens/app/DashboardScreen";
import { ExpensesNavigator } from "./ExpensesNavigator";
import { BudgetNavigator } from "./BudgetNavigator";
import { SettingsNavigator } from "./SettingsNavigator";
import { RecoveryScreen } from "../screens/app/RecoveryScreen";
import type { TabParamList, AppStackParamList } from "../types";
import {
  Colors,
  FontSize,
  FontWeight,
  Spacing,
  TAB_BAR_HEIGHT,
} from "../utils/constants";

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<AppStackParamList>();

// ─── Icon map — Feather names per route ───────────────────────────────────────
type FeatherIconName = React.ComponentProps<typeof Feather>["name"];

const TAB_ICONS: Record<keyof TabParamList, FeatherIconName> = {
  Overview: "home",
  TransactionsTab: "credit-card",
  BudgetTab: "pie-chart",
  Analytics: "bar-chart-2",
};

// ─── Analytics Placeholder ────────────────────────────────────────────────────
const AnalyticsPlaceholder: React.FC = () => (
  <View style={placeholder.container}>
    <Feather name="bar-chart-2" size={32} color={Colors.textMuted} />
    <Text style={placeholder.text}>Analytics</Text>
    <Text style={placeholder.sub}>Coming soon</Text>
  </View>
);

const placeholder = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  text: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  sub: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
});

// ─── Main Bottom Tabs ──────────────────────────────────────────────────────────
const MainTabs: React.FC = () => {
  const insets = useSafeAreaInsets();
  const tabBarHeight = TAB_BAR_HEIGHT + insets.bottom;

  return (
    <Tab.Navigator
      initialRouteName="Overview"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          {
            height: tabBarHeight,
            paddingBottom:
              (Platform.OS === "ios" ? Spacing.md : Spacing.sm) + insets.bottom,
          },
        ],
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
        tabBarIcon: ({ color }) => (
          <Feather
            name={TAB_ICONS[route.name as keyof TabParamList]}
            size={20}
            color={color}
          />
        ),
      })}
    >
      <Tab.Screen
        name="Overview"
        component={DashboardScreen}
        options={{ tabBarLabel: "Overview" }}
      />
      <Tab.Screen
        name="TransactionsTab"
        component={ExpensesNavigator}
        options={{ tabBarLabel: "Transactions" }}
      />
      <Tab.Screen
        name="BudgetTab"
        component={BudgetNavigator}
        options={{ tabBarLabel: "Budget" }}
      />
      <Tab.Screen
        name="Analytics"
        component={AnalyticsPlaceholder}
        options={{ tabBarLabel: "Analytics" }}
      />
    </Tab.Navigator>
  );
};

// ─── App Navigator (Stack: tabs + Settings modal + Recovery) ─────────────────
export const AppNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MainTabs" component={MainTabs} />
    <Stack.Screen
      name="Settings"
      component={SettingsNavigator}
      options={{
        presentation: "modal",
        animation: "slide_from_bottom",
        contentStyle: { backgroundColor: Colors.background },
      }}
    />
    <Stack.Screen
      name="Recovery"
      component={RecoveryScreen}
      options={{
        animation: "slide_from_right",
        contentStyle: { backgroundColor: Colors.background },
      }}
    />
  </Stack.Navigator>
);

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.surfaceBorder,
    paddingTop: Spacing.sm,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    marginTop: 2,
  },
  tabItem: {
    paddingTop: Spacing.xs,
  },
});
