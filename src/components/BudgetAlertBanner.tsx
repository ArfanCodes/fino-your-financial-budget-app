import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors, FontSize, FontWeight, Radius, Spacing } from "../utils/constants";
import { formatCurrency } from "../utils/helpers";
import type { BudgetAlertState } from "../hooks/useBudgetStatus";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface BudgetAlertBannerProps {
  state: BudgetAlertState;
  overBudgetAmount: number;
  remainingBudget: number;
  onPress: () => void;
}

// ─── Theme per state ───────────────────────────────────────────────────────────
const THEME = {
  warning: {
    borderColor: `${Colors.warning}45`,
    bg: `${Colors.warning}0C`,
    iconBg: `${Colors.warning}18`,
    icon: "alert-circle" as const,
    iconColor: Colors.warning,
    primaryText: "Approaching budget limit",
  },
  emergency: {
    borderColor: `${Colors.danger}40`,
    bg: `${Colors.danger}09`,
    iconBg: `${Colors.danger}18`,
    icon: "alert-triangle" as const,
    iconColor: Colors.danger,
    primaryText: "Budget exceeded",
  },
} as const;

// ─── Banner Component ─────────────────────────────────────────────────────────
export const BudgetAlertBanner: React.FC<BudgetAlertBannerProps> = React.memo(
  ({ state, overBudgetAmount, remainingBudget, onPress }) => {
    if (state === "safe") return null;

    const theme = THEME[state];

    const contextValue =
      state === "emergency"
        ? `${formatCurrency(overBudgetAmount)} over budget`
        : `${formatCurrency(remainingBudget)} remaining`;

    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.75}
        style={[
          styles.banner,
          { backgroundColor: theme.bg, borderColor: theme.borderColor },
        ]}
      >
        {/* Left: icon */}
        <View style={[styles.iconWrap, { backgroundColor: theme.iconBg }]}>
          <Feather name={theme.icon} size={16} color={theme.iconColor} />
        </View>

        {/* Center: text */}
        <View style={styles.textBlock}>
          <View style={styles.topRow}>
            <Text style={[styles.primaryText, { color: theme.iconColor }]}>
              {theme.primaryText}
            </Text>
            <Text style={[styles.valueBadge, { color: theme.iconColor }]}>
              {contextValue}
            </Text>
          </View>
          <Text style={styles.secondaryText}>
            View recovery plan and reduce spending
          </Text>
        </View>

        {/* Right: chevron */}
        <Feather name="chevron-right" size={16} color={Colors.textMuted} />
      </TouchableOpacity>
    );
  }
);

BudgetAlertBanner.displayName = "BudgetAlertBanner";

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flexWrap: "wrap",
  },
  primaryText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    letterSpacing: -0.1,
  },
  valueBadge: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    opacity: 0.85,
  },
  secondaryText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    lineHeight: 15,
  },
});
