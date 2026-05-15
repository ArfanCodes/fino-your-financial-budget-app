import React, { useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ListRenderItem,
  StatusBar,
  RefreshControl,
  TouchableOpacity,
  Platform,
  Animated,
  Dimensions,
} from "react-native";
import {
  useFocusEffect,
  useNavigation,
  NavigationProp,
} from "@react-navigation/native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useAuthStore } from "../../store/auth.store";
import {
  useFinanceStore,
  selectCurrentMonthTotal,
} from "../../store/finance.store";
import {
  Colors,
  Spacing,
  FontSize,
  FontWeight,
  Radius,
  TAB_BAR_HEIGHT,
} from "../../utils/constants";
import { formatCurrency, formatDate, getInitials } from "../../utils/helpers";
import { BudgetAlertBanner } from "../../components/BudgetAlertBanner";
import { FadeIn } from "../../components/FadeIn";
import {
  TransactionRowSkeleton,
  StatPillsSkeleton,
} from "../../components/Skeleton";
import { useBudgetStatus } from "../../hooks/useBudgetStatus";
import { CategoryChip } from "../../components/CategoryChip";
import { useEmergencyMode } from "../../context/EmergencyModeContext";
import type { Expense, AppStackParamList } from "../../types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const H_PAD = 20;

// ─── Emergency Mode Card (flashing warning) ────────────────────────────────────
const EmergencyModeCard: React.FC<{
  onPress: () => void;
}> = React.memo(({ onPress }) => {
  const flashAnim = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(flashAnim, {
          toValue: 0.15,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(flashAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <TouchableOpacity
      style={emgStyles.card}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={emgStyles.left}>
        <Animated.View style={[emgStyles.iconWrap, { opacity: flashAnim }]}>
          <Feather name="alert-triangle" size={20} color={Colors.danger} />
        </Animated.View>
        <View style={emgStyles.textBlock}>
          <Text style={emgStyles.title}>Enter Emergency Mode</Text>
          <Text style={emgStyles.sub}>Lock focus on financial recovery</Text>
        </View>
      </View>
      <Feather name="chevron-right" size={18} color={Colors.danger} />
    </TouchableOpacity>
  );
});
EmergencyModeCard.displayName = "EmergencyModeCard";

const emgStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${Colors.danger}14`,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: `${Colors.danger}55`,
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: `${Colors.danger}22`,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  textBlock: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.danger,
    letterSpacing: -0.2,
  },
  sub: {
    fontSize: FontSize.sm,
    color: `${Colors.danger}99`,
  },
});

// ─── In-Card Budget Banner Styles ──────────────────────────────────────────────
const inCardStyles = StyleSheet.create({
  budgetBanner: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  budgetBannerDanger: {
    backgroundColor: `${Colors.danger}18`,
    borderColor: `${Colors.danger}60`,
  },
  budgetBannerWarning: {
    backgroundColor: `${Colors.warning}12`,
    borderColor: `${Colors.warning}50`,
  },
  budgetIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  budgetText: {
    flex: 1,
    gap: 3,
  },
  budgetTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    letterSpacing: -0.2,
  },
  budgetSub: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});

interface TransactionRowProps {
  item: Expense;
  catName: string;
  catColor: string;
  index: number;
}

// ─── Transaction Row (premium minimal — white card, no stripe) ────────────────
const TransactionRow: React.FC<TransactionRowProps> = React.memo(
  ({ item, catName, catColor, index }) => {
    const translateY = useRef(new Animated.Value(12)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 280,
          delay: index * 50,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          delay: index * 50,
          useNativeDriver: true,
          tension: 120,
          friction: 14,
        }),
      ]).start();
    }, []);

    const paymentLabel = getPaymentMethodLabel(item.payment_method).toUpperCase();
    const primaryLabel = item.note?.trim() || catName;
    const initial = primaryLabel.charAt(0).toUpperCase();

    return (
      <Animated.View
        style={[
          rowStyles.card,
          { opacity, transform: [{ translateY }] },
        ]}
      >
        {/* ── Square tinted icon (uses category color, very subtle) ── */}
        <View
          style={[
            rowStyles.badge,
            { backgroundColor: `${catColor}1F` },
          ]}
        >
          <Text style={[rowStyles.badgeLetter, { color: catColor }]}>
            {initial}
          </Text>
        </View>

        {/* ── Info block ── */}
        <View style={rowStyles.info}>
          <Text style={rowStyles.name} numberOfLines={1}>
            {primaryLabel}
          </Text>
          <Text style={rowStyles.meta} numberOfLines={1}>
            {formatDate(item.date, true)}
            {item.note && primaryLabel !== item.note ? ` · ${catName}` : ""}
          </Text>
        </View>

        {/* ── Right side: amount + small uppercase method label ── */}
        <View style={rowStyles.right}>
          <Text style={rowStyles.amount} numberOfLines={1}>
            -{formatCurrency(item.amount)}
          </Text>
          <Text style={rowStyles.methodText} numberOfLines={1}>
            {paymentLabel}
          </Text>
        </View>
      </Animated.View>
    );
  },
);

TransactionRow.displayName = "TransactionRow";

const rowStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: H_PAD,
    marginBottom: 10,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 14,

    // Soft directional iOS shadow (no Android elevation — it halos the edges)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 0,
  },

  // Rounded-square category icon
  badge: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  badgeLetter: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.3,
  },

  info: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: 15.5,
    color: Colors.textPrimary,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  meta: {
    fontSize: 12.5,
    color: Colors.textSecondary,
    fontWeight: "500",
  },

  right: {
    alignItems: "flex-end",
    gap: 3,
    flexShrink: 0,
  },
  amount: {
    fontSize: 15.5,
    fontWeight: "700",
    color: Colors.danger,
    letterSpacing: -0.3,
  },
  methodText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: Colors.textMuted,
  },
});

const getPaymentMethodLabel = (method: string): string => {
  if (method === "bank_transfer") return "Bank";
  if (method === "cash") return "Cash";
  if (method === "card") return "Card";
  if (method === "upi") return "UPI";
  return method.charAt(0).toUpperCase() + method.slice(1);
};

// ─── Empty State ───────────────────────────────────────────────────────────────
const EmptyTransactions: React.FC<{ onAdd: () => void }> = React.memo(
  ({ onAdd }) => (
    <View style={emptyStyles.container}>
      <View style={emptyStyles.iconWrap}>
        <Feather name="inbox" size={26} color={Colors.textMuted} />
      </View>
      <Text style={emptyStyles.title}>No transactions yet</Text>
      <Text style={emptyStyles.subtitle}>
        Tap the + button to record your first expense
      </Text>
      <TouchableOpacity style={emptyStyles.cta} onPress={onAdd}>
        <Feather name="plus" size={14} color={Colors.white} />
        <Text style={emptyStyles.ctaText}>Add Expense</Text>
      </TouchableOpacity>
    </View>
  ),
);

EmptyTransactions.displayName = "EmptyTransactions";

const emptyStyles = StyleSheet.create({
  container: {
    marginHorizontal: H_PAD,
    paddingVertical: Spacing.xxl,
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.surfaceBorder,
    gap: Spacing.sm,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
  },
  subtitle: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: Spacing.lg,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    marginTop: Spacing.sm,
  },
  ctaText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.white,
  },
});

// ─── Quick Action Button ───────────────────────────────────────────────────────
const QuickAction: React.FC<{
  icon: string;
  label: string;
  onPress: () => void;
  accent?: string;
}> = ({ icon, label, onPress, accent = Colors.primary }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () =>
    Animated.spring(scale, {
      toValue: 0.93,
      useNativeDriver: true,
      tension: 250,
      friction: 10,
    }).start();

  const handlePressOut = () =>
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 250,
      friction: 10,
    }).start();

  return (
    <Animated.View style={{ transform: [{ scale }], flex: 1 }}>
      <TouchableOpacity
        style={[qaStyles.btn, { borderColor: `${accent}35` }]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <View style={[qaStyles.iconWrap, { backgroundColor: `${accent}20` }]}>
          <Feather name={icon as any} size={18} color={accent} />
        </View>
        <Text style={qaStyles.label}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const qaStyles = StyleSheet.create({
  btn: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: "center",
    gap: Spacing.sm,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
    textAlign: "center",
  },
});

// ─── Spending Graph ────────────────────────────────────────────────────────────
const BAR_MAX_H = 64;

interface SpendingBarItemProps {
  amount: number;
  maxAmount: number;
  label: string;
  isToday: boolean;
  index: number;
}

const SpendingBarItem: React.FC<SpendingBarItemProps> = ({
  amount,
  maxAmount,
  label,
  isToday,
  index,
}) => {
  const pct = maxAmount > 0 ? amount / maxAmount : 0;
  const barH = Math.max(amount > 0 ? pct * BAR_MAX_H : 0, amount > 0 ? 4 : 2);

  return (
    <View style={sgStyles.col}>
      <View style={sgStyles.barTrack}>
        <View
          style={{
            width: "100%",
            height: barH,
            borderRadius: 6,
            backgroundColor: isToday
              ? Colors.accent
              : amount > 0
                ? `${Colors.accent}55`
                : `${Colors.surfaceElevated}`,
          }}
        />
      </View>
      <Text style={[sgStyles.barLabel, isToday && sgStyles.barLabelToday]}>
        {label}
      </Text>
    </View>
  );
};

const sgStyles = StyleSheet.create({
  wrapper: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  sub: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: "600",
  },
  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 5,
  },
  col: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  barTrack: {
    width: "100%",
    height: BAR_MAX_H,
    justifyContent: "flex-end",
    borderRadius: 5,
  },
  barLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
    textAlign: "center",
  },
  barLabelToday: {
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
});

// ─── Key extractor ─────────────────────────────────────────────────────────────
const keyExtractor = (item: Expense): string => item.id;

// ─── Dashboard Screen ──────────────────────────────────────────────────────────
export const DashboardScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();
  const user = useAuthStore((s) => s.user);

  const fetchExpenses = useFinanceStore((s) => s.fetchExpenses);
  const fetchCategories = useFinanceStore((s) => s.fetchCategories);
  const fetchBudgets = useFinanceStore((s) => s.fetchBudgets);
  const expensesLoading = useFinanceStore((s) => s.expensesLoading);
  const categories = useFinanceStore((s) => s.categories);
  const expenses = useFinanceStore((s) => s.expenses);

  const monthTotal = useFinanceStore(selectCurrentMonthTotal);

  const recentExpenses = useMemo(() => expenses.slice(0, 6), [expenses]);

  const categoryMap = useMemo(() => {
    const m = new Map<string, { name: string; color: string }>();
    categories.forEach((c) => m.set(c.id, { name: c.name, color: c.color }));
    return m;
  }, [categories]);

  // ── Last 7 days spending (for bar chart) ──────────────────────────────────
  const weeklyData = useMemo(() => {
    const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const toLocalDateStr = (date: Date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };

    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      return {
        dateStr: toLocalDateStr(d),
        label: DAY_LABELS[d.getDay()],
        isToday: i === 6,
        amount: 0,
      };
    });
    expenses.forEach((e) => {
      const dateStr = (e.date ?? "").slice(0, 10);
      const day = days.find((d) => d.dateStr === dateStr);
      if (day) day.amount += Number(e.amount);
    });
    return days;
  }, [expenses]);

  // ── This month's transactions vs last month diff ──────────────────────────
  const lastMonthTotal = useMemo(() => {
    const now = new Date();
    const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return expenses
      .filter((e) => {
        const d = new Date(e.date);
        return (
          d.getFullYear() === lm.getFullYear() && d.getMonth() === lm.getMonth()
        );
      })
      .reduce((sum, e) => sum + Number(e.amount), 0);
  }, [expenses]);

  const diffPct = useMemo(() => {
    if (lastMonthTotal === 0) return null;
    return ((monthTotal - lastMonthTotal) / lastMonthTotal) * 100;
  }, [monthTotal, lastMonthTotal]);

  const currentMonthKey = useMemo(() => {
    const now2 = new Date();
    return `${now2.getFullYear()}-${String(now2.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  const loadData = useCallback(async () => {
    await Promise.all([
      fetchExpenses(),
      fetchCategories(),
      fetchBudgets(currentMonthKey),
    ]);
  }, [fetchExpenses, fetchCategories, fetchBudgets, currentMonthKey]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const now = useMemo(() => new Date(), []);
  const monthName = useMemo(
    () => now.toLocaleString("en-IN", { month: "long" }),
    [now],
  );
  const year = now.getFullYear();
  const greeting = useMemo(() => {
    const h = now.getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  }, [now]);
  const initials = useMemo(
    () => getInitials(user?.email ?? "U"),
    [user?.email],
  );

  const displayName = useMemo(() => {
    return user?.username || user?.email?.split("@")[0] || "there";
  }, [user?.username, user?.email]);

  const navigateToAddExpense = useCallback(() => {
    (navigation as any).navigate("TransactionsTab", { screen: "AddExpense" });
  }, [navigation]);

  const navigateToRecovery = useCallback(() => {
    navigation.navigate("Recovery");
  }, [navigation]);

  // ── Budget alert state (memoized, no extra fetch) ─────────────────────────
  const budgetStatus = useBudgetStatus();

  // ── Emergency mode ──────────────────────────────────────────────
  const { enterEmergencyMode, isEmergencyModeActive } = useEmergencyMode();

  const handleEnterEmergency = useCallback(() => {
    enterEmergencyMode();
    navigation.navigate("Recovery");
  }, [enterEmergencyMode, navigation]);

  const renderItem = useCallback<ListRenderItem<Expense>>(
    ({ item, index }) => {
      const cat = categoryMap.get(item.category_id);
      return (
        <TransactionRow
          item={item}
          catName={cat?.name ?? "Uncategorized"}
          catColor={cat?.color ?? Colors.surfaceBorder}
          index={index}
        />
      );
    },
    [categoryMap],
  );

  // ── List header ────────────────────────────────────────────────────────────
  const listHeader = useMemo(
    () => (
      <View style={styles.headerWrapper}>
        {/* ── Hero Spending Card (lime) ─────────────────────────────────── */}
        <View style={styles.heroCard}>
          <View style={styles.heroLabelRow}>
            <Text style={styles.heroLabel}>
              {monthName.toUpperCase()} {year}
            </Text>
            {diffPct !== null && (
              <View style={styles.diffBadge}>
                <Feather
                  name={diffPct > 0 ? "trending-up" : "trending-down"}
                  size={11}
                  color={Colors.textOnLime}
                />
                <Text style={styles.diffText}>
                  {diffPct > 0 ? "+" : "-"}
                  {Math.abs(diffPct).toFixed(1)}%
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.heroSubLabel}>Total spent this month</Text>
          <Text style={styles.heroAmount}>{formatCurrency(monthTotal)}</Text>

          {/* ── Inline budget progress (same data as Budget screen) ── */}
          {budgetStatus.hasBudget && (
            <View style={styles.heroBudgetRow}>
              <View style={styles.heroBudgetTrack}>
                <View
                  style={[
                    styles.heroBudgetFill,
                    {
                      width: `${Math.min(budgetStatus.usageRatio * 100, 100)}%`,
                      backgroundColor:
                        budgetStatus.state === "emergency"
                          ? Colors.danger
                          : budgetStatus.state === "warning"
                            ? Colors.warning
                            : Colors.accent,
                    },
                  ]}
                />
              </View>
              <View style={styles.heroBudgetLabels}>
                <Text style={styles.heroBudgetLeft}>
                  of {formatCurrency(budgetStatus.totalLimit)} budget
                </Text>
                <Text style={styles.heroBudgetRight}>
                  {budgetStatus.state === "emergency"
                    ? `${formatCurrency(budgetStatus.overBudgetAmount)} over`
                    : `${formatCurrency(budgetStatus.remainingBudget)} left`}
                </Text>
              </View>
            </View>
          )}

        </View>

        {/* ── Stats Pills Row ─────────────────────────────────────── */}
        <View style={styles.statsRow}>
          <View style={styles.statPill}>
            <Text style={styles.statValue}>{expenses.length}</Text>
            <Text style={styles.statLabel}>Transactions</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statValue}>{categories.length}</Text>
            <Text style={styles.statLabel}>Categories</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statValue}>
              {expenses.length > 0
                ? formatCurrency(
                    monthTotal /
                      Math.max(
                        expenses.filter((e) => {
                          const d = new Date(e.date);
                          return (
                            d.getMonth() === now.getMonth() &&
                            d.getFullYear() === now.getFullYear()
                          );
                        }).length,
                        1,
                      ),
                  )
                : "—"}
            </Text>
            <Text style={styles.statLabel}>Avg. Expense</Text>
          </View>
        </View>

        {/* ── Budget Exceeded / Warning Banner ─────────────────────── */}
        {budgetStatus.state !== "safe" && (
          <TouchableOpacity
            style={[
              inCardStyles.budgetBanner,
              budgetStatus.state === "emergency"
                ? inCardStyles.budgetBannerDanger
                : inCardStyles.budgetBannerWarning,
            ]}
            onPress={navigateToRecovery}
            activeOpacity={0.8}
          >
            <View
              style={[
                inCardStyles.budgetIconWrap,
                {
                  backgroundColor:
                    budgetStatus.state === "emergency"
                      ? `${Colors.danger}25`
                      : `${Colors.warning}25`,
                },
              ]}
            >
              <Feather
                name={
                  budgetStatus.state === "emergency"
                    ? "alert-triangle"
                    : "alert-circle"
                }
                size={18}
                color={
                  budgetStatus.state === "emergency"
                    ? Colors.danger
                    : Colors.warning
                }
              />
            </View>
            <View style={inCardStyles.budgetText}>
              <Text
                style={[
                  inCardStyles.budgetTitle,
                  {
                    color:
                      budgetStatus.state === "emergency"
                        ? Colors.danger
                        : Colors.warning,
                  },
                ]}
              >
                {budgetStatus.state === "emergency"
                  ? "Budget Exceeded"
                  : "Approaching Budget Limit"}
              </Text>
              <Text style={inCardStyles.budgetSub}>
                {budgetStatus.state === "emergency"
                  ? `${formatCurrency(budgetStatus.overBudgetAmount)} over budget — tap to view plan`
                  : `${formatCurrency(budgetStatus.remainingBudget)} remaining this month`}
              </Text>
            </View>
            <Feather
              name="chevron-right"
              size={16}
              color={
                budgetStatus.state === "emergency"
                  ? Colors.danger
                  : Colors.warning
              }
            />
          </TouchableOpacity>
        )}

        {/* ── Enter Emergency Mode ───────────────────────────────── */}
        {budgetStatus.state !== "safe" && !isEmergencyModeActive && (
          <EmergencyModeCard onPress={handleEnterEmergency} />
        )}

        {/* ── 7-Day Spending Graph (separate white card) ────────── */}
        <View style={styles.chartCard}>
          <View style={sgStyles.header}>
            <Text style={sgStyles.title}>7-Day Spending</Text>
            <Text style={sgStyles.sub}>Last 7 days</Text>
          </View>
          <View style={sgStyles.chart}>
            {weeklyData.map((day, i) => (
              <SpendingBarItem
                key={day.dateStr}
                amount={day.amount}
                maxAmount={Math.max(...weeklyData.map((d) => d.amount), 1)}
                label={day.label}
                isToday={day.isToday}
                index={i}
              />
            ))}
          </View>
        </View>

        {/* Active emergency mode indicator on dashboard */}
        {isEmergencyModeActive && (
          <TouchableOpacity
            style={styles.emergencyActiveBtn}
            onPress={navigateToRecovery}
            activeOpacity={0.8}
          >
            <Feather name="zap" size={16} color={Colors.danger} />
            <Text style={styles.emergencyActiveTxt}>
              Emergency Mode Active · Tap to view plan
            </Text>
            <Feather name="chevron-right" size={16} color={Colors.danger} />
          </TouchableOpacity>
        )}

        {/* ── Transactions Section Header ───────────────────────────────── */}
        <View style={styles.recentHeader}>
          <Text style={styles.recentTitle}>Transactions</Text>
          <TouchableOpacity
            onPress={() => (navigation as any).navigate("TransactionsTab")}
            activeOpacity={0.65}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
      </View>
    ),
    [
      greeting,
      displayName,
      initials,
      monthName,
      year,
      monthTotal,
      diffPct,
      expenses.length,
      categories.length,
      weeklyData,
      navigateToAddExpense,
      navigateToRecovery,
      handleEnterEmergency,
      budgetStatus.state,
      budgetStatus.overBudgetAmount,
      budgetStatus.remainingBudget,
      budgetStatus.hasBudget,
      budgetStatus.usageRatio,
      budgetStatus.totalLimit,
      isEmergencyModeActive,
    ],
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      <FadeIn duration={360} style={{ flex: 1 }}>
      <View style={styles.headerShell}>
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.avatarRing}
            onPress={() => navigation.getParent()?.navigate("SettingsTab" as never)}
            activeOpacity={0.75}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.greetingBlock}>
            <Text style={styles.brandName} numberOfLines={1}>FinPulse</Text>
            <Text style={styles.greetingSmall} numberOfLines={1}>
              {greeting}, {displayName}
            </Text>
          </View>
        </View>
      </View>

      <FlatList
        data={recentExpenses}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          expensesLoading && recentExpenses.length === 0 ? (
            <View style={{ paddingHorizontal: H_PAD }}>
              {[0, 1, 2].map((i) => (
                <TransactionRowSkeleton key={i} index={i} />
              ))}
            </View>
          ) : (
            <EmptyTransactions onAdd={navigateToAddExpense} />
          )
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 80 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={expensesLoading}
            onRefresh={loadData}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        extraData={categoryMap}
        removeClippedSubviews={Platform.OS === "android"}
      />
      </FadeIn>
    </SafeAreaView>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {},

  headerShell: {
    paddingHorizontal: H_PAD,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.background,
  },

  headerWrapper: {
    paddingHorizontal: H_PAD,
    paddingTop: Spacing.sm,
  },

  // ── Top Bar ──────────────────────────────────────────────────────────────────
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: Spacing.xs,
  },
  avatarRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: Colors.white,
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: 0.5,
  },
  greetingBlock: {
    flex: 1,
  },
  brandName: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  greetingSmall: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 1,
    fontWeight: "500",
  },
  greetingName: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    textTransform: "capitalize",
  },

  // ── Hero Card (lime green premium) ───────────────────────────────────────────
  heroCard: {
    backgroundColor: Colors.primary,
    borderRadius: 26,
    paddingVertical: 20,
    paddingHorizontal: 22,
    marginBottom: Spacing.md,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 0,
  },
  heroLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  heroLabel: {
    fontSize: 11,
    color: Colors.textOnLime,
    fontWeight: "700",
    letterSpacing: 1.4,
    opacity: 0.75,
  },
  heroSubLabel: {
    fontSize: 13,
    color: Colors.textOnLime,
    fontWeight: "700",
    letterSpacing: 0.2,
    marginBottom: 6,
  },
  heroAmount: {
    fontSize: 40,
    fontWeight: "800",
    color: Colors.textOnLime,
    letterSpacing: -1.5,
    marginBottom: 4,
  },
  // ── Inline budget progress bar inside hero card ──────────────────────────
  heroBudgetRow: {
    marginTop: 6,
    marginBottom: Spacing.sm,
    gap: 6,
  },
  heroBudgetTrack: {
    height: 6,
    backgroundColor: "rgba(15,17,21,0.18)",
    borderRadius: 99,
    overflow: "hidden",
  },
  heroBudgetFill: {
    height: "100%",
    borderRadius: 99,
  },
  heroBudgetLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroBudgetLeft: {
    fontSize: 11,
    color: Colors.textOnLime,
    opacity: 0.7,
    fontWeight: "600",
  },
  heroBudgetRight: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textOnLime,
  },
  diffRow: {
    marginBottom: Spacing.md,
  },
  diffBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  diffText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textOnLime,
    letterSpacing: -0.1,
  },
  // ── Stats Pills (under hero) ─────────────────────────────────────────────
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: Spacing.md,
  },
  statPill: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: "flex-start",
    gap: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 0,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: "600",
    letterSpacing: 0.2,
  },

  // ── 7-Day Chart Card ─────────────────────────────────────────────────────
  chartCard: {
    backgroundColor: Colors.surface,
    borderRadius: 22,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 0,
  },

  // ── Quick Actions ─────────────────────────────────────────────────────────────
  qaRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },

  // ── Section ───────────────────────────────────────────────────────────────────
  section: {
    backgroundColor: Colors.surface,
    borderRadius: 22,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 0,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  sectionSub: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: "600",
  },

  // ── Recent Header ─────────────────────────────────────────────────────────────
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    paddingHorizontal: 2,
  },
  recentTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.accent,
    letterSpacing: -0.1,
  },

  // ── FAB ───────────────────────────────────────────────────────────────────────
  fab: {
    position: "absolute",
    right: H_PAD,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
  },

  // ── Emergency Mode Button ──────────────────────────────────────────────────
  emergencyModeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: `${Colors.danger}0D`,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: `${Colors.danger}40`,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  emergencyModeBtnLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
  emergencyModeIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: `${Colors.danger}18`,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  emergencyModePrimary: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.danger,
    letterSpacing: -0.1,
  },
  emergencyModeSub: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 1,
  },

  // ── Emergency Active Indicator ────────────────────────────────────────────
  emergencyActiveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: `${Colors.danger}12`,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: `${Colors.danger}50`,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  emergencyActiveTxt: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.danger,
    flex: 1,
    letterSpacing: -0.1,
  },
});
