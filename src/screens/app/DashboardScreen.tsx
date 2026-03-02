import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
} from "../../utils/constants";
import { formatCurrency, formatDate, getInitials } from "../../utils/helpers";
import type { Expense } from "../../types";

// ─── Transaction Row ───────────────────────────────────────────────────────────
const TransactionRow: React.FC<{
  item: Expense;
  catName: string;
  catColor: string;
}> = React.memo(({ item, catName, catColor }) => (
  <View style={rowStyles.row}>
    <View style={[rowStyles.indicator, { backgroundColor: catColor }]} />
    <View style={rowStyles.info}>
      <Text style={rowStyles.name} numberOfLines={1}>
        {catName}
      </Text>
      <Text style={rowStyles.date}>{formatDate(item.date, true)}</Text>
    </View>
    <Text style={rowStyles.amount}>{formatCurrency(item.amount)}</Text>
  </View>
));

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.surfaceBorder,
  },
  indicator: {
    width: 3,
    height: 36,
    borderRadius: 2,
    marginRight: Spacing.md,
  },
  info: { flex: 1 },
  name: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: FontWeight.medium,
    marginBottom: 3,
  },
  date: { fontSize: FontSize.xs, color: Colors.textMuted },
  amount: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
});

// ─── Empty State ───────────────────────────────────────────────────────────────
const EmptyTransactions: React.FC = React.memo(() => (
  <View style={emptyStyles.container}>
    <View style={emptyStyles.iconWrap}>
      <Feather name="inbox" size={22} color={Colors.textMuted} />
    </View>
    <Text style={emptyStyles.title}>No transactions yet</Text>
    <Text style={emptyStyles.subtitle}>
      Add your first expense to start tracking
    </Text>
  </View>
));

const emptyStyles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.xl,
    alignItems: "center",
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: "center",
  },
});

// ─── Dashboard Screen ──────────────────────────────────────────────────────────
export const DashboardScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  const fetchExpenses = useFinanceStore((s) => s.fetchExpenses);
  const fetchCategories = useFinanceStore((s) => s.fetchCategories);
  const expensesLoading = useFinanceStore((s) => s.expensesLoading);
  const categories = useFinanceStore((s) => s.categories);
  const expenses = useFinanceStore((s) => s.expenses);

  // Derived — stable selectors, no new arrays in selector definitions
  const monthTotal = useFinanceStore(selectCurrentMonthTotal);
  const recentExpenses = React.useMemo(() => expenses.slice(0, 5), [expenses]);

  // O(1) category lookup
  const categoryMap = React.useMemo(() => {
    const m = new Map<string, { name: string; color: string }>();
    categories.forEach((c) => m.set(c.id, { name: c.name, color: c.color }));
    return m;
  }, [categories]);

  const loadData = useCallback(async () => {
    await Promise.all([fetchExpenses(), fetchCategories()]);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  const initials = getInitials(user?.email ?? "U");
  const now = new Date();
  const monthName = now.toLocaleString("en-IN", { month: "long" });
  const year = now.getFullYear();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + Spacing.xl,
            paddingBottom: insets.bottom + Spacing.xxxl,
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={expensesLoading}
            onRefresh={loadData}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* ── Top Bar ── */}
        <View style={styles.topBar}>
          <View style={styles.greetingBlock}>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.email} numberOfLines={1}>
              {user?.email}
            </Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </View>

        {/* ── Spending Card ── */}
        <View style={styles.spendingCard}>
          <Text style={styles.cardLabel}>
            {monthName} {year}
          </Text>
          <Text style={styles.cardAmount}>{formatCurrency(monthTotal)}</Text>
          <View style={styles.cardDivider} />
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{expenses.length}</Text>
              <Text style={styles.statLabel}>Transactions</Text>
            </View>
            <View style={styles.statSeparator} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{categories.length}</Text>
              <Text style={styles.statLabel}>Categories</Text>
            </View>
          </View>
        </View>

        {/* ── Recent Transactions ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
          </View>

          <View style={styles.card}>
            {recentExpenses.length === 0 ? (
              <EmptyTransactions />
            ) : (
              recentExpenses.map((exp, index) => {
                const cat = categoryMap.get(exp.category_id);
                return (
                  <TransactionRow
                    key={exp.id}
                    item={exp}
                    catName={cat?.name ?? "Uncategorized"}
                    catColor={cat?.color ?? Colors.surfaceBorder}
                  />
                );
              })
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },

  // Top Bar
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  greetingBlock: { flex: 1, marginRight: Spacing.md },
  greeting: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  email: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: Colors.white,
    fontWeight: FontWeight.semibold,
    fontSize: FontSize.sm,
    letterSpacing: 0.5,
  },

  // Spending Card
  spendingCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.surfaceBorder,
  },
  cardLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: Spacing.sm,
  },
  cardAmount: {
    fontSize: FontSize.display,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
    letterSpacing: -1.5,
    marginBottom: Spacing.lg,
  },
  cardDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.surfaceBorder,
    marginBottom: Spacing.lg,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: { flex: 1, alignItems: "center" },
  statSeparator: {
    width: StyleSheet.hairlineWidth,
    height: 32,
    backgroundColor: Colors.surfaceBorder,
  },
  statValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },

  // Section
  section: { marginBottom: Spacing.xl },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textMuted,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },

  // Card
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.surfaceBorder,
  },
});
