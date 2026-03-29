import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Pressable,
  Alert,
  StatusBar,
  TextInput,
} from "react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Feather } from "@expo/vector-icons";
import { useForm, Controller } from "react-hook-form";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFocusEffect, CommonActions } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFinanceStore } from "../../store/finance.store";
import { useBudgetStatus } from "../../hooks/useBudgetStatus";
import { Button } from "../../components/Button";
import { InputField } from "../../components/InputField";
import {
  Colors,
  Spacing,
  FontSize,
  FontWeight,
  Radius,
} from "../../utils/constants";
import { todayISO } from "../../utils/helpers";
import type {
  AddExpenseFormValues,
  TransactionsStackParamList,
  PaymentMethod,
} from "../../types";

// ─── Types ─────────────────────────────────────────────────────────────────────
type Props = {
  navigation: NativeStackNavigationProp<
    TransactionsStackParamList,
    "AddExpense"
  >;
};

// ─── Payment Method Options ────────────────────────────────────────────────────
const PAYMENT_METHODS: { label: string; value: PaymentMethod; icon: string }[] =
  [
    { label: "Cash", value: "cash", icon: "dollar-sign" },
    { label: "Card", value: "card", icon: "credit-card" },
    { label: "UPI", value: "upi", icon: "smartphone" },
    { label: "Bank Transfer", value: "bank_transfer", icon: "repeat" },
    { label: "Other", value: "other", icon: "more-horizontal" },
  ];

