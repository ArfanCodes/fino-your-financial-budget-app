import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useFinanceStore } from "../../store/finance.store";
import { useBudgetStatus } from "../../hooks/useBudgetStatus";
import {
  Colors,
  FontSize,
  FontWeight,
  Radius,
  Spacing,
  TAB_BAR_HEIGHT,
} from "../../utils/constants";
import { formatCurrency } from "../../utils/helpers";

// ─── Stat Tile ────────────────────────────────────────────────────────────────
interface StatTileProps {
  label: string;
  value: string;
  accent?: string;
  icon: React.ComponentProps<typeof Feather>["name"];
}

const StatTile: React.FC<StatTileProps> = ({ label, value, accent = Colors.primary, icon }) => (
  <View style={[tileStyles.tile, { borderColor: `${accent}30` }]}>
    <View style={[tileStyles.iconWrap, { backgroundColor: `${accent}15` }]}>
      <Feather name={icon} size={15} color={accent} />
    </View>
    <Text style={tileStyles.value} numberOfLines={1}>{value}</Text>
    <Text style={tileStyles.label}>{label}</Text>
  </View>
);

const tileStyles = StyleSheet.create({
  tile: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.xs,
    alignItems: "flex-start",
    minWidth: 100,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  value: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  label: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
  },
});

// ─── Recommendation Card ──────────────────────────────────────────────────────
interface RecommendationProps {
  icon: React.ComponentProps<typeof Feather>["name"];
  title: string;
  subtitle: string;
  accent?: string;
}

const RecommendationCard: React.FC<RecommendationProps> = ({
  icon,
  title,
  subtitle,
  accent = Colors.primary,
}) => (
  <View style={[recStyles.card, { borderColor: `${accent}25` }]}>
    <View style={[recStyles.iconWrap, { backgroundColor: `${accent}15` }]}>
      <Feather name={icon} size={16} color={accent} />
    </View>
    <View style={recStyles.text}>
      <Text style={recStyles.title}>{title}</Text>
      <Text style={recStyles.subtitle}>{subtitle}</Text>
    </View>
  </View>
);

const recStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },
  text: { flex: 1, gap: 3 },
  title: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    letterSpacing: -0.1,
  },
  subtitle: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    lineHeight: 17,
  },
});

// ─── Category Breakdown Row ───────────────────────────────────────────────────
interface CategoryBreakdownRowProps {
  name: string;
  color: string;
  spent: number;
  totalSpent: number;
  rank: number;
}

const CategoryBreakdownRow: React.FC<CategoryBreakdownRowProps> = ({
  name,
  color,
  spent,
  totalSpent,
  rank,
}) => {
  const pct = totalSpent > 0 ? (spent / totalSpent) * 100 : 0;
  return (
    <View style={cbStyles.row}>
      <View style={cbStyles.left}>
        <View style={[cbStyles.rankBadge, { backgroundColor: `${color}20` }]}>
          <Text style={[cbStyles.rank, { color }]}>{rank}</Text>
        </View>
        <View style={[cbStyles.dot, { backgroundColor: color }]} />
        <Text style={cbStyles.name} numberOfLines={1}>{name}</Text>
      </View>
      <View style={cbStyles.right}>
        <Text style={cbStyles.spent}>{formatCurrency(spent)}</Text>
        <Text style={[cbStyles.pct, { color }]}>{pct.toFixed(0)}%</Text>
      </View>
    </View>
  );
};

const cbStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.surfaceBorder,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
  rankBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  rank: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  name: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: FontWeight.medium,
    flex: 1,
  },
  right: {
    alignItems: "flex-end",
    gap: 2,
    flexShrink: 0,
  },
  spent: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  pct: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
});

