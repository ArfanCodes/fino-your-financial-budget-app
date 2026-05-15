import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, ViewStyle } from "react-native";
import { Colors } from "../utils/constants";

/**
 * Animated shimmer placeholder. Pulses a single neutral surface color via
 * native-driver opacity (cheap on the JS thread). Use composed pieces to
 * mimic the shape of upcoming content.
 */
interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: ViewStyle;
  /** Stagger the pulse so a column of skeletons doesn't blink in unison. */
  delay?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = "100%",
  height = 14,
  radius = 8,
  style,
  delay = 0,
}) => {
  const opacity = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 750,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.55,
          duration: 750,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity, delay]);

  return (
    <Animated.View
      style={[
        styles.base,
        { width: width as never, height, borderRadius: radius, opacity },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.surfaceElevated,
  },
});

/* ─── Pre-composed skeleton shapes ─────────────────────────────────────────── */

/** Mimics a transaction row card (Dashboard / Spend list). */
export const TransactionRowSkeleton: React.FC<{ index?: number }> = ({
  index = 0,
}) => (
  <View style={preset.txnCard}>
    <Skeleton width={46} height={46} radius={14} delay={index * 80} />
    <View style={preset.txnInfo}>
      <Skeleton width="60%" height={14} radius={6} delay={index * 80 + 50} />
      <Skeleton width="40%" height={11} radius={6} delay={index * 80 + 80} />
    </View>
    <View style={preset.txnRight}>
      <Skeleton width={60} height={14} radius={6} delay={index * 80 + 60} />
      <Skeleton width={36} height={10} radius={5} delay={index * 80 + 90} />
    </View>
  </View>
);

/** Mimics a budget category row card. */
export const BudgetRowSkeleton: React.FC<{ index?: number }> = ({
  index = 0,
}) => (
  <View style={preset.budgetCard}>
    <View style={preset.budgetTop}>
      <Skeleton width={42} height={42} radius={13} delay={index * 80} />
      <View style={preset.budgetInfo}>
        <Skeleton
          width="55%"
          height={14}
          radius={6}
          delay={index * 80 + 50}
        />
        <Skeleton
          width="40%"
          height={11}
          radius={6}
          delay={index * 80 + 80}
        />
      </View>
      <View style={preset.budgetRight}>
        <Skeleton width={70} height={14} radius={6} delay={index * 80 + 60} />
        <Skeleton width={36} height={10} radius={5} delay={index * 80 + 90} />
      </View>
    </View>
    <Skeleton
      width="100%"
      height={6}
      radius={99}
      style={{ marginTop: 12 }}
      delay={index * 80 + 120}
    />
  </View>
);

/** Three small white pill placeholders (used under hero cards). */
export const StatPillsSkeleton: React.FC = () => (
  <View style={preset.statsRow}>
    {[0, 1, 2].map((i) => (
      <View key={i} style={preset.statPill}>
        <Skeleton width="55%" height={18} radius={6} delay={i * 80} />
        <Skeleton
          width="80%"
          height={11}
          radius={5}
          style={{ marginTop: 6 }}
          delay={i * 80 + 50}
        />
      </View>
    ))}
  </View>
);

const preset = StyleSheet.create({
  txnCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 0,
  },
  txnInfo: { flex: 1, gap: 6 },
  txnRight: { alignItems: "flex-end", gap: 6 },

  budgetCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 0,
  },
  budgetTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  budgetInfo: { flex: 1, gap: 6 },
  budgetRight: { alignItems: "flex-end", gap: 6, flexShrink: 0 },

  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  statPill: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 0,
  },
});
