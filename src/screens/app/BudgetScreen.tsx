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
  Animated,
  StatusBar,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets as useInsets } from "react-native-safe-area-context";
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
  FontSize,
  FontWeight,
  Radius,
  Spacing,
  TAB_BAR_HEIGHT,
} from "../../utils/constants";
import { formatCurrency } from "../../utils/helpers";
import type { Budget, Category } from "../../types";

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Returns "YYYY-MM" for the current month */
function currentMonthKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/** Returns a human-readable label like "March 2026" */
function formatMonthLabel(monthKey: string): string {
  const [y, m] = monthKey.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

// ─── Progress bar color based on ratio ────────────────────────────────────────
function progressColor(ratio: number): string {
  if (ratio >= 1) return Colors.danger;
  if (ratio >= 0.8) return Colors.warning;
  return Colors.success;
}

// ─── Budget Item Row ───────────────────────────────────────────────────────────
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
    const remaining = limit - spent;
    const ratio = limit > 0 ? spent / limit : 0;
    const pctLabel = `${Math.min(Math.round(ratio * 100), 100)}%`;
    const barColor = progressColor(ratio);
    const catColor = category?.color ?? Colors.primary;

    const barAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.timing(barAnim, {
        toValue: Math.min(ratio, 1),
        duration: 600,
        delay: index * 80,
        useNativeDriver: false,
      }).start();
    }, [ratio]);

    return (
      <View style={rowStyles.card}>
        {/* Header */}
        <View style={rowStyles.header}>
          <View style={rowStyles.labelRow}>
            <View
              style={[rowStyles.dot, { backgroundColor: catColor }]}
            />
            <Text style={rowStyles.categoryName} numberOfLines={1}>
              {category?.name ?? "Uncategorized"}
            </Text>
          </View>
          <View style={rowStyles.actions}>
            <TouchableOpacity
              onPress={() => onEdit(budget)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={rowStyles.iconBtn}
            >
              <Feather name="edit-2" size={13} color={Colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onDelete(budget)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={rowStyles.iconBtn}
            >
              <Feather name="trash-2" size={13} color={Colors.danger} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Progress bar track */}
        <View style={rowStyles.track}>
          <Animated.View
            style={[
              rowStyles.fill,
              {
                backgroundColor: barColor,
                width: barAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          />
        </View>

        {/* Stats row */}
        <View style={rowStyles.statsRow}>
          <View>
            <Text style={rowStyles.statsLabel}>Spent</Text>
            <Text style={[rowStyles.statsValue, { color: barColor }]}>
              {formatCurrency(spent)}
            </Text>
          </View>
          <View style={{ alignItems: "center" }}>
            <Text style={rowStyles.statsLabel}>Progress</Text>
            <Text style={[rowStyles.statsValue, { color: barColor }]}>
              {pctLabel}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={rowStyles.statsLabel}>Remaining</Text>
            <Text
              style={[
                rowStyles.statsValue,
                { color: remaining < 0 ? Colors.danger : Colors.textPrimary },
              ]}
            >
              {remaining < 0
                ? `-${formatCurrency(Math.abs(remaining))}`
                : formatCurrency(remaining)}
            </Text>
          </View>
        </View>

        {/* Limit row */}
        <Text style={rowStyles.limitText}>
          Limit: {formatCurrency(limit)} / month
        </Text>
      </View>
    );
  }
);

BudgetRow.displayName = "BudgetRow";

const rowStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.surfaceBorder,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    flex: 1,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  categoryName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  iconBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  track: {
    height: 6,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.full,
    overflow: "hidden",
    marginBottom: Spacing.sm,
  },
  fill: {
    height: "100%",
    borderRadius: Radius.full,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  statsValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  limitText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
});

// ─── Add / Edit Budget Modal ───────────────────────────────────────────────────
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

  // Populate form when opening for edit
  useEffect(() => {
    if (visible) {
      setLimitText(
        editBudget ? String(editBudget.monthly_limit) : ""
      );
      setSelectedCatId(editBudget ? editBudget.category_id : null);
      setError(null);
    }
  }, [visible, editBudget]);

  const availableCategories = useMemo(() => {
    if (editBudget) return categories; // editing: show all categories
    // creating: exclude categories that already have a budget for this month
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
            {/* Handle */}
            <View style={modalStyles.handle} />

            {/* Title */}
            <View style={modalStyles.titleRow}>
              <Text style={modalStyles.title}>
                {editBudget ? "Edit Budget" : "Set Budget"}
              </Text>
              <TouchableOpacity onPress={onClose} style={modalStyles.closeBtn}>
                <Feather name="x" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={modalStyles.monthChip}>{formatMonthLabel(month)}</Text>

            {/* Category Selector (only when creating) */}
            {!editBudget && (
              <View style={modalStyles.section}>
                <Text style={modalStyles.sectionLabel}>Category</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={modalStyles.catScrollContent}
                >
                  {/* Total Budget pill */}
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
                          : Colors.textMuted
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

                  {availableCategories.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      style={[
                        modalStyles.catPill,
                        selectedCatId === c.id && modalStyles.catPillSelected,
                        { borderColor: `${c.color}55` },
                        selectedCatId === c.id && {
                          backgroundColor: c.color,
                          borderColor: c.color,
                        },
                      ]}
                      onPress={() => setSelectedCatId(c.id)}
                    >
                      <View
                        style={[
                          modalStyles.catDot,
                          {
                            backgroundColor:
                              selectedCatId === c.id ? Colors.white : c.color,
                          },
                        ]}
                      />
                      <Text
                        style={[
                          modalStyles.catPillText,
                          selectedCatId === c.id &&
                            modalStyles.catPillTextSelected,
                        ]}
                        numberOfLines={1}
                      >
                        {c.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Limit Input */}
            <View style={modalStyles.section}>
              <Text style={modalStyles.sectionLabel}>Monthly Limit (₹)</Text>
              <View style={modalStyles.inputWrapper}>
                <Text style={modalStyles.currencySymbol}>₹</Text>
                <TextInput
                  style={modalStyles.input}
                  value={limitText}
                  onChangeText={(t) => {
                    setLimitText(t);
                    setError(null);
                  }}
                  placeholder="e.g. 10000"
                  placeholderTextColor={Colors.inputPlaceholder}
                  keyboardType="numeric"
                  selectionColor={Colors.primary}
                  cursorColor={Colors.primary}
                  autoFocus
                />
              </View>
              {error && <Text style={modalStyles.errorText}>{error}</Text>}
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[modalStyles.saveBtn, isSaving && { opacity: 0.65 }]}
              onPress={handleSave}
              disabled={isSaving}
              activeOpacity={0.8}
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
    backgroundColor: Colors.overlay,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.surfaceBorder,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.surfaceBorder,
    alignSelf: "center",
    marginBottom: Spacing.md,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
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
    fontSize: FontSize.xs,
    color: Colors.primaryLight,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.md,
    letterSpacing: 0.4,
  },
  section: {
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    letterSpacing: 0.3,
  },
  catScrollContent: {
    gap: Spacing.xs,
    paddingVertical: 2,
  },
  catPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.surfaceBorder,
    backgroundColor: Colors.surfaceElevated,
  },
  catPillSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  catPillDisabled: {
    opacity: 0.4,
  },
  catPillText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textMuted,
  },
  catPillTextSelected: {
    color: Colors.white,
  },
  catDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.inputBackground,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
    paddingHorizontal: Spacing.md,
    minHeight: 52,
  },
  currencySymbol: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
    marginRight: 4,
  },
  input: {
    flex: 1,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    paddingVertical: Spacing.sm,
  },
  errorText: {
    fontSize: FontSize.xs,
    color: Colors.danger,
    marginTop: Spacing.xs,
    marginLeft: 2,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
    marginTop: Spacing.xs,
  },
  saveBtnText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.white,
    letterSpacing: 0.3,
  },
});

