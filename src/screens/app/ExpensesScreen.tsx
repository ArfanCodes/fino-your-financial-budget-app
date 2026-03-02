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

// ─── Expense Row ───────────────────────────────────────────────────────────────
const ExpenseRow: React.FC<{
  item: Expense;
  categoryName: string;
  categoryColor: string;
  onDelete: (id: string) => void;
}> = React.memo(({ item, categoryName, categoryColor, onDelete }) => (
  <View style={rowStyles.container}>
    <View style={[rowStyles.bar, { backgroundColor: categoryColor }]} />
    <View style={rowStyles.info}>
      <Text style={rowStyles.category} numberOfLines={1}>
        {categoryName}
      </Text>
      {item.note ? (
        <Text style={rowStyles.note} numberOfLines={1}>
          {item.note}
        </Text>
      ) : null}
      <Text style={rowStyles.meta}>
        {formatDate(item.date, true)}
        {"  ·  "}
        {item.payment_method.replace("_", " ")}
      </Text>
    </View>
    <View style={rowStyles.right}>
      <Text style={rowStyles.amount}>{formatCurrency(item.amount)}</Text>
      <TouchableOpacity
        onPress={() => onDelete(item.id)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={rowStyles.deleteBtn}
      >
        <Feather name="trash-2" size={14} color={Colors.textMuted} />
      </TouchableOpacity>
    </View>
  </View>
));

const rowStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    marginBottom: Spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.surfaceBorder,
    overflow: "hidden",
  },
  bar: { width: 3 },
  info: {
    flex: 1,
    paddingVertical: 13,
    paddingLeft: Spacing.md,
    paddingRight: Spacing.sm,
  },
  category: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  note: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  meta: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textTransform: "capitalize",
  },
  right: {
    paddingVertical: 13,
    paddingHorizontal: Spacing.md,
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  amount: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  deleteBtn: { marginTop: Spacing.xs },
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
          <Feather name="inbox" size={20} color={Colors.textMuted} />
        </View>
        <Text style={styles.emptyTitle}>No expenses yet</Text>
        <Text style={styles.emptySubtitle}>
          Tap Add to record your first expense
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
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Text style={styles.title}>Transactions</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate("CategoryList")}
            activeOpacity={0.7}
          >
            <Feather name="tag" size={18} color={Colors.textSecondary} />
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

      {/* Initial loading */}
      {expensesLoading && expenses.length === 0 ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator color={Colors.primary} size="small" />
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
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    paddingVertical: 7,
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
    borderRadius: Radius.sm,
    marginHorizontal: Spacing.lg,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  errorText: { color: Colors.danger, fontSize: FontSize.sm, flex: 1 },

  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },

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
  },
  emptyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: "center",
  },
});
