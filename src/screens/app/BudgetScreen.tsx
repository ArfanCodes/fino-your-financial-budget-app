import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
  useEffect,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ListRenderItem,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { BudgetRowSkeleton } from "../../components/Skeleton";
import { FadeIn } from "../../components/FadeIn";
import {
  SafeAreaView,
  useSafeAreaInsets as useInsets,
} from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import {
  useFinanceStore,
  selectBudgets,
  selectBudgetsLoading,
  selectExpenses,
  selectCategories,
} from "../../store/finance.store";
import {
  Colors,
  Spacing,
  TAB_BAR_HEIGHT,
} from "../../utils/constants";
import { formatCurrency } from "../../utils/helpers";
import type { Budget, Category } from "../../types";

// ─── Helpers ───────────────────────────────────────────────────────────────────
function currentMonthKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function formatMonthLabel(monthKey: string): string {
  const [y, m] = monthKey.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

function progressColor(ratio: number): string {
  if (ratio >= 1) return Colors.danger;
  if (ratio >= 0.8) return Colors.warning;
  return Colors.accent;
}

// ─── Static progress bar (no per-frame Animated cost — eliminates JS-thread jank) ─
interface BudgetRowProps {
  budget: Budget;
  category: Category | undefined;
  spent: number;
  onEdit: (budget: Budget) => void;
  onDelete: (budget: Budget) => void;
  index: number;
}

const BudgetRow: React.FC<BudgetRowProps> = React.memo(
  ({ budget, category, spent, onEdit, onDelete, index }) => {
    const limit = budget.monthly_limit;
    const ratio = limit > 0 ? spent / limit : 0;
    const pct = Math.min(Math.round(ratio * 100), 100);
    const catColor = category?.color ?? Colors.accent;
    const status = progressColor(ratio);

    return (
      <View style={rowStyles.card}>
        <View style={rowStyles.topRow}>
          <View
            style={[rowStyles.iconWrap, { backgroundColor: `${catColor}1F` }]}
          >
            <Text style={[rowStyles.iconLetter, { color: catColor }]}>
              {(category?.name ?? "U").charAt(0).toUpperCase()}
            </Text>
          </View>

          <View style={rowStyles.titleBlock}>
            <Text style={rowStyles.name} numberOfLines={1}>
              {category?.name ?? "Uncategorized"}
            </Text>
            <Text style={rowStyles.goal} numberOfLines={1}>
              Monthly Goal: {formatCurrency(limit)}
            </Text>
          </View>

          <View style={rowStyles.rightBlock}>
            <Text style={rowStyles.amount} numberOfLines={1}>
              {formatCurrency(spent)}
            </Text>
            <Text style={[rowStyles.pct, { color: status }]}>{pct}%</Text>
          </View>
        </View>

        <View style={rowStyles.track}>
          <View
            style={[
              rowStyles.fill,
              {
                width: `${Math.min(ratio * 100, 100)}%`,
                backgroundColor: catColor,
              },
            ]}
          />
        </View>

        <View style={rowStyles.actionsRow}>
          <TouchableOpacity
            onPress={() => onEdit(budget)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={rowStyles.actionBtn}
          >
            <Feather name="edit-2" size={12} color={Colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onDelete(budget)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={rowStyles.actionBtn}
          >
            <Feather name="trash-2" size={12} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
    );
  },
);
BudgetRow.displayName = "BudgetRow";

const rowStyles = StyleSheet.create({
  track: {
    width: "100%",
    height: 6,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 99,
    overflow: "hidden",
    marginTop: 12,
  },
  fill: {
    height: "100%",
    borderRadius: 99,
  },
  card: {
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
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  iconLetter: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  titleBlock: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 14.5,
    fontWeight: "700",
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  goal: {
    fontSize: 11.5,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  rightBlock: {
    alignItems: "flex-end",
    gap: 2,
    flexShrink: 0,
  },
  amount: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  pct: {
    fontSize: 11.5,
    fontWeight: "800",
    letterSpacing: -0.1,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 4,
    marginTop: 8,
    marginRight: -4,
    marginBottom: -4,
  },
  actionBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
});

// ─── Total Budget Hero (lime) ──────────────────────────────────────────────────
interface TotalCardProps {
  totalBudget: Budget | undefined;
  totalSpent: number;
  month: string;
  onEdit: () => void;
}

const TotalCard: React.FC<TotalCardProps> = React.memo(
  ({ totalBudget, totalSpent, month, onEdit }) => {
    const limit = totalBudget?.monthly_limit ?? 0;
    const remaining = limit - totalSpent;
    const ratio = limit > 0 ? totalSpent / limit : 0;
    const pct = Math.min(Math.round(ratio * 100), 100);
    const isOver = ratio >= 1;

    return (
      <View style={heroStyles.card}>
        <View style={heroStyles.headerRow}>
          <Text style={heroStyles.eyebrow}>
            {formatMonthLabel(month).toUpperCase()}
          </Text>
          <TouchableOpacity
            onPress={onEdit}
            style={heroStyles.editBtn}
            activeOpacity={0.85}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather
              name={limit > 0 ? "edit-2" : "plus"}
              size={14}
              color={Colors.white}
            />
          </TouchableOpacity>
        </View>

        <Text style={heroStyles.label}>Total Monthly Budget</Text>
        <Text style={heroStyles.amount}>
          {limit > 0 ? formatCurrency(limit) : "No limit set"}
        </Text>

        {limit > 0 ? (
          <>
            <View style={heroStyles.barRow}>
              <View style={heroStyles.track}>
                <View
                  style={[
                    heroStyles.fill,
                    {
                      width: `${pct}%`,
                      backgroundColor: isOver
                        ? Colors.danger
                        : ratio >= 0.8
                          ? Colors.brandBlack
                          : Colors.accent,
                    },
                  ]}
                />
              </View>
              <Text style={heroStyles.pctText}>{pct}%</Text>
            </View>

            <View style={heroStyles.metaRow}>
              <Text style={heroStyles.metaText}>
                Spent {formatCurrency(totalSpent)}
              </Text>
              <Text
                style={[
                  heroStyles.metaText,
                  isOver && { color: Colors.danger },
                ]}
              >
                {remaining < 0
                  ? `${formatCurrency(Math.abs(remaining))} over`
                  : `${formatCurrency(remaining)} left`}
              </Text>
            </View>
          </>
        ) : (
          <Text style={heroStyles.noBudgetSubtext}>
            Tap the + icon to set a monthly limit
          </Text>
        )}
      </View>
    );
  },
);
TotalCard.displayName = "TotalCard";

const heroStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.primary,
    borderRadius: 26,
    padding: 22,
    marginBottom: Spacing.md,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 0,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.textOnLime,
    opacity: 0.75,
    letterSpacing: 1.3,
  },
  editBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.brandBlack,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textOnLime,
    marginBottom: 4,
  },
  amount: {
    fontSize: 40,
    fontWeight: "800",
    color: Colors.textOnLime,
    letterSpacing: -1.5,
    marginBottom: 14,
  },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  track: {
    flex: 1,
    height: 8,
    borderRadius: 99,
    backgroundColor: "rgba(15,17,21,0.18)",
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 99,
  },
  pctText: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.textOnLime,
    minWidth: 36,
    textAlign: "right",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  metaText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textOnLime,
    opacity: 0.85,
  },
  noBudgetSubtext: {
    fontSize: 13,
    color: Colors.textOnLime,
    opacity: 0.75,
    fontWeight: "600",
    marginTop: -8,
  },
});