// ─── Total Budget Hero Card ────────────────────────────────────────────────────
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
    const barColor = progressColor(ratio);

    const barAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
      Animated.timing(barAnim, {
        toValue: Math.min(ratio, 1),
        duration: 700,
        useNativeDriver: false,
      }).start();
    }, [ratio]);

    return (
      <View style={heroStyles.card}>
        {/* Decorative orb */}
        <View
          style={[
            heroStyles.orb,
            { backgroundColor: `${Colors.primary}20` },
          ]}
        />

        <View style={heroStyles.topRow}>
          <View>
            <Text style={heroStyles.chipLabel}>
              {formatMonthLabel(month).toUpperCase()} · MONTHLY BUDGET
            </Text>
            <Text style={heroStyles.limitAmount}>
              {limit > 0 ? formatCurrency(limit) : "No limit set"}
            </Text>
          </View>
          <TouchableOpacity onPress={onEdit} style={heroStyles.editBtn}>
            <Feather name={limit > 0 ? "edit-2" : "plus"} size={16} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {limit > 0 && (
          <>
            {/* Progress bar */}
            <View style={heroStyles.track}>
              <Animated.View
                style={[
                  heroStyles.fill,
                  {
                    backgroundColor: barColor,
                    width: barAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0%", "100%"],
                    }),
                  },
                ]}
              />
            </View>

            {/* Stats */}
            <View style={heroStyles.statsRow}>
              <View>
                <Text style={heroStyles.statLabel}>Spent</Text>
                <Text style={[heroStyles.statValue, { color: barColor }]}>
                  {formatCurrency(totalSpent)}
                </Text>
              </View>
              <View style={{ alignItems: "center" }}>
                <Text style={heroStyles.statLabel}>Used</Text>
                <Text style={[heroStyles.statValue, { color: barColor }]}>
                  {pct}%
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={heroStyles.statLabel}>Remaining</Text>
                <Text
                  style={[
                    heroStyles.statValue,
                    {
                      color:
                        remaining < 0 ? Colors.danger : Colors.textPrimary,
                    },
                  ]}
                >
                  {remaining < 0
                    ? `-${formatCurrency(Math.abs(remaining))}`
                    : formatCurrency(remaining)}
                </Text>
              </View>
            </View>

            {ratio >= 1 && (
              <View style={heroStyles.warningBanner}>
                <Feather name="alert-triangle" size={12} color={Colors.danger} />
                <Text style={heroStyles.warningText}>
                  You've exceeded your monthly budget!
                </Text>
              </View>
            )}
            {ratio >= 0.8 && ratio < 1 && (
              <View
                style={[
                  heroStyles.warningBanner,
                  { backgroundColor: `${Colors.warning}18`, borderColor: `${Colors.warning}40` },
                ]}
              >
                <Feather name="alert-circle" size={12} color={Colors.warning} />
                <Text style={[heroStyles.warningText, { color: Colors.warning }]}>
                  You're close to your budget limit
                </Text>
              </View>
            )}
          </>
        )}

        {!totalBudget && (
          <Text style={heroStyles.noBudgetSubtext}>
            Tap + to set a total monthly spending limit
          </Text>
        )}
      </View>
    );
  }
);

