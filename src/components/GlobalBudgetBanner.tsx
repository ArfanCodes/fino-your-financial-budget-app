import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useBudgetStatus } from "../hooks/useBudgetStatus";
import { useEmergencyMode } from "../context/EmergencyModeContext";
import { Colors, FontSize, FontWeight, Spacing } from "../utils/constants";
import { formatCurrency } from "../utils/helpers";
import type { NavigationProp } from "@react-navigation/native";
import type { AppStackParamList } from "../types";

/**
 * Sticky banner shown at the BOTTOM of the tab bar area (above the tabs)
 * whenever the budget is at warning (≥80%) or emergency (≥100%) state.
 * Renders null when budget is safe or not set.
 */
export const GlobalBudgetBanner: React.FC = () => {
  const budgetStatus = useBudgetStatus();
  const { isEmergencyModeActive } = useEmergencyMode();
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();

  const flashAnim = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (budgetStatus.state !== "safe") {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(flashAnim, { toValue: 0.2, duration: 700, useNativeDriver: true }),
          Animated.timing(flashAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [budgetStatus.state]);

  // Don't show if safe, or if already in full emergency mode screen
  if (budgetStatus.state === "safe" || !budgetStatus.hasBudget) return null;

  const isEmergency = budgetStatus.state === "emergency";
  const accent = isEmergency ? Colors.danger : Colors.warning;

  const label = isEmergency
    ? `⚠ ${formatCurrency(budgetStatus.overBudgetAmount)} over budget`
    : `${Math.round(budgetStatus.usageRatio * 100)}% of budget used`;

  const sub = isEmergency
    ? isEmergencyModeActive
      ? "Emergency mode active · view recovery plan"
      : "Tap to enter emergency mode"
    : `${formatCurrency(budgetStatus.remainingBudget)} remaining this month`;

  return (
    <TouchableOpacity
      style={[
        bannerStyles.banner,
        {
          backgroundColor: isEmergency ? "#1a0000" : "#1a0e00",
          borderTopColor: `${accent}60`,
        },
      ]}
      onPress={() => navigation.navigate("Recovery")}
      activeOpacity={0.85}
    >
      <Animated.View style={[bannerStyles.iconWrap, { backgroundColor: `${accent}20`, opacity: flashAnim }]}>
        <Feather
          name={isEmergency ? "alert-triangle" : "alert-circle"}
          size={16}
          color={accent}
        />
      </Animated.View>
      <View style={bannerStyles.text}>
        <Text style={[bannerStyles.label, { color: accent }]} numberOfLines={1}>
          {label}
        </Text>
        <Text style={bannerStyles.sub} numberOfLines={1}>
          {sub}
        </Text>
      </View>
      <Feather name="chevron-right" size={16} color={accent} />
    </TouchableOpacity>
  );
};

const bannerStyles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderTopWidth: 1.5,
    gap: Spacing.sm,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    letterSpacing: -0.1,
  },
  sub: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
});
