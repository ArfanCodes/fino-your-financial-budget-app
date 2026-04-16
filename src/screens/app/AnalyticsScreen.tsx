/**
 * AnalyticsScreen — Production-ready financial insights dashboard
 *
 * All charts are pure React Native Views (no external chart libs).
 * All calculations are memoized and isolated from render.
 * Uses FlatList-based scroll for performance.
 */

import React, { useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Animated,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { useFinanceStore } from "../../store/finance.store";
import {
  Colors,
  Spacing,
  FontSize,
  FontWeight,
  Radius,
  TAB_BAR_HEIGHT,
} from "../../utils/constants";
import { formatCurrency } from "../../utils/helpers";
import type { Expense } from "../../types";

const { width: SW } = Dimensions.get("window");
const H_PAD = 20;
const CHART_W = SW - H_PAD * 2;

// ─── Pure calculation helpers (outside component for perf) ─────────────────────

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function filterByMonth(
  expenses: Expense[],
  year: number,
  month: number, // 0-indexed
) {
  return expenses.filter((e) => {
    const d = new Date(e.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

function sumAmount(expenses: { amount: number }[]): number {
  return expenses.reduce((s, e) => s + Number(e.amount), 0);
}

// ─── Tiny reusable card wrapper ────────────────────────────────────────────────
const Card: React.FC<{ children: React.ReactNode; style?: object }> = ({
  children,
  style,
}) => <View style={[cardStyle.card, style]}>{children}</View>;
const cardStyle = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
  },
});

// ─── Section header ────────────────────────────────────────────────────────────
const SectionHeader: React.FC<{
  icon: string;
  title: string;
  sub?: string;
}> = ({ icon, title, sub }) => (
  <View style={sh.row}>
    <View style={sh.iconWrap}>
      <Feather name={icon as any} size={14} color={Colors.primary} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={sh.title}>{title}</Text>
      {sub ? <Text style={sh.sub}>{sub}</Text> : null}
    </View>
  </View>
);
const sh = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: `${Colors.primary}18`,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  sub: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.medium, marginTop: 1 },
});

// ─── Insight pill ──────────────────────────────────────────────────────────────
const InsightPill: React.FC<{
  text: string;
  type: "info" | "warn" | "good" | "neutral";
  index: number;
}> = React.memo(({ text, type, index }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const tx = useRef(new Animated.Value(12)).current;
  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        delay: index * 70,
        useNativeDriver: true,
      }),
      Animated.timing(tx, {
        toValue: 0,
        duration: 300,
        delay: index * 70,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  const accent =
    type === "warn"
      ? Colors.danger
      : type === "good"
        ? Colors.success
        : type === "info"
          ? Colors.primary
          : Colors.textSecondary;
  const icon =
    type === "warn"
      ? "alert-triangle"
      : type === "good"
        ? "trending-down"
        : type === "info"
          ? "zap"
          : "minus";
  return (
    <Animated.View
      style={[
        ipStyle.pill,
        {
          borderColor: `${accent}35`,
          opacity,
          transform: [{ translateX: tx }],
        },
      ]}
    >
      <View style={[ipStyle.dot, { backgroundColor: `${accent}25` }]}>
        <Feather name={icon as any} size={11} color={accent} />
      </View>
      <Text style={[ipStyle.text, { color: Colors.textSecondary }]}>
        {text}
      </Text>
    </Animated.View>
  );
});
InsightPill.displayName = "InsightPill";
const ipStyle = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: Radius.lg,
    borderWidth: 1,
    backgroundColor: Colors.surfaceElevated,
    marginBottom: 8,
  },
  dot: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  text: { flex: 1, fontSize: FontSize.sm, lineHeight: 19 },
});

// ─── Bar Chart (generic) ───────────────────────────────────────────────────────
const BAR_MAX_H = 80;

interface BarItem {
  label: string;
  value: number;
  highlight?: boolean;
}