TotalCard.displayName = "TotalCard";

const heroStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.surfaceBorder,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    overflow: "hidden",
  },
  orb: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    top: -60,
    right: -40,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  chipLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.primaryLight,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  limitAmount: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  track: {
    height: 8,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.full,
    overflow: "hidden",
    marginBottom: Spacing.md,
  },
  fill: {
    height: "100%",
    borderRadius: Radius.full,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginBottom: 3,
  },
  statValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: `${Colors.danger}18`,
    borderWidth: 1,
    borderColor: `${Colors.danger}40`,
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginTop: Spacing.md,
  },
  warningText: {
    fontSize: FontSize.xs,
    color: Colors.danger,
    fontWeight: FontWeight.medium,
  },
  noBudgetSubtext: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: -4,
  },
});

// ─── Key extractor ─────────────────────────────────────────────────────────────
const keyExtractor = (item: Budget) => item.id;

// ─── Budget Screen ─────────────────────────────────────────────────────────────
export const BudgetScreen: React.FC = () => {
  const insets = useInsets();
  const month = useMemo(() => currentMonthKey(), []);

  // Store selectors – granular to avoid re-renders
  const budgets = useFinanceStore(selectBudgets);
  const budgetsLoading = useFinanceStore(selectBudgetsLoading);
  const expenses = useFinanceStore(selectExpenses);
  const categories = useFinanceStore(selectCategories);
  const fetchBudgets = useFinanceStore((s) => s.fetchBudgets);
  const fetchExpenses = useFinanceStore((s) => s.fetchExpenses);
  const fetchCategories = useFinanceStore((s) => s.fetchCategories);
  const upsertBudget = useFinanceStore((s) => s.upsertBudget);
  const removeBudget = useFinanceStore((s) => s.removeBudget);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editBudget, setEditBudget] = useState<Budget | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // ── Load data on focus ──────────────────────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      fetchBudgets(month);
      fetchExpenses();
      fetchCategories();
    }, [month, fetchBudgets, fetchExpenses, fetchCategories])
  );

  // ── Memoized calculations ───────────────────────────────────────────────────

  /** All expenses for the selected month */
  const monthExpenses = useMemo(() => {
    const [y, m] = month.split("-").map(Number);
    return expenses.filter((e) => {
      const d = new Date(e.date);
      return d.getFullYear() === y && d.getMonth() + 1 === m;
    });
  }, [expenses, month]);

  /** Total amount spent this month */
  const totalSpent = useMemo(
    () => monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0),
    [monthExpenses]
  );

  /** Map of categoryId → amount spent this month */
  const categorySpentMap = useMemo(() => {
    const map = new Map<string, number>();
    monthExpenses.forEach((e) => {
      if (e.category_id) {
        map.set(e.category_id, (map.get(e.category_id) ?? 0) + Number(e.amount));
      }
    });
    return map;
  }, [monthExpenses]);

  /** Map of categoryId → Category for O(1) lookup */
  const categoryMap = useMemo(() => {
    const m = new Map<string, Category>();
    categories.forEach((c) => m.set(c.id, c));
    return m;
  }, [categories]);

  /** The "total" budget (category_id === null) */
  const totalBudget = useMemo(
    () => budgets.find((b) => b.category_id === null),
    [budgets]
  );

  /** Per-category budgets only */
  const categoryBudgets = useMemo(
    () => budgets.filter((b) => b.category_id !== null),
    [budgets]
  );

  /** Set of category IDs that already have a budget (to block duplicates in modal) */
  const usedCategoryIds = useMemo<Set<string | null>>(
    () => new Set(budgets.map((b) => b.category_id)),
    [budgets]
  );

  // ── Handlers ────────────────────────────────────────────────────────────────

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
          : categoryMap.get(budget.category_id)?.name ?? "this budget";
      Alert.alert(
        "Delete Budget",
        `Remove "${catName}"?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              const err = await removeBudget(budget.id);
              if (err) Alert.alert("Error", err);
            },
          },
        ]
      );
    },
    [categoryMap, removeBudget]
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
    [upsertBudget, month]
  );

  // ── Render helpers ──────────────────────────────────────────────────────────

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
    [categoryMap, categorySpentMap, openEdit, handleDelete]
  );

  const listHeader = useMemo(
    () => (
      <View style={{ paddingTop: insets.top + Spacing.md, paddingHorizontal: Spacing.md }}>
        {/* Screen header */}
        <View style={screenStyles.headerRow}>
          <View>
            <Text style={screenStyles.screenTitle}>Budget</Text>
            <Text style={screenStyles.screenSub}>
              {formatMonthLabel(month)}
            </Text>
          </View>
          <TouchableOpacity
            style={screenStyles.addBtn}
            onPress={openAdd}
            activeOpacity={0.8}
          >
            <Feather name="plus" size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Total budget hero */}
        <TotalCard
          totalBudget={totalBudget}
          totalSpent={totalSpent}
          month={month}
          onEdit={openEditTotal}
        />

        {/* Category budgets section header */}
        {categoryBudgets.length > 0 && (
          <View style={screenStyles.sectionHeader}>
            <Feather name="tag" size={14} color={Colors.textMuted} />
            <Text style={screenStyles.sectionTitle}>Category Budgets</Text>
          </View>
        )}
      </View>
    ),
    [
      insets.top,
      month,
      totalBudget,
      totalSpent,
      categoryBudgets.length,
      openAdd,
      openEditTotal,
    ]
  );

  const listFooter = useMemo(
    () => (
      <View
        style={{
          height: TAB_BAR_HEIGHT + insets.bottom + Spacing.xl,
        }}
      />
    ),
    [insets.bottom]
  );

  const listEmpty = useMemo(
    () =>
      !budgetsLoading && categoryBudgets.length === 0 ? (
        <View style={screenStyles.emptyBox}>
          <View style={screenStyles.emptyIconWrap}>
            <Feather name="pie-chart" size={24} color={Colors.textMuted} />
          </View>
          <Text style={screenStyles.emptyTitle}>No category budgets</Text>
          <Text style={screenStyles.emptySubtitle}>
            Tap{" "}
            <Text style={{ color: Colors.primary, fontWeight: FontWeight.bold }}>
              +
            </Text>{" "}
            to track spending per category
          </Text>
        </View>
      ) : null,
    [budgetsLoading, categoryBudgets.length]
  );

  if (budgetsLoading && budgets.length === 0) {
    return (
      <View style={screenStyles.loaderContainer}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={screenStyles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <FlatList
        data={categoryBudgets}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        ListEmptyComponent={listEmpty}
        contentContainerStyle={screenStyles.listContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
      />

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
    </View>
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
    paddingHorizontal: Spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  screenTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  screenSub: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: Spacing.sm,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
    letterSpacing: -0.2,
  },
  emptyBox: {
    alignItems: "center",
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.surfaceBorder,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  emptyTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
  },
  emptySubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
});