// ─── Add / Edit Modal ──────────────────────────────────────────────────────────
interface BudgetModalProps {
  visible: boolean;
  editBudget: Budget | null;
  month: string;
  categories: Category[];
  usedCategoryIds: Set<string | null>;
  onClose: () => void;
  onSave: (categoryId: string | null, limit: number) => Promise<void>;
  isSaving: boolean;
}

const BudgetModal: React.FC<BudgetModalProps> = ({
  visible,
  editBudget,
  month,
  categories,
  usedCategoryIds,
  onClose,
  onSave,
  isSaving,
}) => {
  const [limitText, setLimitText] = useState("");
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const insets = useInsets();

  useEffect(() => {
    if (visible) {
      setLimitText(editBudget ? String(editBudget.monthly_limit) : "");
      setSelectedCatId(editBudget ? editBudget.category_id : null);
      setError(null);
    }
  }, [visible, editBudget]);

  const availableCategories = useMemo(() => {
    if (editBudget) return categories;
    return categories.filter((c) => !usedCategoryIds.has(c.id));
  }, [categories, usedCategoryIds, editBudget]);

  const handleSave = async () => {
    const limit = parseFloat(limitText.replace(/,/g, ""));
    if (!limitText.trim() || isNaN(limit) || limit <= 0) {
      setError("Please enter a valid positive amount");
      return;
    }
    setError(null);
    await onSave(selectedCatId, limit);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={modalStyles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ width: "100%" }}
        >
          <View
            style={[
              modalStyles.sheet,
              { paddingBottom: insets.bottom + Spacing.lg },
            ]}
          >
            <View style={modalStyles.handle} />

            <View style={modalStyles.titleRow}>
              <View>
                <Text style={modalStyles.title}>
                  {editBudget ? "Edit Budget" : "Set Budget"}
                </Text>
                <Text style={modalStyles.monthChip}>
                  {formatMonthLabel(month)}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={modalStyles.closeBtn}>
                <Feather name="x" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            {!editBudget && (
              <View style={modalStyles.section}>
                <Text style={modalStyles.sectionLabel}>Category</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={modalStyles.catScrollContent}
                >
                  <TouchableOpacity
                    style={[
                      modalStyles.catPill,
                      selectedCatId === null && modalStyles.catPillSelected,
                      usedCategoryIds.has(null) &&
                        selectedCatId !== null &&
                        modalStyles.catPillDisabled,
                    ]}
                    onPress={() => {
                      if (!usedCategoryIds.has(null)) setSelectedCatId(null);
                    }}
                    disabled={
                      usedCategoryIds.has(null) && selectedCatId !== null
                    }
                  >
                    <Feather
                      name="layers"
                      size={12}
                      color={
                        selectedCatId === null
                          ? Colors.white
                          : Colors.textSecondary
                      }
                    />
                    <Text
                      style={[
                        modalStyles.catPillText,
                        selectedCatId === null &&
                          modalStyles.catPillTextSelected,
                      ]}
                    >
                      Total
                    </Text>
                  </TouchableOpacity>

                  {availableCategories.map((c) => {
                    const isSel = selectedCatId === c.id;
                    return (
                      <TouchableOpacity
                        key={c.id}
                        style={[
                          modalStyles.catPill,
                          isSel && modalStyles.catPillSelected,
                        ]}
                        onPress={() => setSelectedCatId(c.id)}
                      >
                        <View
                          style={[
                            modalStyles.catDot,
                            { backgroundColor: c.color },
                          ]}
                        />
                        <Text
                          style={[
                            modalStyles.catPillText,
                            isSel && modalStyles.catPillTextSelected,
                          ]}
                          numberOfLines={1}
                        >
                          {c.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            <View style={modalStyles.section}>
              <Text style={modalStyles.sectionLabel}>Monthly Limit</Text>
              <View style={modalStyles.inputWrapper}>
                <Text style={modalStyles.currencySymbol}>₹</Text>
                <TextInput
                  style={modalStyles.input}
                  value={limitText}
                  onChangeText={(t) => {
                    setLimitText(t);
                    setError(null);
                  }}
                  placeholder="0"
                  placeholderTextColor={Colors.inputPlaceholder}
                  keyboardType="numeric"
                  selectionColor={Colors.brandBlack}
                  cursorColor={Colors.brandBlack}
                  autoFocus
                />
              </View>
              {error && <Text style={modalStyles.errorText}>{error}</Text>}
            </View>

            <TouchableOpacity
              style={[modalStyles.saveBtn, isSaving && { opacity: 0.65 }]}
              onPress={handleSave}
              disabled={isSaving}
              activeOpacity={0.85}
            >
              {isSaving ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <Text style={modalStyles.saveBtnText}>
                  {editBudget ? "Update Budget" : "Set Budget"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.transparent,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 0,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.surfaceBorder,
    alignSelf: "center",
    marginBottom: Spacing.md,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 19,
    fontWeight: "800",
    color: Colors.textPrimary,
    letterSpacing: -0.4,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  monthChip: {
    fontSize: 12,
    color: Colors.accent,
    fontWeight: "700",
    marginTop: 2,
    letterSpacing: 0.2,
  },
  section: {
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.textSecondary,
    marginBottom: 10,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  catScrollContent: {
    gap: 8,
    paddingVertical: 2,
  },
  catPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 99,
    backgroundColor: Colors.surfaceElevated,
  },
  catPillSelected: {
    backgroundColor: Colors.brandBlack,
  },
  catPillDisabled: {
    opacity: 0.4,
  },
  catPillText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  catPillTextSelected: {
    color: Colors.white,
  },
  catDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 54,
  },
  currencySymbol: {
    fontSize: 19,
    fontWeight: "800",
    color: Colors.accent,
    marginRight: 6,
  },
  input: {
    flex: 1,
    fontSize: 19,
    fontWeight: "700",
    color: Colors.textPrimary,
    paddingVertical: Spacing.sm,
    letterSpacing: -0.5,
  },
  errorText: {
    fontSize: 12,
    color: Colors.danger,
    marginTop: 6,
    marginLeft: 2,
    fontWeight: "600",
  },
  saveBtn: {
    backgroundColor: Colors.brandBlack,
    borderRadius: 99,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
    marginTop: 4,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.white,
    letterSpacing: -0.2,
  },
});

// ─── Key extractor ─────────────────────────────────────────────────────────────
const keyExtractor = (item: Budget) => item.id;

// ─── Budget Screen ─────────────────────────────────────────────────────────────
export const BudgetScreen: React.FC = () => {
  const insets = useInsets();
  const month = useMemo(() => currentMonthKey(), []);
  const didFetch = useRef(false);

  const budgets = useFinanceStore(selectBudgets);
  const budgetsLoading = useFinanceStore(selectBudgetsLoading);
  const expenses = useFinanceStore(selectExpenses);
  const categories = useFinanceStore(selectCategories);
  const fetchBudgets = useFinanceStore((s) => s.fetchBudgets);
  const fetchExpenses = useFinanceStore((s) => s.fetchExpenses);
  const fetchCategories = useFinanceStore((s) => s.fetchCategories);
  const upsertBudget = useFinanceStore((s) => s.upsertBudget);
  const removeBudget = useFinanceStore((s) => s.removeBudget);

  const [modalVisible, setModalVisible] = useState(false);
  const [editBudget, setEditBudget] = useState<Budget | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch once on first focus only; the store no-ops on subsequent
  // focuses if data is already cached, but doing it once avoids even
  // re-evaluating the focus effect cost.
  useFocusEffect(
    useCallback(() => {
      if (didFetch.current) return;
      didFetch.current = true;
      fetchBudgets(month);
      fetchExpenses();
      fetchCategories();
    }, [month, fetchBudgets, fetchExpenses, fetchCategories]),
  );

  const monthExpenses = useMemo(() => {
    const [y, m] = month.split("-").map(Number);
    return expenses.filter((e) => {
      const d = new Date(e.date);
      return d.getFullYear() === y && d.getMonth() + 1 === m;
    });
  }, [expenses, month]);

  const totalSpent = useMemo(
    () => monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0),
    [monthExpenses],
  );

  const categorySpentMap = useMemo(() => {
    const map = new Map<string, number>();
    monthExpenses.forEach((e) => {
      if (e.category_id) {
        map.set(
          e.category_id,
          (map.get(e.category_id) ?? 0) + Number(e.amount),
        );
      }
    });
    return map;
  }, [monthExpenses]);

  const categoryMap = useMemo(() => {
    const m = new Map<string, Category>();
    categories.forEach((c) => m.set(c.id, c));
    return m;
  }, [categories]);

  const totalBudget = useMemo(
    () => budgets.find((b) => b.category_id === null),
    [budgets],
  );

  const categoryBudgets = useMemo(
    () => budgets.filter((b) => b.category_id !== null),
    [budgets],
  );

  const usedCategoryIds = useMemo<Set<string | null>>(
    () => new Set(budgets.map((b) => b.category_id)),
    [budgets],
  );

  const openAdd = useCallback(() => {
    setEditBudget(null);
    setModalVisible(true);
  }, []);

  const openEditTotal = useCallback(() => {
    setEditBudget(totalBudget ?? null);
    setModalVisible(true);
  }, [totalBudget]);

  const openEdit = useCallback((budget: Budget) => {
    setEditBudget(budget);
    setModalVisible(true);
  }, []);

  const handleDelete = useCallback(
    (budget: Budget) => {
      const catName =
        budget.category_id === null
          ? "Total Monthly Budget"
          : (categoryMap.get(budget.category_id)?.name ?? "this budget");
      Alert.alert("Delete Budget", `Remove "${catName}"?`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const err = await removeBudget(budget.id);
            if (err) Alert.alert("Error", err);
          },
        },
      ]);
    },
    [categoryMap, removeBudget],
  );

  const handleSave = useCallback(
    async (categoryId: string | null, limit: number) => {
      setIsSaving(true);
      const err = await upsertBudget(categoryId, limit, month);
      setIsSaving(false);
      if (err) {
        Alert.alert("Error", err);
      } else {
        setModalVisible(false);
      }
    },
    [upsertBudget, month],
  );

  const renderItem = useCallback<ListRenderItem<Budget>>(
    ({ item, index }) => (
      <BudgetRow
        budget={item}
        category={
          item.category_id ? categoryMap.get(item.category_id) : undefined
        }
        spent={
          item.category_id ? (categorySpentMap.get(item.category_id) ?? 0) : 0
        }
        onEdit={openEdit}
        onDelete={handleDelete}
        index={index}
      />
    ),
    [categoryMap, categorySpentMap, openEdit, handleDelete],
  );

  const listHeader = useMemo(
    () => (
      <View style={screenStyles.headerWrap}>
        <View style={screenStyles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={screenStyles.eyebrow}>FINANCIAL PLAN</Text>
            <Text style={screenStyles.title}>Budget</Text>
          </View>
          <TouchableOpacity
            style={screenStyles.addBtn}
            onPress={openAdd}
            activeOpacity={0.85}
          >
            <Feather name="plus" size={15} color={Colors.textOnLime} />
            <Text style={screenStyles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>

        <TotalCard
          totalBudget={totalBudget}
          totalSpent={totalSpent}
          month={month}
          onEdit={openEditTotal}
        />

        <View style={screenStyles.sectionHeader}>
          <Text style={screenStyles.sectionTitle}>Budgets by Category</Text>
          {categoryBudgets.length > 0 && (
            <Text style={screenStyles.sectionCount}>
              {categoryBudgets.length} active
            </Text>
          )}
        </View>
      </View>
    ),
    [
      month,
      totalBudget,
      totalSpent,
      categoryBudgets.length,
      openAdd,
      openEditTotal,
    ],
  );

  const listFooter = useMemo(
    () => (
      <View
        style={{
          height: TAB_BAR_HEIGHT + insets.bottom + Spacing.xl,
        }}
      />
    ),
    [insets.bottom],
  );

  const listEmpty = useMemo(
    () =>
      !budgetsLoading && categoryBudgets.length === 0 ? (
        <View style={screenStyles.emptyBox}>
          <View style={screenStyles.emptyIconWrap}>
            <Feather name="pie-chart" size={22} color={Colors.accent} />
          </View>
          <Text style={screenStyles.emptyTitle}>No category budgets</Text>
          <Text style={screenStyles.emptySubtitle}>
            Tap{" "}
            <Text style={screenStyles.emptyAccent}>+ Add</Text> to track
            {"\n"}spending per category
          </Text>
        </View>
      ) : null,
    [budgetsLoading, categoryBudgets.length],
  );

  if (budgetsLoading && budgets.length === 0) {
    return (
      <SafeAreaView style={screenStyles.root} edges={["top", "left", "right"]}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
        <View style={screenStyles.listContent}>
          {listHeader}
          {[0, 1, 2, 3].map((i) => (
            <BudgetRowSkeleton key={i} index={i} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={screenStyles.root} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <FadeIn duration={360} style={{ flex: 1 }}>
        <FlatList
          data={categoryBudgets}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListHeaderComponent={listHeader}
          ListFooterComponent={listFooter}
          ListEmptyComponent={listEmpty}
          contentContainerStyle={screenStyles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={6}
          maxToRenderPerBatch={6}
          windowSize={5}
          removeClippedSubviews={Platform.OS === "android"}
        />
      </FadeIn>

      {modalVisible && (
        <BudgetModal
          visible={modalVisible}
          editBudget={editBudget}
          month={month}
          categories={categories}
          usedCategoryIds={usedCategoryIds}
          onClose={() => setModalVisible(false)}
          onSave={handleSave}
          isSaving={isSaving}
        />
      )}
    </SafeAreaView>
  );
};

// ─── Screen Styles ─────────────────────────────────────────────────────────────
const screenStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loaderContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
  },
  headerWrap: {
    paddingTop: Spacing.md,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textMuted,
    letterSpacing: 1.4,
    marginBottom: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.textPrimary,
    letterSpacing: -0.8,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 99,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 0,
  },
  addBtnText: {
    color: Colors.textOnLime,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
    marginTop: 4,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.textPrimary,
    letterSpacing: -0.4,
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.accent,
  },
  emptyBox: {
    alignItems: "center",
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
    gap: 8,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 0,
  },
  emptyTitle: {
    fontSize: 17,
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
});
