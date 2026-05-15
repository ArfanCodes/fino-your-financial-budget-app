import React, { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  StatusBar,
  Animated,
} from "react-native";
import { ConfirmModal } from "../../components/ConfirmModal";
import { TransactionRowSkeleton } from "../../components/Skeleton";
import { FadeIn } from "../../components/FadeIn";
import { Feather } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useFinanceStore } from "../../store/finance.store";
import {
  Colors,
  Spacing,
  FontSize,
  FontWeight,
  Radius,
  TAB_BAR_HEIGHT,
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

const getPaymentMethodLabel = (method: string): string => {
  if (method === "bank_transfer") return "Bank";
  if (method === "cash") return "Cash";
  if (method === "card") return "Card";
  if (method === "upi") return "UPI";
  return method.charAt(0).toUpperCase() + method.slice(1);
};

// ─── Expense Row (premium, matches Dashboard) ─────────────────────────────────
const ExpenseRow: React.FC<{
  item: Expense;
  categoryName: string;
  categoryColor: string;
  onDelete: (id: string) => void;
  index: number;
}> = React.memo(({ item, categoryName, categoryColor, onDelete, index }) => {
  const translateY = useRef(new Animated.Value(12)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 280,
        delay: index * 45,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        delay: index * 45,
        useNativeDriver: true,
        tension: 120,
        friction: 14,
      }),
    ]).start();
  }, [index, opacity, translateY]);

  const primaryLabel = item.note?.trim() || categoryName;
  const initial = primaryLabel.charAt(0).toUpperCase();
  const methodLabel = getPaymentMethodLabel(item.payment_method).toUpperCase();

  return (
    <Animated.View style={[rowStyles.card, { opacity, transform: [{ translateY }] }]}>
      {/* Category icon (rounded square) */}
      <View style={[rowStyles.badge, { backgroundColor: `${categoryColor}1F` }]}>
        <Text style={[rowStyles.badgeLetter, { color: categoryColor }]}>
          {initial}
        </Text>
      </View>

      {/* Info */}
      <View style={rowStyles.info}>
        <Text style={rowStyles.name} numberOfLines={1}>
          {primaryLabel}
        </Text>
        <Text style={rowStyles.meta} numberOfLines={1}>
          {formatDate(item.date, true)}
          {item.note && primaryLabel !== item.note ? ` · ${categoryName}` : ""}
        </Text>
      </View>

      {/* Right: amount + method, delete tucked at edge */}
      <View style={rowStyles.right}>
        <Text style={rowStyles.amount} numberOfLines={1}>
          -{formatCurrency(item.amount)}
        </Text>
        <Text style={rowStyles.methodText} numberOfLines={1}>
          {methodLabel}
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => onDelete(item.id)}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        style={rowStyles.deleteBtn}
        activeOpacity={0.6}
      >
        <Feather name="trash-2" size={14} color={Colors.textMuted} />
      </TouchableOpacity>
    </Animated.View>
  );
});

ExpenseRow.displayName = "ExpenseRow";

const rowStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 18,
    marginBottom: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 0,
  },
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
    fontWeight: "700",
    color: Colors.textPrimary,
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
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});