const BarChart: React.FC<{ data: BarItem[]; color?: string }> = React.memo(
  ({ data, color = Colors.primary }) => {
    const max = Math.max(...data.map((d) => d.value), 1);
    return (
      <View style={bc.wrapper}>
        {data.map((item, i) => {
          const h = Math.max(
            (item.value / max) * BAR_MAX_H,
            item.value > 0 ? 4 : 2,
          );
          const c = item.highlight ? color : `${color}55`;
          return (
            <View key={i} style={bc.col}>
              <Text style={bc.val}>
                {item.value > 0
                  ? formatCurrency(item.value)
                      .replace("₹", "")
                      .replace(",", "k")
                      .slice(0, 5)
                  : ""}
              </Text>
              <View style={[bc.track, { height: BAR_MAX_H }]}>
                <View
                  style={[
                    bc.bar,
                    { height: h, backgroundColor: c, borderRadius: 5 },
                  ]}
                />
              </View>
              <Text
                style={[
                  bc.label,
                  item.highlight && {
                    color: color,
                    fontWeight: FontWeight.bold,
                  },
                ]}
              >
                {item.label}
              </Text>
            </View>
          );
        })}
      </View>
    );
  },
);
BarChart.displayName = "BarChart";
const bc = StyleSheet.create({
  wrapper: { flexDirection: "row", alignItems: "flex-end", gap: 4 },
  col: { flex: 1, alignItems: "center", gap: 4 },
  track: { width: "100%", justifyContent: "flex-end", alignItems: "center" },
  bar: { width: "80%" },
  label: { fontSize: 10, color: Colors.textSecondary, fontWeight: FontWeight.medium, textAlign: "center" },
  val: {
    fontSize: 9,
    color: Colors.textSecondary,
    fontWeight: FontWeight.bold,
    textAlign: "center",
    minHeight: 14,
  },
});

// ─── Category Row ──────────────────────────────────────────────────────────────
interface CatRow {
  name: string;
  color: string;
  amount: number;
  pct: number;
  prevPct?: number;
}

const CategoryRow: React.FC<{ cat: CatRow; rank: number }> = React.memo(
  ({ cat, rank }) => {
    const widthAnim = useRef(new Animated.Value(0)).current;
    React.useEffect(() => {
      Animated.timing(widthAnim, {
        toValue: cat.pct / 100,
        duration: 700,
        delay: rank * 100,
        useNativeDriver: false,
      }).start();
    }, [cat.pct]);
    const trend = cat.prevPct !== undefined ? cat.pct - cat.prevPct : null;
    return (
      <View style={cr.row}>
        <View style={[cr.rankBadge, { backgroundColor: `${cat.color}18` }]}>
          <Text style={[cr.rankNum, { color: cat.color }]}>{rank + 1}</Text>
        </View>
        <View style={{ flex: 1, gap: 6 }}>
          <View style={cr.top}>
            <Text style={cr.name} numberOfLines={1}>
              {cat.name}
            </Text>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              {trend !== null && (
                <View
                  style={[
                    cr.trendBadge,
                    {
                      backgroundColor:
                        trend > 2
                          ? `${Colors.danger}18`
                          : trend < -2
                            ? `${Colors.success}18`
                            : `${Colors.textMuted}18`,
                    },
                  ]}
                >
                  <Feather
                    name={
                      trend > 2
                        ? "trending-up"
                        : trend < -2
                          ? "trending-down"
                          : "minus"
                    }
                    size={10}
                    color={
                      trend > 2
                        ? Colors.danger
                        : trend < -2
                          ? Colors.success
                          : Colors.textMuted
                    }
                  />
                  <Text
                    style={[
                      cr.trendText,
                      {
                        color:
                          trend > 2
                            ? Colors.danger
                            : trend < -2
                              ? Colors.success
                              : Colors.textMuted,
                      },
                    ]}
                  >
                    {Math.abs(trend).toFixed(0)}%
                  </Text>
                </View>
              )}
              <Text style={cr.amount}>{formatCurrency(cat.amount)}</Text>
            </View>
          </View>
          <View style={cr.track}>
            <Animated.View
              style={[
                cr.fill,
                {
                  backgroundColor: cat.color,
                  width: widthAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0%", "100%"],
                  }),
                },
              ]}
            />
          </View>
          <Text style={cr.pct}>{cat.pct.toFixed(1)}% of spending</Text>
        </View>
      </View>
    );
  },
);
CategoryRow.displayName = "CategoryRow";
const cr = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: 16,
    alignItems: "flex-start",
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  rankNum: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    flex: 1,
  },
  amount: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  track: {
    height: 6,
    backgroundColor: `${Colors.surfaceBorder}60`,
    borderRadius: 99,
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: 99 },
  pct: { fontSize: FontSize.xs, color: Colors.textMuted },
  trendBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  trendText: { fontSize: 10, fontWeight: FontWeight.bold },
});

