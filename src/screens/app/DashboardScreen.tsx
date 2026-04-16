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

// ─── Transaction Row (card-style, left accent stripe) ──────────────────────────
const TransactionRow: React.FC<TransactionRowProps> = React.memo(
  ({ item, catName, catColor, index }) => {
    const translateY = useRef(new Animated.Value(16)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          delay: index * 60,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          delay: index * 60,
          useNativeDriver: true,
          tension: 120,
          friction: 12,
        }),
      ]).start();
    }, []);

    const paymentLabel = getPaymentMethodLabel(item.payment_method);
    // First letter of category for the square badge
    const initial = catName.charAt(0).toUpperCase();

    return (
      <Animated.View
        style={[
          rowStyles.card,
          { opacity, transform: [{ translateY }] },
        ]}
      >
        {/* ── Left accent stripe ── */}
        <View style={[rowStyles.stripe, { backgroundColor: catColor }]} />

        {/* ── Square letter badge ── */}
        <View
          style={[
            rowStyles.badge,
            { backgroundColor: `${catColor}22`, borderColor: `${catColor}40` },
          ]}
        >
          <Text style={[rowStyles.badgeLetter, { color: catColor }]}>
            {initial}
          </Text>
        </View>

        {/* ── Info block ── */}
        <View style={rowStyles.info}>
          <Text style={rowStyles.name} numberOfLines={1}>
            {catName}
          </Text>
          <View style={rowStyles.metaRow}>
            <Text style={rowStyles.date}>{formatDate(item.date, true)}</Text>
            {item.note ? (
              <>
                <Text style={rowStyles.metaDot}>·</Text>
                <Text style={rowStyles.note} numberOfLines={1}>
                  {item.note}
                </Text>
              </>
            ) : null}
          </View>
        </View>

        {/* ── Right side: amount + method tag ── */}
        <View style={rowStyles.right}>
          <Text style={[rowStyles.amount, { color: catColor }]} numberOfLines={1}>
            {formatCurrency(item.amount)}
          </Text>
          <View
            style={[
              rowStyles.methodTag,
              { backgroundColor: `${catColor}18`, borderColor: `${catColor}35` },
            ]}
          >
            <Text style={[rowStyles.methodText, { color: catColor }]}>
              {paymentLabel}
            </Text>
          </View>
        </View>
      </Animated.View>
    );
  },
);

TransactionRow.displayName = "TransactionRow";