// ─── Recovery Screen ──────────────────────────────────────────────────────────
export const RecoveryScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const categories = useFinanceStore((s) => s.categories);

  const {
    state,
    totalLimit,
    totalSpent,
    remainingBudget,
    overBudgetAmount,
    daysRemaining,
    dailyAllowedSpend,
    topCategoryId,
    topCategoryName,
    topCategorySpent,
    categorySpentMap,
  } = useBudgetStatus();

  // ── Category lookup map (memoized) ──────────────────────────────────────────
  const categoryMap = useMemo(() => {
    const m = new Map<string, { name: string; color: string }>();
    categories.forEach((c) => m.set(c.id, { name: c.name, color: c.color }));
    return m;
  }, [categories]);

  // ── Top 3 spending categories ─────────────────────────────────────────────
  const topCategories = useMemo(() => {
    return Array.from(categorySpentMap.entries())
      .map(([id, spent]) => ({
        id,
        spent,
        name: categoryMap.get(id)?.name ?? "Unknown",
        color: categoryMap.get(id)?.color ?? Colors.primary,
      }))
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 3);
  }, [categorySpentMap, categoryMap]);

  // ── Smart recommendations ─────────────────────────────────────────────────
  const recommendations = useMemo(() => {
    const recs: RecommendationProps[] = [];

    if (topCategoryId && topCategorySpent > 0) {
      recs.push({
        icon: "tag",
        title: `Reduce ${topCategoryName} spending`,
        subtitle: `You spent ${formatCurrency(topCategorySpent)} on ${topCategoryName} this month — your highest category. Look for ways to cut back here first.`,
        accent: Colors.warning,
      });
    }

    if (daysRemaining > 0 && dailyAllowedSpend > 0) {
      recs.push({
        icon: "calendar",
        title: "Daily spending target",
        subtitle: `Limit yourself to ${formatCurrency(dailyAllowedSpend)}/day for the remaining ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} to get back on track.`,
        accent: Colors.info,
      });
    } else if (state === "emergency") {
      recs.push({
        icon: "pause-circle",
        title: "Consider deferring non-essentials",
        subtitle: "You've exceeded this month's budget. Pause discretionary purchases until next month resets.",
        accent: Colors.danger,
      });
    }

    recs.push({
      icon: "pie-chart",
      title: "Review category budgets",
      subtitle: "Setting per-category limits gives you finer control and early warnings before you overshoot.",
      accent: Colors.accent,
    });

    return recs;
  }, [
    topCategoryId,
    topCategoryName,
    topCategorySpent,
    daysRemaining,
    dailyAllowedSpend,
    state,
  ]);

  const isEmergency = state === "emergency";
  const accentColor = isEmergency ? Colors.danger : Colors.warning;

  return (
    <View style={screenStyles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      {/* ── Header ── */}
      <View style={[screenStyles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={screenStyles.backBtn}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Feather name="arrow-left" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={screenStyles.headerCenter}>
          <Text style={screenStyles.headerTitle}>Recovery Plan</Text>
          <Text style={screenStyles.headerSub}>
            {isEmergency ? "Budget exceeded" : "Approaching limit"}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          screenStyles.scrollContent,
          { paddingBottom: insets.bottom + TAB_BAR_HEIGHT + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Status Banner ─────────────────────────────────────────────────── */}
        <View
          style={[
            screenStyles.statusBanner,
            { borderColor: `${accentColor}35`, backgroundColor: `${accentColor}0D` },
          ]}
        >
          <View style={[screenStyles.statusIconWrap, { backgroundColor: `${accentColor}20` }]}>
            <Feather
              name={isEmergency ? "alert-triangle" : "alert-circle"}
              size={20}
              color={accentColor}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[screenStyles.statusTitle, { color: accentColor }]}>
              {isEmergency
                ? `₹${Math.round(overBudgetAmount).toLocaleString("en-IN")} over budget`
                : `${Math.round((totalSpent / totalLimit) * 100)}% of budget used`}
            </Text>
            <Text style={screenStyles.statusSub}>
              {isEmergency
                ? "Your spending has exceeded this month's limit"
                : `${formatCurrency(remainingBudget)} remaining of ${formatCurrency(totalLimit)}`}
            </Text>
          </View>
        </View>

        {/* ── Budget Summary Tiles ──────────────────────────────────────────── */}
        <Text style={screenStyles.sectionTitle}>Budget Summary</Text>
        <View style={screenStyles.tilesRow}>
          <StatTile
            icon="trending-up"
            label="Total Spent"
            value={formatCurrency(totalSpent)}
            accent={isEmergency ? Colors.danger : Colors.warning}
          />
          <StatTile
            icon="credit-card"
            label="Monthly Limit"
            value={formatCurrency(totalLimit)}
            accent={Colors.primary}
          />
        </View>
        <View style={[screenStyles.tilesRow, { marginTop: Spacing.sm }]}>
          {isEmergency ? (
            <StatTile
              icon="alert-triangle"
              label="Over Budget"
              value={formatCurrency(overBudgetAmount)}
              accent={Colors.danger}
            />
          ) : (
            <StatTile
              icon="check-circle"
              label="Remaining"
              value={formatCurrency(remainingBudget)}
              accent={Colors.success}
            />
          )}
          <StatTile
            icon="calendar"
            label="Days Left"
            value={`${daysRemaining} day${daysRemaining !== 1 ? "s" : ""}`}
            accent={Colors.info}
          />
        </View>

        {/* ── Daily Guidance ────────────────────────────────────────────────── */}
        {daysRemaining > 0 && (
          <>
            <Text style={screenStyles.sectionTitle}>Daily Guidance</Text>
            <View style={screenStyles.guidanceCard}>
              <View style={screenStyles.guidanceLeft}>
                <Text style={screenStyles.guidanceLabel}>To recover, limit to</Text>
                <Text style={screenStyles.guidanceAmount}>
                  {dailyAllowedSpend > 0
                    ? formatCurrency(Math.round(dailyAllowedSpend))
                    : "₹0"}
                  <Text style={screenStyles.guidanceUnit}> / day</Text>
                </Text>
                <Text style={screenStyles.guidanceSub}>
                  for the next {daysRemaining} day{daysRemaining !== 1 ? "s" : ""}
                </Text>
              </View>
              <View style={screenStyles.guidanceIconBox}>
                <Feather name="target" size={28} color={Colors.primary} />
              </View>
            </View>
          </>
        )}

        {/* ── Category Breakdown ────────────────────────────────────────────── */}
        {topCategories.length > 0 && (
          <>
            <Text style={screenStyles.sectionTitle}>Top Spending Categories</Text>
            <View style={screenStyles.card}>
              {topCategories.map((cat, i) => (
                <CategoryBreakdownRow
                  key={cat.id}
                  name={cat.name}
                  color={cat.color}
                  spent={cat.spent}
                  totalSpent={totalSpent}
                  rank={i + 1}
                />
              ))}
            </View>
          </>
        )}

        {/* ── Recommendations ───────────────────────────────────────────────── */}
        <Text style={screenStyles.sectionTitle}>Smart Recommendations</Text>
        {recommendations.map((rec, i) => (
          <RecommendationCard key={i} {...rec} />
        ))}
      </ScrollView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const screenStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.surfaceBorder,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  headerSub: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statusIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  statusTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    letterSpacing: -0.2,
  },
  statusSub: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textMuted,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  tilesRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  guidanceCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  guidanceLeft: {
    flex: 1,
    gap: 3,
  },
  guidanceLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  guidanceAmount: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  guidanceUnit: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  guidanceSub: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  guidanceIconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: `${Colors.primary}15`,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    overflow: "hidden",
  },
});
