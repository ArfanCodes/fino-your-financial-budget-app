import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ExpensesScreen } from '../screens/app/ExpensesScreen';
import { AddExpenseScreen } from '../screens/app/AddExpenseScreen';
import type { ExpensesStackParamList } from '../types';
import { Colors } from '../utils/constants';

const Stack = createNativeStackNavigator<ExpensesStackParamList>();

export const ExpensesNavigator: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: Colors.background },
      animation: 'slide_from_right',
    }}
  >
    <Stack.Screen name="ExpenseList" component={ExpensesScreen} />
    <Stack.Screen name="AddExpense" component={AddExpenseScreen} />
  </Stack.Navigator>
);
