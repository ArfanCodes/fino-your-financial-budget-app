import React, { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  StatusBar,
  Animated,
} from "react-native";
import { ConfirmModal } from "../../components/ConfirmModal";
import { Feather } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFinanceStore } from "../../store/finance.store";
import {
  Colors,
  Spacing,
  FontSize,
  FontWeight,
  Radius,
} from "../../utils/constants";
import { formatCurrency, formatDate } from "../../utils/helpers";
import type { Expense, TransactionsStackParamList } from "../../types";

// ─── Types ─────────────────────────────────────────────────────────────────────
type Props = {
  navigation: NativeStackNavigationProp<
    TransactionsStackParamList,
    "ExpenseList"
  >;
};

// ─── Payment config ─────────────────────────────────────────────────────────────
const PAYMENT_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  cash:          { icon: "dollar-sign",   label: "Cash",     color: "#22c55e" },
  card:          { icon: "credit-card",   label: "Card",     color: "#818cf8" },
  upi:           { icon: "smartphone",    label: "UPI",      color: "#f97316" },
  bank_transfer: { icon: "repeat",        label: "Bank",     color: "#38bdf8" },
  other:         { icon: "more-horizontal", label: "Other",  color: Colors.textMuted },
};

// ─── Expense Row ───────────────────────────────────────────────────────────────
const ExpenseRow: React.FC<{
  item: Expense;
  categoryName: string;
  categoryColor: string;
  onDelete: (id: string) => void;
  index: number;
}> = React.memo(({ item, categoryName, categoryColor, onDelete, index }) => {
  const pm = PAYMENT_CONFIG[item.payment_method] ?? PAYMENT_CONFIG.other;

  const opacity   = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 280, delay: index * 45, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 280, delay: index * 45, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <View style={rowStyles.card}>
        {/* Left color accent bar */}
        <View style={[rowStyles.accentBar, { backgroundColor: categoryColor }]} />

        {/* Category icon bubble */}
        <View style={[rowStyles.iconWrap, { backgroundColor: `${categoryColor}20` }]}>
          <View style={[rowStyles.iconDot, { backgroundColor: categoryColor }]} />
        </View>

        {/* Text info */}
        <View style={rowStyles.info}>
          <Text style={rowStyles.category} numberOfLines={1}>{categoryName}</Text>
          {item.note ? (
            <Text style={rowStyles.note} numberOfLines={1}>{item.note}</Text>
          ) : null}
          <View style={rowStyles.metaRow}>
            <Text style={rowStyles.date}>{formatDate(item.date, true)}</Text>
            <View style={rowStyles.dot} />
            {/* Payment pill */}
            <View style={[rowStyles.pill, { backgroundColor: `${pm.color}18`, borderColor: `${pm.color}40` }]}>
              <Feather name={pm.icon as any} size={9} color={pm.color} />
              <Text style={[rowStyles.pillText, { color: pm.color }]}>{pm.label}</Text>
            </View>
          </View>
        </View>

        {/* Amount + delete */}
        <View style={rowStyles.right}>
          <Text style={rowStyles.amount}>−{formatCurrency(item.amount)}</Text>
          <TouchableOpacity
            onPress={() => onDelete(item.id)}
            hitSlop={{ top: 10, bottom: 10, left: 12, right: 12 }}
            style={rowStyles.deleteBtn}
          >
            <Feather name="trash-2" size={12} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
});

ExpenseRow.displayName = "ExpenseRow";

const rowStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    gap: Spacing.sm,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
  },
  accentBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3.5,
    borderTopLeftRadius: Radius.xl,
    borderBottomLeftRadius: Radius.xl,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginLeft: 6,
  },
  iconDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  category: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.1,
  },
  note: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  date: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.surfaceBorder,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  right: {
    alignItems: "flex-end",
    gap: 10,
    flexShrink: 0,
  },
  amount: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.danger,
    letterSpacing: -0.3,
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    alignItems: "center",
    justifyContent: "center",
  },
});

