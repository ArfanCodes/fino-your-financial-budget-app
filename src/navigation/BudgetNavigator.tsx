import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { CategoriesScreen } from "../screens/app/CategoriesScreen";
import { AddCategoryScreen } from "../screens/app/AddCategoryScreen";
import { BudgetScreen } from "../screens/app/BudgetScreen";
import type { BudgetStackParamList } from "../types";
import { Colors } from "../utils/constants";

const Stack = createNativeStackNavigator<BudgetStackParamList>();

// ─── Budget Navigator ─────────────────────────────────────────────────────────
export const BudgetNavigator: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: Colors.background },
      animation: "slide_from_right",
    }}
  >
    <Stack.Screen name="BudgetHome" component={BudgetScreen} />
    <Stack.Screen name="CategoryList" component={CategoriesScreen} />
    <Stack.Screen name="AddCategory" component={AddCategoryScreen} />
  </Stack.Navigator>
);