const rowStyles = StyleSheet.create({
  // ── Floating card ──────────────────────────────────────────────────────────
  card: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: H_PAD,
    marginBottom: 10,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    overflow: "hidden",
    paddingVertical: 14,
    paddingRight: Spacing.md,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },

  // ── Left accent stripe (4 px, full card height via overflow:hidden) ────────
  stripe: {
    width: 4,
    alignSelf: "stretch",
    borderRadius: 0,
    flexShrink: 0,
  },

  // ── Category letter square badge ──────────────────────────────────────────
  badge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  badgeLetter: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    letterSpacing: -0.5,
  },

  // ── Text content ──────────────────────────────────────────────────────────
  info: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: FontWeight.semibold,
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  date: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  metaDot: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginHorizontal: 5,
  },
  note: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
  },

  // ── Right side ────────────────────────────────────────────────────────────
  right: {
    alignItems: "flex-end",
    gap: 5,
    flexShrink: 0,
  },
  amount: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    letterSpacing: -0.3,
  },
  methodTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  methodText: {
    fontSize: 10,
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.3,
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

// ─── Category Bar ──────────────────────────────────────────────────────────────
const CategoryBar: React.FC<{
  name: string;
  color: string;
  amount: number;
  total: number;
  index: number;
}> = ({ name, color, amount, total, index }) => {
  const widthAnim = useRef(new Animated.Value(0)).current;
  const pct = total > 0 ? amount / total : 0;

  React.useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: pct,
      duration: 600,
      delay: index * 80 + 200,
      useNativeDriver: false,
    }).start();
  }, [pct]);

  return (
    <View style={catBarStyles.row}>
      <View style={[catBarStyles.dot, { backgroundColor: color }]} />
      <View style={catBarStyles.info}>
        <View style={catBarStyles.labelRow}>
          <Text style={catBarStyles.name} numberOfLines={1}>
            {name}
          </Text>
          <Text style={catBarStyles.amount}>{formatCurrency(amount)}</Text>
        </View>
        <View style={catBarStyles.track}>
          <Animated.View
            style={[
              catBarStyles.fill,
              {
                backgroundColor: color,
                width: widthAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          />
        </View>
      </View>
      <Text style={catBarStyles.pct}>{Math.round(pct * 100)}%</Text>
    </View>
  );
};

const catBarStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: 16,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  info: { flex: 1, gap: 6 },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: FontWeight.semibold,
    flex: 1,
    marginRight: 8,
  },
  amount: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
  },
  track: {
    height: 8,
    backgroundColor: `${Colors.surfaceBorder}50`,
    borderRadius: Radius.full,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: Radius.full,
  },
  pct: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: FontWeight.semibold,
    width: 36,
    textAlign: "right",
    flexShrink: 0,
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
            borderRadius: 5,
            backgroundColor: isToday
              ? Colors.primary
              : amount > 0
                ? `${Colors.primary}66`
                : `${Colors.primary}20`,
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
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.surfaceBorder,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  sub: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
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

  // ── Top categories by spend (current month) ──────────────────────────────
  const topCategories = useMemo(() => {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();
    const map = new Map<string, number>();
    expenses.forEach((e) => {
      const d = new Date(e.date);
      if (d.getFullYear() === curYear && d.getMonth() === curMonth) {
        map.set(
          e.category_id,
          (map.get(e.category_id) ?? 0) + Number(e.amount),
        );
      }
    });
    return Array.from(map.entries())
      .map(([id, amount]) => ({
        id,
        amount,
        ...(categoryMap.get(id) ?? {
          name: "Uncategorized",
          color: Colors.surfaceBorder,
        }),
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 4);
  }, [expenses, categoryMap]);

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
        {/* ── Hero Spending Card ───────────────────────────────────────── */}
        <View style={styles.heroCard}>
          {/* Decorative orbs */}
          <View style={styles.heroOrb} />
          <View style={styles.heroOrb2} />

          <Text style={styles.heroLabel}>
            {monthName.toUpperCase()} {year} · TOTAL SPENT
          </Text>
          <Text style={styles.heroAmount}>{formatCurrency(monthTotal)}</Text>

          {/* ── Inline budget progress (same data as Budget screen) ── */}
          {budgetStatus.hasBudget && (
            <View style={styles.heroBudgetRow}>
              {/* bar */}
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
                            : Colors.success,
                    },
                  ]}
                />
              </View>
              {/* labels */}
              <View style={styles.heroBudgetLabels}>
                <Text style={styles.heroBudgetLeft}>
                  of {formatCurrency(budgetStatus.totalLimit)} budget
                </Text>
                <Text
                  style={[
                    styles.heroBudgetRight,
                    {
                      color:
                        budgetStatus.state === "emergency"
                          ? Colors.danger
                          : budgetStatus.state === "warning"
                            ? Colors.warning
                            : Colors.success,
                    },
                  ]}
                >
                  {budgetStatus.state === "emergency"
                    ? `${formatCurrency(budgetStatus.overBudgetAmount)} over`
                    : `${formatCurrency(budgetStatus.remainingBudget)} left`}
                </Text>
              </View>
            </View>
          )}

          {diffPct !== null && (
            <View style={styles.diffRow}>
              <View
                style={[
                  styles.diffBadge,
                  {
                    backgroundColor:
                      diffPct > 0
                        ? `${Colors.danger}20`
                        : `${Colors.success}20`,
                    borderColor:
                      diffPct > 0
                        ? `${Colors.danger}40`
                        : `${Colors.success}40`,
                  },
                ]}
              >
                <Feather
                  name={diffPct > 0 ? "trending-up" : "trending-down"}
                  size={12}
                  color={diffPct > 0 ? Colors.danger : Colors.success}
                />
                <Text
                  style={[
                    styles.diffText,
                    { color: diffPct > 0 ? Colors.danger : Colors.success },
                  ]}
                >
                  {Math.abs(diffPct).toFixed(1)}% vs last month
                </Text>
              </View>
            </View>
          )}

          {/* ── Budget Exceeded Banner (inside card) ──────────────── */}
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
                    ? "⚠ Budget Exceeded"
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

          {/* ── Enter Emergency Mode (inside card, above chart) ───── */}
          {budgetStatus.state !== "safe" && !isEmergencyModeActive && (
            <EmergencyModeCard onPress={handleEnterEmergency} />
          )}

          {/* ── 7-Day Spending Graph ───────────────────────────────── */}
          <View style={sgStyles.wrapper}>
            <View style={sgStyles.header}>
              <View style={sgStyles.titleRow}>
                <Feather name="bar-chart-2" size={15} color={Colors.primary} />
                <Text style={sgStyles.title}>7-Day Spending</Text>
              </View>
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

          <View style={styles.heroStats}>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>{expenses.length}</Text>
              <Text style={styles.heroStatLabel}>Transactions</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>{categories.length}</Text>
              <Text style={styles.heroStatLabel}>Categories</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>
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
              <Text style={styles.heroStatLabel}>Avg. Expense</Text>
            </View>
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

        {/* ── Recent Section Header ─────────────────────────────────────── */}
        <View style={styles.recentHeader}>
          <View style={styles.sectionTitleRow}>
            <Feather name="clock" size={15} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
          </View>
          <TouchableOpacity
            onPress={() => (navigation as any).navigate("TransactionsTab")}
            activeOpacity={0.65}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.seeAll}>See All</Text>
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

  // ── List footer: Top Categories ─────────────────────────────────────────
  const listFooter = useMemo(
    () =>
      topCategories.length > 0 ? (
        <View
          style={[
            styles.section,
            { marginHorizontal: H_PAD, marginTop: Spacing.md },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Feather name="pie-chart" size={15} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Top Categories</Text>
            </View>
            <Text style={styles.sectionSub}>This month</Text>
          </View>
          {topCategories.map((cat, i) => (
            <CategoryBar
              key={cat.id}
              name={cat.name}
              color={cat.color}
              amount={cat.amount}
              total={monthTotal}
              index={i}
            />
          ))}
        </View>
      ) : null,
    [topCategories, monthTotal],
  );

  // Account for tab bar height + tab bar bottom offset + padding
  const fabBottom = Math.max(insets.bottom, 16) + TAB_BAR_HEIGHT + 16;

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      <View style={styles.headerShell}>
        <View style={styles.topBar}>
          <View style={styles.greetingBlock}>
            <Text style={styles.greetingSmall}>{greeting}</Text>
            <Text style={styles.greetingName} numberOfLines={1}>
              {displayName}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.avatar}
            onPress={() => navigation.navigate("Settings")}
            activeOpacity={0.75}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Text style={styles.avatarText}>{initials}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={recentExpenses}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        ListEmptyComponent={<EmptyTransactions onAdd={navigateToAddExpense} />}
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

      />
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
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  greetingBlock: {
    flex: 1,
    marginRight: Spacing.md,
  },
  greetingSmall: {
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
    marginBottom: 3,
    letterSpacing: 0.2,
  },
  greetingName: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    textTransform: "capitalize",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryDark,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    borderColor: Colors.primary,
  },
  avatarText: {
    color: Colors.white,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.md,
    letterSpacing: 0.5,
  },

  // ── Hero Card ────────────────────────────────────────────────────────────────
  heroCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    overflow: "hidden",
    elevation: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },
  heroOrb: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: `${Colors.primary}12`,
    top: -80,
    right: -60,
  },
  heroOrb2: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${Colors.accent}0A`,
    bottom: -30,
    left: -20,
  },
  heroLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.bold,
    letterSpacing: 1.4,
    marginBottom: Spacing.xs,
  },
  heroAmount: {
    fontSize: 44,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
    letterSpacing: -2,
    marginBottom: 4,
  },
  // ── Inline budget progress bar inside hero card ──────────────────────────
  heroBudgetRow: {
    marginBottom: Spacing.sm,
    gap: 6,
  },
  heroBudgetTrack: {
    height: 5,
    backgroundColor: `${Colors.surfaceBorder}60`,
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
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
  },
  heroBudgetRight: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
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
    borderWidth: 1,
  },
  diffText: {
    fontSize: 11,
    fontWeight: FontWeight.semibold,
  },
  heroStats: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: `${Colors.surfaceBorder}80`,
    marginTop: Spacing.sm,
  },
  heroStatItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  heroStatDivider: {
    width: StyleSheet.hairlineWidth,
    height: 36,
    backgroundColor: Colors.surfaceBorder,
  },
  heroStatValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  heroStatLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
    letterSpacing: 0.4,
    textTransform: "uppercase",
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
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginBottom: Spacing.md,
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
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  sectionSub: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
  },

  // ── Recent Header ─────────────────────────────────────────────────────────────
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  seeAll: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
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