// ─── Add Expense Screen ────────────────────────────────────────────────────────
export const AddExpenseScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const addExpense = useFinanceStore((s) => s.addExpense);
  const fetchCategories = useFinanceStore((s) => s.fetchCategories);
  const categories = useFinanceStore((s) => s.categories);
  const categoriesLoading = useFinanceStore((s) => s.categoriesLoading);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Budget emergency detection — reads from existing store, no extra fetch
  const { state: budgetState } = useBudgetStatus();

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<AddExpenseFormValues>({
    defaultValues: {
      amount: "",
      category_id: "",
      date: todayISO(),
      note: "",
      payment_method: "cash",
    },
    mode: "onChange",
  });

  const watchCategoryId = watch("category_id");
  const watchPaymentMethod = watch("payment_method");
  const watchDate = watch("date");

  // ── Helpers ──────────────────────────────────────────────────────────────────
  /** Format a raw numeric string with Indian comma grouping for display */
  const formatAmountDisplay = useCallback((raw: string): string => {
    if (!raw) return "";
    // Split integer and decimal parts
    const [intPart, decPart] = raw.split(".");
    const formatted = new Intl.NumberFormat("en-IN").format(
      parseInt(intPart || "0", 10),
    );
    return decPart !== undefined ? `${formatted}.${decPart}` : formatted;
  }, []);

  /** Display the selected date nicely */
  const displayDate = useCallback((iso: string): string => {
    if (!iso) return "";
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (categories.length === 0) {
        fetchCategories();
      }
    }, [fetchCategories, categories.length]),
  );

  const onSubmit = async (values: AddExpenseFormValues) => {
    if (isSubmitting) return;

    // Non-blocking guidance when budget has already been exceeded.
    // We use a ref-style flag so Cancel truly aborts without setting isSubmitting.
    if (budgetState === "emergency") {
      const proceed = await new Promise<boolean>((resolve) => {
        Alert.alert(
          "Budget Exceeded",
          "This will increase your budget deficit. Continue anyway?",
          [
            { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
            { text: "Continue", style: "destructive", onPress: () => resolve(true) },
          ]
        );
      });
      if (!proceed) return; // User cancelled — keep form open
    }

    setIsSubmitting(true);

    const error = await addExpense({
      category_id: values.category_id,
      amount: parseFloat(values.amount),
      date: values.date || todayISO(),
      note: values.note.trim() || null,
      payment_method: values.payment_method,
    });

    if (error) {
      setIsSubmitting(false);
      Alert.alert("Error", error);
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
          disabled={isSubmitting}
          style={({ pressed }) => [
            styles.backButton,
            { opacity: pressed ? 0.5 : 1 },
          ]}
        >
          <Feather name="arrow-left" size={20} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Add Expense</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Amount Hero Card */}
      <Controller
        control={control}
        name="amount"
        rules={{
          required: "Amount is required",
          validate: (v) => {
            const n = parseFloat(v);
            return (!isNaN(n) && n > 0) || "Enter an amount greater than 0";
          },
        }}
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={styles.amountCard}>
            <Text style={styles.amountLabel}>AMOUNT</Text>
            <View style={styles.amountRow}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={[
                  styles.amountDisplay,
                  !value && styles.amountPlaceholder,
                ]}
                placeholder="0.00"
                placeholderTextColor={Colors.textMuted}
                keyboardType="decimal-pad"
                returnKeyType="next"
                value={formatAmountDisplay(value)}
                onChangeText={(text) => {
                  // Strip commas before storing — keep only digits and one dot
                  const raw = text.replace(/,/g, "");
                  onChange(raw);
                }}
                onBlur={onBlur}
                editable={!isSubmitting}
                selectionColor={Colors.primary}
                cursorColor={Colors.primary}
              />
            </View>
            {errors.amount && (
              <Text style={styles.amountError}>{errors.amount.message}</Text>
            )}
          </View>
        )}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + Spacing.xxl },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Category Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="tag" size={14} color={Colors.primary} />
              <Text style={styles.sectionLabel}>Category</Text>
              {errors.category_id && (
                <Text style={styles.errorLabel}>
                  {errors.category_id.message}
                </Text>
              )}
            </View>

            <Controller
              control={control}
              name="category_id"
              rules={{ required: "Please select a category" }}
              render={({ field: { value } }) => (
                <>
                  {categoriesLoading ? (
                    <Text style={styles.loadingText}>
                      Loading categories...
                    </Text>
                  ) : categories.length === 0 ? (
                    <TouchableOpacity
                      style={styles.noCategoryBox}
                      onPress={() => navigation.navigate("CategoryList")}
                      disabled={isSubmitting}
                    >
                      <View style={styles.noCategoryIconWrap}>
                        <Feather
                          name="alert-circle"
                          size={16}
                          color={Colors.warning}
                        />
                      </View>
                      <Text style={styles.noCategoryText}>
                        No categories found. Tap to set up in Settings.
                      </Text>
                      <Feather
                        name="chevron-right"
                        size={14}
                        color={Colors.warning}
                      />
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.categoryGrid}>
                      {categories.map((cat) => {
                        const isSelected = value === cat.id;
                        return (
                          <TouchableOpacity
                            key={cat.id}
                            style={[
                              styles.categoryChip,
                              isSelected && {
                                borderColor: cat.color,
                                backgroundColor: `${cat.color}22`,
                              },
                            ]}
                            onPress={() =>
                              setValue("category_id", cat.id, {
                                shouldValidate: true,
                              })
                            }
                            activeOpacity={0.75}
                            disabled={isSubmitting}
                          >
                            <View
                              style={[
                                styles.categoryDot,
                                { backgroundColor: cat.color },
                                isSelected && styles.categoryDotSelected,
                              ]}
                            />
                            <Text
                              style={[
                                styles.categoryChipText,
                                isSelected && {
                                  color: cat.color,
                                  fontWeight: FontWeight.semibold,
                                },
                              ]}
                              numberOfLines={1}
                            >
                              {cat.name}
                            </Text>
                            {isSelected && (
                              <Feather
                                name="check"
                                size={12}
                                color={cat.color}
                              />
                            )}
                          </TouchableOpacity>
                        );
                      })}
                      {/* Add Category shortcut */}
                      <TouchableOpacity
                        style={styles.addCategoryChip}
                        onPress={() =>
                          navigation.navigate("AddCategory", {
                            fromAddExpense: true,
                          })
                        }
                        activeOpacity={0.75}
                        disabled={isSubmitting}
                      >
                        <Feather
                          name="plus"
                          size={16}
                          color={Colors.textSecondary}
                        />
                        <Text style={styles.addCategoryText}>New</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}
            />
          </View>

          {/* Date & Note Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="calendar" size={14} color={Colors.primary} />
              <Text style={styles.sectionLabel}>Details</Text>
            </View>
            {/* Date Picker Trigger */}
            <Controller
              control={control}
              name="date"
              rules={{ required: "Date is required" }}
              render={({ field: { onChange, value } }) => (
                <>
                  <TouchableOpacity
                    style={[
                      styles.datePickerBtn,
                      errors.date && styles.datePickerBtnError,
                    ]}
                    onPress={() => setShowDatePicker(true)}
                    disabled={isSubmitting}
                    activeOpacity={0.75}
                  >
                    <View style={styles.datePickerIconWrap}>
                      <Feather
                        name="calendar"
                        size={16}
                        color={Colors.primary}
                      />
                    </View>
                    <View style={styles.datePickerInfo}>
                      <Text style={styles.datePickerLabel}>Date</Text>
                      <Text style={styles.datePickerValue}>
                        {value ? displayDate(value) : "Select a date"}
                      </Text>
                    </View>
                    <Feather
                      name="chevron-right"
                      size={16}
                      color={Colors.textMuted}
                    />
                  </TouchableOpacity>
                  {errors.date && (
                    <Text style={styles.dateError}>{errors.date.message}</Text>
                  )}
                  {showDatePicker && (
                    <DateTimePicker
                      value={value ? new Date(value + "T00:00:00") : new Date()}
                      mode="date"
                      display={Platform.OS === "ios" ? "spinner" : "default"}
                      maximumDate={new Date()}
                      onChange={(
                        _event: DateTimePickerEvent,
                        selected?: Date,
                      ) => {
                        setShowDatePicker(Platform.OS === "ios");
                        if (selected) {
                          const iso = selected.toISOString().split("T")[0];
                          onChange(iso);
                        }
                      }}
                    />
                  )}
                </>
              )}
            />
            <Controller
              control={control}
              name="note"
              render={({ field: { onChange, onBlur, value } }) => (
                <InputField
                  label="Note (optional)"
                  placeholder="What was this for?"
                  returnKeyType="done"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  editable={!isSubmitting}
                  leftIcon={
                    <Feather
                      name="file-text"
                      size={16}
                      color={Colors.textMuted}
                    />
                  }
                />
              )}
            />
          </View>

          {/* Payment Method Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="credit-card" size={14} color={Colors.primary} />
              <Text style={styles.sectionLabel}>Payment Method</Text>
            </View>
            <Controller
              control={control}
              name="payment_method"
              render={({ field: { value } }) => (
                <View style={styles.paymentGrid}>
                  {PAYMENT_METHODS.map((pm) => {
                    const isSelected = value === pm.value;
                    return (
                      <TouchableOpacity
                        key={pm.value}
                        style={[
                          styles.paymentChip,
                          isSelected && styles.paymentChipSelected,
                        ]}
                        onPress={() => setValue("payment_method", pm.value)}
                        activeOpacity={0.75}
                        disabled={isSubmitting}
                      >
                        <View
                          style={[
                            styles.paymentIconWrap,
                            isSelected && styles.paymentIconWrapSelected,
                          ]}
                        >
                          <Feather
                            name={pm.icon as any}
                            size={14}
                            color={
                              isSelected ? Colors.white : Colors.textSecondary
                            }
                          />
                        </View>
                        <Text
                          style={[
                            styles.paymentText,
                            isSelected && styles.paymentTextSelected,
                          ]}
                          numberOfLines={1}
                        >
                          {pm.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            />
          </View>

          <View style={styles.spacer} />

          <Button
            label="Save Expense"
            onPress={handleSubmit(onSubmit)}
            isLoading={isSubmitting}
            disabled={!isValid || isSubmitting}
            size="lg"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    letterSpacing: 0.2,
  },

  // Amount card
  amountCard: {
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  amountLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textMuted,
    letterSpacing: 1.2,
    marginBottom: Spacing.xs,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
  },
  currencySymbol: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    lineHeight: 44,
  },
  amountDisplay: {
    fontSize: 40,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    flex: 1,
    lineHeight: 52,
    paddingVertical: 0,
    includeFontPadding: false,
  },
  amountPlaceholder: {
    color: Colors.textMuted,
  },
  amountError: {
    fontSize: FontSize.xs,
    color: Colors.danger,
    marginTop: 4,
    fontWeight: FontWeight.medium,
  },

  // Sections
  section: {
    marginBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textMuted,
    letterSpacing: 0.9,
    textTransform: "uppercase",
    flex: 1,
  },
  errorLabel: {
    fontSize: 10,
    color: Colors.danger,
    fontWeight: FontWeight.medium,
  },
  loadingText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },

  // No category
  noCategoryBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: `${Colors.warning}12`,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${Colors.warning}40`,
  },
  noCategoryIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: `${Colors.warning}20`,
    alignItems: "center",
    justifyContent: "center",
  },
  noCategoryText: {
    color: Colors.warning,
    fontSize: FontSize.sm,
    flex: 1,
  },

  // Category grid
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    flexBasis: "47%",
    flexGrow: 1,
    paddingVertical: 10,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1.5,
    borderColor: Colors.surfaceBorder,
    gap: 7,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  categoryDotSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  categoryChipText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
    flex: 1,
  },
  addCategoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1.5,
    borderColor: Colors.surfaceBorder,
    borderStyle: "dashed",
  },
  addCategoryText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
  },

  // Payment method
  paymentGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  paymentChip: {
    flexBasis: "30%",
    flexGrow: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingVertical: 10,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1.5,
    borderColor: Colors.surfaceBorder,
  },
  paymentChipSelected: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}18`,
  },
  paymentIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentIconWrapSelected: {
    backgroundColor: Colors.primary,
  },
  paymentText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
    flex: 1,
  },
  paymentTextSelected: {
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },

  // Date picker
  datePickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.surfaceBorder,
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  datePickerBtnError: {
    borderColor: Colors.danger,
  },
  datePickerIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: `${Colors.primary}18`,
    alignItems: "center",
    justifyContent: "center",
  },
  datePickerInfo: {
    flex: 1,
    gap: 2,
  },
  datePickerLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  datePickerValue: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: FontWeight.semibold,
  },
  dateError: {
    fontSize: FontSize.xs,
    color: Colors.danger,
    marginTop: -Spacing.sm,
    marginBottom: Spacing.sm,
    marginLeft: 2,
    fontWeight: FontWeight.medium,
  },

  spacer: { flex: 1, minHeight: Spacing.lg },
});