// ─── Stat tile ────────────────────────────────────────────────────────────────
const StatTile: React.FC<{
  label: string;
  value: string;
  sub?: string;
  accent?: string;
  icon: string;
}> = React.memo(({ label, value, sub, accent = Colors.primary, icon }) => (
  <View style={[st.tile, { borderColor: `${accent}25` }]}>
    <View style={[st.iconWrap, { backgroundColor: `${accent}15` }]}>
      <Feather name={icon as any} size={15} color={accent} />
    </View>
    <Text style={st.value}>{value}</Text>
    <Text style={st.label}>{label}</Text>
    {sub ? <Text style={st.sub}>{sub}</Text> : null}
  </View>
));
StatTile.displayName = "StatTile";
const st = StyleSheet.create({
  tile: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.md,
    gap: 6,
    minWidth: (CHART_W - Spacing.sm) / 2,
    maxWidth: (CHART_W - Spacing.sm) / 2,
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
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  label: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sub: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.medium, marginTop: 2 },
});

// ─── Budget vs Actual gauge ────────────────────────────────────────────────────
const BudgetGauge: React.FC<{ spent: number; limit: number }> = React.memo(
  ({ spent, limit }) => {
    const pct = limit > 0 ? Math.min(spent / limit, 1) : 0;
    const over = spent > limit && limit > 0;
    const accent = over
      ? Colors.danger
      : pct >= 0.8
        ? Colors.warning
        : Colors.success;
    const barW = useRef(new Animated.Value(0)).current;
    React.useEffect(() => {
      Animated.timing(barW, {
        toValue: pct,
        duration: 900,
        useNativeDriver: false,
      }).start();
    }, [pct]);
    return (
      <View style={bg.wrap}>
        {/* Labels */}
        <View style={bg.labelRow}>
          <Text style={bg.labelLeft}>Spent</Text>
          <Text style={bg.labelRight}>Budget</Text>
        </View>
        {/* Amounts */}
        <View style={bg.amtRow}>
          <Text style={[bg.amt, { color: accent }]}>
            {formatCurrency(spent)}
          </Text>
          <Text style={bg.amtLimit}>{formatCurrency(limit)}</Text>
        </View>
        {/* Bar */}
        <View style={bg.track}>
          <Animated.View
            style={[
              bg.fill,
              {
                backgroundColor: accent,
                width: barW.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          />
        </View>
        {/* Pct label */}
        <View style={bg.row}>
          <Text style={[bg.pct, { color: accent }]}>
            {(pct * 100).toFixed(0)}% used
          </Text>
          {limit > 0 && (
            <Text style={over ? bg.overText : bg.remainText}>
              {over
                ? `${formatCurrency(spent - limit)} over budget`
                : `${formatCurrency(limit - spent)} remaining`}
            </Text>
          )}
        </View>
      </View>
    );
  },
);
BudgetGauge.displayName = "BudgetGauge";
const bg = StyleSheet.create({
  wrap: { gap: 6 },
  labelRow: { flexDirection: "row", justifyContent: "space-between" },
  labelLeft: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: FontWeight.medium,
  },
  labelRight: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: FontWeight.medium,
  },
  amtRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  amt: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    letterSpacing: -0.5,
  },
  amtLimit: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  track: {
    height: 10,
    backgroundColor: `${Colors.surfaceBorder}60`,
    borderRadius: 99,
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: 99 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pct: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  overText: {
    fontSize: FontSize.sm,
    color: Colors.danger,
    fontWeight: FontWeight.semibold,
  },
  remainText: {
    fontSize: FontSize.sm,
    color: Colors.success,
    fontWeight: FontWeight.semibold,
  },
});

// ─── Analytics Screen ─────────────────────────────────────────────────────────
export const AnalyticsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();

  // ── Store ──────────────────────────────────────────────────────────────────
  const expenses = useFinanceStore((s) => s.expenses);
  const categories = useFinanceStore((s) => s.categories);
  const budgets = useFinanceStore((s) => s.budgets);
  const fetchExpenses = useFinanceStore((s) => s.fetchExpenses);
  const fetchCategories = useFinanceStore((s) => s.fetchCategories);
  const fetchBudgets = useFinanceStore((s) => s.fetchBudgets);

  // ── Refresh on focus ───────────────────────────────────────────────────────
  const mk = useMemo(() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchExpenses();
      fetchCategories();
      fetchBudgets(mk);
    }, [mk]),
  );

  // ── Derived calculations (all memoized) ───────────────────────────────────

  const now = useMemo(() => new Date(), []);
  const curY = now.getFullYear();
  const curM = now.getMonth();

  const categoryMap = useMemo(() => {
    const m = new Map<string, { name: string; color: string }>();
    categories.forEach((c) => m.set(c.id, { name: c.name, color: c.color }));
    return m;
  }, [categories]);

  const curExpenses = useMemo(
    () => filterByMonth(expenses, curY, curM),
    [expenses, curY, curM],
  );
  const prevExpenses = useMemo(
    () => filterByMonth(expenses, curY, curM - 1),
    [expenses, curY, curM],
  );
  const curTotal = useMemo(() => sumAmount(curExpenses), [curExpenses]);
  const prevTotal = useMemo(() => sumAmount(prevExpenses), [prevExpenses]);

  const pctChange = useMemo(() => {
    if (prevTotal === 0) return null;
    return ((curTotal - prevTotal) / prevTotal) * 100;
  }, [curTotal, prevTotal]);

  // Monthly budget
  const monthBudget = useMemo(
    () => budgets.find((b) => b.category_id === null && b.month === mk),
    [budgets, mk],
  );
  const budgetLimit = monthBudget?.monthly_limit ?? 0;

  // Last 7 days bar chart data
  const weeklyData = useMemo(() => {
    const DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      return {
        dateStr: ds,
        label: DAY[d.getDay()],
        isToday: i === 6,
        value: 0,
      };
    });
    expenses.forEach((e) => {
      const ds = (e.date ?? "").slice(0, 10);
      const day = days.find((d) => d.dateStr === ds);
      if (day) day.value += Number(e.amount);
    });
    return days;
  }, [expenses]);

  // Monthly data (last 6 months)
  const monthlyData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const offset = 5 - i;
      const d = new Date(curY, curM - offset, 1);
      const label = d.toLocaleString("en-IN", { month: "short" });
      const filtered = filterByMonth(expenses, d.getFullYear(), d.getMonth());
      return { label, value: sumAmount(filtered), highlight: offset === 0 };
    });
  }, [expenses, curY, curM]);

  // Category breakdown
  const catBreakdown = useMemo<CatRow[]>(() => {
    const spendMap = new Map<string, number>();
    curExpenses.forEach((e) => {
      if (e.category_id)
        spendMap.set(
          e.category_id,
          (spendMap.get(e.category_id) ?? 0) + Number(e.amount),
        );
    });

    // Previous month category pcts for trend
    const prevSpendMap = new Map<string, number>();
    prevExpenses.forEach((e) => {
      if (e.category_id)
        prevSpendMap.set(
          e.category_id,
          (prevSpendMap.get(e.category_id) ?? 0) + Number(e.amount),
        );
    });
    const prevT = sumAmount(prevExpenses);

    return Array.from(spendMap.entries())
      .map(([id, amount]) => {
        const cat = categoryMap.get(id);
        const pct = curTotal > 0 ? (amount / curTotal) * 100 : 0;
        const prevAmt = prevSpendMap.get(id) ?? 0;
        const prevPct = prevT > 0 ? (prevAmt / prevT) * 100 : undefined;
        return {
          name: cat?.name ?? "Uncategorized",
          color: cat?.color ?? Colors.surfaceBorder,
          amount,
          pct,
          prevPct,
        };
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);
  }, [curExpenses, prevExpenses, curTotal, categoryMap]);

  // Day-of-week pattern
  const dowData = useMemo(() => {
    const LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const counts = Array(7).fill(0);
    const totals = Array(7).fill(0);
    expenses.forEach((e) => {
      const dow = new Date(e.date).getDay();
      totals[dow] += Number(e.amount);
      counts[dow]++;
    });
    const maxVal = Math.max(...totals, 1);
    const highDow = totals.indexOf(maxVal);
    return {
      bars: LABELS.map((label, i) => ({
        label,
        value: totals[i],
        highlight: i === highDow,
      })),
      highDow,
      highLabel: LABELS[highDow],
    };
  }, [expenses]);

  // Average metrics
  const avgMetrics = useMemo(() => {
    const daysElapsed = now.getDate();
    const avgDaily = daysElapsed > 0 ? curTotal / daysElapsed : 0;
    const avgPerTxn =
      curExpenses.length > 0 ? curTotal / curExpenses.length : 0;
    const topWeekend = dowData.bars[0].value + dowData.bars[6].value;
    const topWeekday =
      dowData.bars.slice(1, 6).reduce((s, d) => s + d.value, 0) / 5;
    return {
      avgDaily,
      avgPerTxn,
      topWeekend,
      topWeekday,
      daysLeft: new Date(curY, curM + 1, 0).getDate() - now.getDate(),
    };
  }, [curTotal, curExpenses, dowData, now, curY, curM]);

  // Smart insights (pure computation, memoized)
  const insights = useMemo(() => {
    const list: { text: string; type: "info" | "warn" | "good" | "neutral" }[] =
      [];

    if (pctChange !== null) {
      if (pctChange > 15)
        list.push({
          text: `Spending is up ${pctChange.toFixed(0)}% compared to last month — a significant increase.`,
          type: "warn",
        });
      else if (pctChange < -10)
        list.push({
          text: `Great job! Spending dropped ${Math.abs(pctChange).toFixed(0)}% compared to last month.`,
          type: "good",
        });
      else if (pctChange > 0)
        list.push({
          text: `Spending is up ${pctChange.toFixed(0)}% vs last month.`,
          type: "info",
        });
      else
        list.push({
          text: `Spending is down ${Math.abs(pctChange).toFixed(0)}% vs last month.`,
          type: "good",
        });
    }

    if (catBreakdown.length > 0) {
      const top = catBreakdown[0];
      list.push({
        text: `${top.name} is your biggest expense at ${top.pct.toFixed(0)}% of this month's spending.`,
        type: top.pct > 50 ? "warn" : "info",
      });
    }

    if (avgMetrics.topWeekend > avgMetrics.topWeekday * 1.3)
      list.push({
        text: "You spend significantly more on weekends than weekdays.",
        type: "info",
      });
    else if (avgMetrics.topWeekday > avgMetrics.topWeekend * 1.2)
      list.push({
        text: "Weekday spending is higher — most of your expenses happen during the work week.",
        type: "neutral",
      });

    if (avgMetrics.avgDaily > 0)
      list.push({
        text: `Your average daily spend this month is ${formatCurrency(avgMetrics.avgDaily)}.`,
        type: "neutral",
      });

    if (budgetLimit > 0) {
      const remaining = budgetLimit - curTotal;
      if (curTotal > budgetLimit)
        list.push({
          text: `Budget exceeded by ${formatCurrency(curTotal - budgetLimit)}. Consider reviewing top categories.`,
          type: "warn",
        });
      else if (remaining > 0 && avgMetrics.daysLeft > 0) {
        const projSpend = curTotal + avgMetrics.avgDaily * avgMetrics.daysLeft;
        if (projSpend > budgetLimit)
          list.push({
            text: `At this rate you may exceed your budget by ${formatCurrency(projSpend - budgetLimit)} before month end.`,
            type: "warn",
          });
        else
          list.push({
            text: `On track: approx. ${formatCurrency(remaining)} left to spend for the rest of the month.`,
            type: "good",
          });
      }
    }

    if (catBreakdown.length > 1 && catBreakdown[0].pct > 60)
      list.push({
        text: "Consider diversifying — over 60% concentrated in one category limits visibility.",
        type: "info",
      });

    if (curExpenses.length === 0)
      list.push({
        text: "No transactions recorded this month yet.",
        type: "neutral",
      });

    return list;
  }, [
    pctChange,
    catBreakdown,
    avgMetrics,
    budgetLimit,
    curTotal,
    curExpenses.length,
  ]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      <View style={styles.headerShell}>
        <Text style={styles.pageTitle}>Analytics</Text>
        <Text style={styles.pageSub}>
          {new Date().toLocaleString("en-IN", {
            month: "long",
            year: "numeric",
          })}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: Spacing.md,
            paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 60,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 1. Summary tiles ────────────────────────────────────────────── */}
        <View style={styles.tilesRow}>
          <StatTile
            icon="credit-card"
            label="This Month"
            value={formatCurrency(curTotal)}
            sub={
              pctChange !== null
                ? `${pctChange > 0 ? "+" : ""}${pctChange.toFixed(0)}% vs last month`
                : "No prev data"
            }
            accent={
              pctChange !== null && pctChange > 15
                ? Colors.danger
                : Colors.primary
            }
          />
          <StatTile
            icon="calendar"
            label="Avg / Day"
            value={formatCurrency(avgMetrics.avgDaily)}
            sub={`${now.getDate()} days elapsed`}
            accent={Colors.accent}
          />
          <StatTile
            icon="repeat"
            label="Avg / Txn"
            value={formatCurrency(avgMetrics.avgPerTxn)}
            sub={`${curExpenses.length} transactions`}
            accent={Colors.info}
          />
          <StatTile
            icon="shield"
            label="Budget"
            value={
              budgetLimit > 0
                ? curTotal > budgetLimit
                  ? "Exceeded"
                  : "On Track"
                : "Not Set"
            }
            sub={
              budgetLimit > 0
                ? `${((curTotal / budgetLimit) * 100).toFixed(0)}% used`
                : "Set a budget"
            }
            accent={
              budgetLimit > 0 && curTotal > budgetLimit
                ? Colors.danger
                : Colors.success
            }
          />
        </View>

        {/* ── 2. Budget vs Actual ─────────────────────────────────────────── */}
        {budgetLimit > 0 && (
          <Card>
            <SectionHeader
              icon="pie-chart"
              title="Budget vs Actual"
              sub="This month"
            />
            <BudgetGauge spent={curTotal} limit={budgetLimit} />
          </Card>
        )}

        {/* ── 3. 6-Month Spending Trend ───────────────────────────────────── */}
        <Card>
          <SectionHeader
            icon="trending-up"
            title="6-Month Trend"
            sub="Monthly spending history"
          />
          <BarChart data={monthlyData} color={Colors.primary} />
        </Card>

        {/* ── 4. Last 7 Days ──────────────────────────────────────────────── */}
        <Card>
          <SectionHeader
            icon="bar-chart-2"
            title="Last 7 Days"
            sub="Daily spending"
          />
          <BarChart data={weeklyData} color={Colors.accent} />
        </Card>

        {/* ── 5. Day-of-week pattern ──────────────────────────────────────── */}
        <Card>
          <SectionHeader
            icon="clock"
            title="Spending by Day of Week"
            sub={
              dowData.highLabel
                ? `Highest on ${dowData.highLabel}s`
                : "All days"
            }
          />
          <BarChart data={dowData.bars} color={Colors.info} />
        </Card>

        {/* ── 6. Category Breakdown ───────────────────────────────────────── */}
        {catBreakdown.length > 0 && (
          <Card>
            <SectionHeader
              icon="tag"
              title="Category Breakdown"
              sub="This month vs last"
            />
            {catBreakdown.map((cat, i) => (
              <CategoryRow key={cat.name} cat={cat} rank={i} />
            ))}
          </Card>
        )}

        {/* ── 7. Smart Insights ───────────────────────────────────────────── */}
        <Card>
          <SectionHeader
            icon="zap"
            title="Smart Insights"
            sub="Computed from your data"
          />
          {insights.map((ins, i) => (
            <InsightPill key={i} text={ins.text} type={ins.type} index={i} />
          ))}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Screen-level styles ──────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerShell: {
    paddingHorizontal: H_PAD,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.background,
  },
  scroll: { paddingHorizontal: H_PAD },

  pageTitle: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    letterSpacing: -1,
  },
  pageSub: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium, marginTop: 2 },

  tilesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
});
