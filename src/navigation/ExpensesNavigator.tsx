import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ExpensesScreen } from "../screens/app/ExpensesScreen";
import { AddExpenseScreen } from "../screens/app/AddExpenseScreen";
import { CategoriesScreen } from "../screens/app/CategoriesScreen";
import { AddCategoryScreen } from "../screens/app/AddCategoryScreen";
import type { TransactionsStackParamList } from "../types";
import { Colors } from "../utils/constants";

const Stack = createNativeStackNavigator<TransactionsStackParamList>();

export const ExpensesNavigator: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: Colors.background },
      animation: "fade",
      animationDuration: 260,
    }}
  >
    <Stack.Screen name="ExpenseList" component={ExpensesScreen} />
    <Stack.Screen name="AddExpense" component={AddExpenseScreen} />
    <Stack.Screen name="CategoryList" component={CategoriesScreen} />
    <Stack.Screen name="AddCategory" component={AddCategoryScreen} />
  </Stack.Navigator>
);
