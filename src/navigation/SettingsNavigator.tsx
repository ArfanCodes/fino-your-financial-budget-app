import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SettingsScreen } from '../screens/app/SettingsScreen';
import { CategoriesScreen } from '../screens/app/CategoriesScreen';
import { AddCategoryScreen } from '../screens/app/AddCategoryScreen';
import type { SettingsStackParamList } from '../types';
import { Colors } from '../utils/constants';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

// ─── Settings Navigator ────────────────────────────────────────────────────────
// Settings home → Manage Categories → Add Category
export const SettingsNavigator: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: Colors.background },
      animation: 'slide_from_right',
    }}
  >
    <Stack.Screen name="SettingsHome" component={SettingsScreen} />
    <Stack.Screen name="CategoryList" component={CategoriesScreen} />
    <Stack.Screen name="AddCategory" component={AddCategoryScreen} />
  </Stack.Navigator>
);
