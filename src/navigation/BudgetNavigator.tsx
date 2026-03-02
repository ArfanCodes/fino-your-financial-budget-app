import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { CategoriesScreen } from "../screens/app/CategoriesScreen";
import { AddCategoryScreen } from "../screens/app/AddCategoryScreen";
import { Feather } from "@expo/vector-icons";
import type { BudgetStackParamList } from "../types";
import { Colors, FontSize, FontWeight, Spacing } from "../utils/constants";

const Stack = createNativeStackNavigator<BudgetStackParamList>();

// ─── Budget Home Placeholder ──────────────────────────────────────────────────
const BudgetHomeScreen: React.FC = () => (
  <View style={styles.container}>
    <Feather name="pie-chart" size={32} color={Colors.textMuted} />
    <Text style={styles.title}>Budget</Text>
    <Text style={styles.subtitle}>Coming soon</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
});

// ─── Budget Navigator ─────────────────────────────────────────────────────────
export const BudgetNavigator: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: Colors.background },
      animation: "slide_from_right",
    }}
  >
    <Stack.Screen name="BudgetHome" component={BudgetHomeScreen} />
    <Stack.Screen name="CategoryList" component={CategoriesScreen} />
    <Stack.Screen name="AddCategory" component={AddCategoryScreen} />
  </Stack.Navigator>
);
