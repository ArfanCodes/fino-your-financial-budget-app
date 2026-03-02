import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Text, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { DashboardScreen } from "../screens/app/DashboardScreen";
import { ExpensesNavigator } from "./ExpensesNavigator";
import { SettingsNavigator } from "./SettingsNavigator";
import type { TabParamList } from "../types";
import {
  Colors,
  FontSize,
  FontWeight,
  Spacing,
  TAB_BAR_HEIGHT,
} from "../utils/constants";

const Tab = createBottomTabNavigator<TabParamList>();

// ─── Icon map — Feather names per route ───────────────────────────────────────
type FeatherIconName = React.ComponentProps<typeof Feather>["name"];

const TAB_ICONS: Record<keyof TabParamList, FeatherIconName> = {
  Dashboard: "home",
  ExpensesTab: "credit-card",
  Budget: "pie-chart",
  Analytics: "bar-chart-2",
  Settings: "settings",
};

// ─── Placeholder ──────────────────────────────────────────────────────────────
const PlaceholderScreen: React.FC<{ name: string }> = ({ name }) => (
  <View style={placeholder.container}>
    <Text style={placeholder.text}>{name}</Text>
    <Text style={placeholder.sub}>Coming soon</Text>
  </View>
);

const placeholder = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  sub: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
});

// ─── App Tab Navigator ─────────────────────────────────────────────────────────
export const AppNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();
  const tabBarHeight = TAB_BAR_HEIGHT + insets.bottom;

  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
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
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarLabel: "Home" }}
      />
      <Tab.Screen
        name="ExpensesTab"
        component={ExpensesNavigator}
        options={{ tabBarLabel: "Expenses" }}
      />
      <Tab.Screen name="Budget" options={{ tabBarLabel: "Budget" }}>
        {() => <PlaceholderScreen name="Budget" />}
      </Tab.Screen>
      <Tab.Screen name="Analytics" options={{ tabBarLabel: "Analytics" }}>
        {() => <PlaceholderScreen name="Analytics" />}
      </Tab.Screen>
      <Tab.Screen
        name="Settings"
        component={SettingsNavigator}
        options={{ tabBarLabel: "Settings" }}
      />
    </Tab.Navigator>
  );
};

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