// ─── Expenses Screen ───────────────────────────────────────────────────────────
export const ExpensesScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const expenses = useFinanceStore((s) => s.expenses);
  const categories = useFinanceStore((s) => s.categories);
  const expensesLoading = useFinanceStore((s) => s.expensesLoading);
  const expensesError = useFinanceStore((s) => s.expensesError);
  const fetchExpenses = useFinanceStore((s) => s.fetchExpenses);
  const fetchCategories = useFinanceStore((s) => s.fetchCategories);
  const removeExpense = useFinanceStore((s) => s.removeExpense);

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const categoryMap = React.useMemo(() => {
    const map = new Map<string, { name: string; color: string }>();
    categories.forEach((c) => map.set(c.id, { name: c.name, color: c.color }));
    return map;
  }, [categories]);

  const totalAmount = React.useMemo(
    () => expenses.reduce((sum, e) => sum + e.amount, 0),
    [expenses],
  );

  const thisMonthCount = React.useMemo(() => {
    const now = new Date();
    return expenses.filter((e) => {
      const d = new Date(e.date);
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    }).length;
  }, [expenses]);

  useFocusEffect(
    useCallback(() => {
      fetchExpenses();
      if (categories.length === 0) fetchCategories();
    }, []),
  );

  const handleDelete = (id: string) => setDeleteId(id);

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
          categoryColor={cat?.color ?? Colors.accent}
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
          <Feather name="inbox" size={26} color={Colors.textMuted} />
        </View>
        <Text style={styles.emptyTitle}>No transactions yet</Text>
        <Text style={styles.emptySubtitle}>
          Tap{" "}
          <Text style={styles.emptyAccent}>+ Add</Text> to record
          {"\n"}your first expense
        </Text>
        <TouchableOpacity
          style={styles.emptyCta}
          onPress={() => navigation.navigate("AddExpense")}
          activeOpacity={0.85}
        >
          <Feather name="plus" size={14} color={Colors.white} />
          <Text style={styles.emptyCtaText}>Add Expense</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      <ConfirmModal
        visible={!!deleteId}
        title="Delete Expense"
        message="This expense will be permanently removed."
        confirmLabel="Delete"
        icon="trash-2"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />

      <FadeIn duration={360} style={{ flex: 1 }}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Transactions</Text>
          {expenses.length > 0 && (
            <Text style={styles.subtitle}>
              {expenses.length} total · {thisMonthCount} this month
            </Text>
          )}
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate("CategoryList")}
            activeOpacity={0.75}
          >
            <Feather name="tag" size={16} color={Colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate("AddExpense")}
            activeOpacity={0.85}
          >
            <Feather name="plus" size={15} color={Colors.textOnLime} />
            <Text style={styles.addText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Summary card ───────────────────────────────────────────────── */}
      {expenses.length > 0 && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {formatCurrency(totalAmount)}
            </Text>
            <Text style={styles.summaryLabel}>Total Spent</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {expenses.length > 0
                ? formatCurrency(totalAmount / expenses.length)
                : "—"}
            </Text>
            <Text style={styles.summaryLabel}>Avg / Txn</Text>
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
        <View
          style={[
            styles.listContent,
            { paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 60 },
          ]}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <TransactionRowSkeleton key={i} index={i} />
          ))}
        </View>
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 60 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={expensesLoading && expenses.length > 0}
              onRefresh={fetchExpenses}
              tintColor={Colors.accent}
              colors={[Colors.accent]}
            />
          }
          removeClippedSubviews
          maxToRenderPerBatch={15}
          windowSize={10}
          initialNumToRender={15}
        />
      )}
      </FadeIn>
    </SafeAreaView>
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
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.textPrimary,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 12.5,
    color: Colors.textMuted,
    marginTop: 2,
    fontWeight: "600",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 0,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 99,
    gap: 6,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 0,
  },
  addText: {
    color: Colors.textOnLime,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: -0.2,
  },

  // Summary card
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 0,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.textPrimary,
    letterSpacing: -0.4,
  },
  summaryLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  summaryDivider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
    backgroundColor: Colors.surfaceBorder,
  },

  // Error
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: `${Colors.danger}12`,
    borderRadius: 14,
    marginHorizontal: Spacing.lg,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: Spacing.sm,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },

  // Loader
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: "600",
  },

  // List
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 4,
    flexGrow: 1,
  },

  // Empty
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    gap: 10,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 0,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 13.5,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    fontWeight: "500",
  },
  emptyAccent: {
    color: Colors.accent,
    fontWeight: "800",
  },
  emptyCta: {
    marginTop: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.brandBlack,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 99,
  },
  emptyCtaText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
});
