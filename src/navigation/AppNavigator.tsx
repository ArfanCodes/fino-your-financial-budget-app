import React, { useRef, useEffect } from "react";
import { createBottomTabNavigator, BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  View,
  StyleSheet,
  Pressable,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { DashboardScreen } from "../screens/app/DashboardScreen";
import { ExpensesNavigator } from "./ExpensesNavigator";
import { BudgetNavigator } from "./BudgetNavigator";
import { SettingsNavigator } from "./SettingsNavigator";
import { RecoveryScreen } from "../screens/app/RecoveryScreen";
import { AnalyticsScreen } from "../screens/app/AnalyticsScreen";
import type { TabParamList, AppStackParamList } from "../types";
import { Colors } from "../utils/constants";

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<AppStackParamList>();

type FeatherIconName = React.ComponentProps<typeof Feather>["name"];

const TAB_CONFIG: Record<
  keyof TabParamList,
  { icon: FeatherIconName; label: string; accent: string }
> = {
  Overview:        { icon: "home",        label: "Home",   accent: "#818CF8" },
  TransactionsTab: { icon: "credit-card", label: "Spend",  accent: "#2DD4BF" },
  BudgetTab:       { icon: "pie-chart",   label: "Budget", accent: "#FBB024" },
  Analytics:       { icon: "bar-chart-2", label: "Stats",  accent: "#F472B6" },
};

// ─── Nav Tab (Capsule Pill Item) ──────────────────────────────────────────────
const NavTab: React.FC<{
  icon: FeatherIconName;
  label: string;
  accent: string;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
}> = ({ icon, label, accent, isFocused, onPress, onLongPress }) => {
  const anim = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: isFocused ? 1 : 0,
      useNativeDriver: false, // Animating layout bounds
      tension: 100,
      friction: 14,
    }).start();
  }, [isFocused]);

  const textMaxWidth = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 80],
  });

  const textOpacity = anim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, 0, 1],
  });

  const marginLeft = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 8],
  });

  const paddingH = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [12, 18],
  });

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityState={{ selected: isFocused }}
    >
      <Animated.View
        style={[
          styles.tabPill,
          {
            paddingHorizontal: paddingH,
          },
        ]}
      >
        {/* Background pill (fades in cleanly over layout) */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: `${accent}25`, borderRadius: 22, opacity: anim },
          ]}
        />

        <Feather
          name={icon}
          size={20}
          color={isFocused ? accent : Colors.textMuted}
        />
        
        <Animated.View
          style={{ overflow: "hidden", maxWidth: textMaxWidth, marginLeft }}
        >
          <Animated.Text
            numberOfLines={1}
            style={[styles.tabLabel, { color: accent, opacity: textOpacity }]}
          >
            {label}
          </Animated.Text>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
};

// ─── Custom Tab Bar Container ─────────────────────────────────────────────────
const CustomTabBar = ({ state, descriptors, navigation, insets }: BottomTabBarProps & { insets: any }) => {
  return (
    <View style={[styles.tabBarContainer, { bottom: Math.max(insets.bottom, 16) }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const cfg = TAB_CONFIG[route.name as keyof TabParamList];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: "tabLongPress",
            target: route.key,
          });
        };

        return (
          <NavTab
            key={route.key}
            icon={cfg.icon}
            label={cfg.label}
            accent={cfg.accent}
            isFocused={isFocused}
            onPress={onPress}
            onLongPress={onLongPress}
          />
        );
      })}
    </View>
  );
};

// ─── Main Tabs ────────────────────────────────────────────────────────────────
const MainTabs: React.FC = () => {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        initialRouteName="Overview"
        tabBar={(props) => <CustomTabBar {...props} insets={insets} />}
        screenOptions={{
          headerShown: false,
          sceneContainerStyle: { backgroundColor: Colors.background },
        }}
      >
        <Tab.Screen name="Overview"        component={DashboardScreen}   />
        <Tab.Screen name="TransactionsTab" component={ExpensesNavigator} />
        <Tab.Screen name="BudgetTab"       component={BudgetNavigator}   />
        <Tab.Screen name="Analytics"       component={AnalyticsScreen}   />
      </Tab.Navigator>
    </View>
  );
};

// ─── App Navigator ────────────────────────────────────────────────────────────
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

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  tabBarContainer: {
    position: "absolute",
    left: 20,
    right: 20,
    height: 64,
    backgroundColor: Colors.surface,
    borderRadius: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    
    // Shadow to float beautifully over content
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2, // Slightly lighter shadow for a neon theme
    shadowRadius: 10,
    elevation: 10,
    
    // Subtle border for premium feel
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  tabPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 44,
    borderRadius: 22,
    position: "relative",
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});