// ─── Expenses Screen ───────────────────────────────────────────────────────────
export const ExpensesScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const expenses        = useFinanceStore((s) => s.expenses);
  const categories      = useFinanceStore((s) => s.categories);
  const expensesLoading = useFinanceStore((s) => s.expensesLoading);
  const expensesError   = useFinanceStore((s) => s.expensesError);
  const fetchExpenses   = useFinanceStore((s) => s.fetchExpenses);
  const fetchCategories = useFinanceStore((s) => s.fetchCategories);
  const removeExpense   = useFinanceStore((s) => s.removeExpense);

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const categoryMap = React.useMemo(() => {
    const map = new Map<string, { name: string; color: string }>();
    categories.forEach((c) => map.set(c.id, { name: c.name, color: c.color }));
    return map;
  }, [categories]);

  // Month total
  const totalAmount = React.useMemo(
    () => expenses.reduce((sum, e) => sum + e.amount, 0),
    [expenses],
  );

  // This-month count
  const thisMonthCount = React.useMemo(() => {
    const now = new Date();
    return expenses.filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  }, [expenses]);

  useFocusEffect(
    useCallback(() => {
      fetchExpenses();
      if (categories.length === 0) fetchCategories();
    }, []),
  );

  const handleDelete  = (id: string) => setDeleteId(id);

  const confirmDelete = async () => {
    if (!deleteId) return;
    const error = await removeExpense(deleteId);
    setDeleteId(null);
    if (error) Alert.alert("Error", error);
  };

  const renderItem = useCallback(
    ({ item, index }: { item: Expense; index: number }) => {
      const cat = categoryMap.get(item.category_id);
      return (
        <ExpenseRow
          item={item}
          categoryName={cat?.name ?? "Uncategorized"}
          categoryColor={cat?.color ?? Colors.surfaceBorder}
          onDelete={handleDelete}
          index={index}
        />
      );
    },
    [categoryMap],
  );

  const renderEmpty = () => {
    if (expensesLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconWrap}>
          <Feather name="inbox" size={28} color={Colors.textMuted} />
        </View>
        <Text style={styles.emptyTitle}>No transactions yet</Text>
        <Text style={styles.emptySubtitle}>
          Tap{" "}
          <Text style={{ color: Colors.primary, fontWeight: FontWeight.semibold }}>
            + Add
          </Text>{" "}
          to record your first expense
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      <ConfirmModal
        visible={!!deleteId}
        title="Delete Expense"
        message="This expense will be permanently removed."
        confirmLabel="Delete"
        icon="trash-2"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <View>
          <Text style={styles.title}>Transactions</Text>
          {expenses.length > 0 && (
            <Text style={styles.totalLabel}>
              {expenses.length} total · {thisMonthCount} this month
            </Text>
          )}
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate("CategoryList")}
            activeOpacity={0.7}
          >
            <Feather name="tag" size={17} color={Colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate("AddExpense")}
            activeOpacity={0.7}
          >
            <Feather name="plus" size={16} color={Colors.white} />
            <Text style={styles.addText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Summary strip ──────────────────────────────────────────────── */}
      {expenses.length > 0 && (
        <View style={styles.summaryStrip}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{formatCurrency(totalAmount)}</Text>
            <Text style={styles.summaryLabel}>Total Spent</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {expenses.length > 0
                ? formatCurrency(totalAmount / expenses.length)
                : "—"}
            </Text>
            <Text style={styles.summaryLabel}>Avg. per Txn</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{thisMonthCount}</Text>
            <Text style={styles.summaryLabel}>This Month</Text>
          </View>
        </View>
      )}

      {/* ── Error ───────────────────────────────────────────────────────── */}
      {expensesError ? (
        <View style={styles.errorBanner}>
          <Feather name="alert-circle" size={14} color={Colors.danger} />
          <Text style={styles.errorText}>{expensesError}</Text>
        </View>
      ) : null}

      {/* ── List ────────────────────────────────────────────────────────── */}
      {expensesLoading && expenses.length === 0 ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + Spacing.xxl + 80 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={expensesLoading && expenses.length > 0}
              onRefresh={fetchExpenses}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
          removeClippedSubviews
          maxToRenderPerBatch={15}
          windowSize={10}
          initialNumToRender={15}
        />
      )}
    </View>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  totalLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
    fontWeight: FontWeight.medium,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    paddingVertical: 9,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    gap: Spacing.xs,
    elevation: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  addText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },

  // Summary strip
  summaryStrip: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
    gap: 3,
  },
  summaryValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  summaryLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  summaryDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.surfaceBorder,
  },

  // Error
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: `${Colors.danger}15`,
    borderRadius: Radius.md,
    marginHorizontal: Spacing.lg,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  errorText: { color: Colors.danger, fontSize: FontSize.sm, flex: 1 },

  // Loader
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
  },

  // List
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    flexGrow: 1,
  },

  // Empty
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: Spacing.sm,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  emptySubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
});
