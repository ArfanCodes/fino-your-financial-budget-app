import React, { useCallback, useState } from "react";
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

// ─── Payment icon map ───────────────────────────────────────────────────────────
const PAYMENT_ICONS: Record<string, string> = {
  cash: "dollar-sign",
  card: "credit-card",
  upi: "smartphone",
  bank_transfer: "repeat",
  other: "more-horizontal",
};

// ─── Expense Row ───────────────────────────────────────────────────────────────
const ExpenseRow: React.FC<{
  item: Expense;
  categoryName: string;
  categoryColor: string;
  onDelete: (id: string) => void;
}> = React.memo(({ item, categoryName, categoryColor, onDelete }) => {
  const paymentIcon = PAYMENT_ICONS[item.payment_method] ?? "circle";
  const paymentLabel = item.payment_method.replace(/_/g, " ");

  return (
    <View style={rowStyles.container}>
      {/* Category color icon */}
      <View style={[rowStyles.iconWrap, { backgroundColor: `${categoryColor}22` }]}>
        <View style={[rowStyles.iconDot, { backgroundColor: categoryColor }]} />
      </View>

      {/* Info */}
      <View style={rowStyles.info}>
        <Text style={rowStyles.category} numberOfLines={1}>
          {categoryName}
        </Text>
        {item.note ? (
          <Text style={rowStyles.note} numberOfLines={1}>
            {item.note}
          </Text>
        ) : null}
        <View style={rowStyles.metaRow}>
          <Feather name="calendar" size={10} color={Colors.textMuted} />
          <Text style={rowStyles.meta}>{formatDate(item.date, true)}</Text>
          <View style={rowStyles.metaDivider} />
          <Feather name={paymentIcon as any} size={10} color={Colors.textMuted} />
          <Text style={rowStyles.meta}>{paymentLabel}</Text>
        </View>
      </View>

      {/* Amount + delete */}
      <View style={rowStyles.right}>
        <Text style={rowStyles.amount}>-{formatCurrency(item.amount)}</Text>
        <TouchableOpacity
          onPress={() => onDelete(item.id)}
          hitSlop={{ top: 10, bottom: 10, left: 12, right: 12 }}
          style={rowStyles.deleteBtn}
        >
          <Feather name="trash-2" size={13} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
});

const rowStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    paddingHorizontal: Spacing.md,
    paddingVertical: 13,
    gap: Spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  iconDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  info: {
    flex: 1,
    gap: 3,
  },
  category: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  note: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  meta: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textTransform: "capitalize",
  },
  metaDivider: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.surfaceBorder,
    marginHorizontal: 2,
  },
  right: {
    alignItems: "flex-end",
    gap: 8,
    flexShrink: 0,
  },
  amount: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.danger,
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.surfaceElevated,
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

  // Aggregate total for header
  const totalAmount = React.useMemo(
    () => expenses.reduce((sum, e) => sum + e.amount, 0),
    [expenses],
  );

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
    ({ item }: { item: Expense }) => {
      const cat = categoryMap.get(item.category_id);
      return (
        <ExpenseRow
          item={item}
          categoryName={cat?.name ?? "Uncategorized"}
          categoryColor={cat?.color ?? Colors.surfaceBorder}
          onDelete={handleDelete}
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

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <View>
          <Text style={styles.title}>Transactions</Text>
          {expenses.length > 0 && (
            <Text style={styles.totalLabel}>
              {expenses.length} expense{expenses.length !== 1 ? "s" : ""} · {formatCurrency(totalAmount)} total
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

      {/* Error */}
      {expensesError ? (
        <View style={styles.errorBanner}>
          <Feather name="alert-circle" size={14} color={Colors.danger} />
          <Text style={styles.errorText}>{expensesError}</Text>
        </View>
      ) : null}

      {/* Loading or list */}
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
            { paddingBottom: insets.bottom + Spacing.xxl },
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

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    letterSpacing: 0.1,
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
    width: 38,
    height: 38,
    borderRadius: 19,
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
    paddingVertical: 8,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    gap: Spacing.xs,
  },
  addText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },

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

  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl,
    flexGrow: 1,
  },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: Spacing.xxxl,
    gap: Spacing.sm,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
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
