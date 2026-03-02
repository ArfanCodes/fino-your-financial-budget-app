import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CategoriesScreen } from '../screens/app/CategoriesScreen';
import { AddCategoryScreen } from '../screens/app/AddCategoryScreen';
import type { CategoriesStackParamList } from '../types';
import { Colors } from '../utils/constants';

const Stack = createNativeStackNavigator<CategoriesStackParamList>();

export const CategoriesNavigator: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: Colors.background },
      animation: 'slide_from_right',
    }}
  >
    <Stack.Screen name="CategoryList" component={CategoriesScreen} />
    <Stack.Screen name="AddCategory" component={AddCategoryScreen} />
  </Stack.Navigator>
);
