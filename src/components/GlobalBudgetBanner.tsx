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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBudgetStatus } from "../hooks/useBudgetStatus";
import { useEmergencyMode } from "../context/EmergencyModeContext";
import { Colors, FontSize, FontWeight, Spacing, Radius } from "../utils/constants";
import { formatCurrency } from "../utils/helpers";
import type { NavigationProp } from "@react-navigation/native";
import type { AppStackParamList } from "../types";

/**
 * Pinned banner rendered as absolute overlay at the TOP of every tab screen.
 * Visible whenever budget reaches warning (≥80%) or emergency (≥100%) state.
 * Returns null when budget is safe or not set.
 */
export const GlobalBudgetBanner: React.FC = () => {
  const budgetStatus = useBudgetStatus();
  const { isEmergencyModeActive } = useEmergencyMode();
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();
  const insets = useSafeAreaInsets();

  const flashAnim = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (budgetStatus.state !== "safe") {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(flashAnim, { toValue: 0.25, duration: 600, useNativeDriver: true }),
          Animated.timing(flashAnim, { toValue: 1,    duration: 600, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [budgetStatus.state]);

  if (budgetStatus.state === "safe" || !budgetStatus.hasBudget) return null;

  const isEmergency = budgetStatus.state === "emergency";
  const accent = isEmergency ? Colors.danger : Colors.warning;
  const bgColor = isEmergency ? "#200000" : "#1e1200";

  const label = isEmergency
    ? `${formatCurrency(budgetStatus.overBudgetAmount)} over budget`
    : `${Math.round(budgetStatus.usageRatio * 100)}% of budget used`;

  const sub = isEmergency
    ? isEmergencyModeActive
      ? "Emergency mode active · tap to view recovery plan"
      : "Budget exceeded · tap to enter emergency mode"
    : `${formatCurrency(budgetStatus.remainingBudget)} remaining this month`;

  return (
    <TouchableOpacity
      style={[
        bannerStyles.banner,
        {
          top: insets.top,        // pin to status bar bottom
          backgroundColor: bgColor,
          borderBottomColor: `${accent}50`,
        },
      ]}
      onPress={() => navigation.navigate("Recovery")}
      activeOpacity={0.85}
    >
      <Animated.View
        style={[
          bannerStyles.iconWrap,
          { backgroundColor: `${accent}20`, opacity: flashAnim },
        ]}
      >
        <Feather
          name={isEmergency ? "alert-triangle" : "alert-circle"}
          size={15}
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

      <Feather name="chevron-right" size={15} color={accent} />
    </TouchableOpacity>
  );
};

const bannerStyles = StyleSheet.create({
  banner: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 999,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1.5,
    gap: Spacing.sm,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  text: {
    flex: 1,
    gap: 1,
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
