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
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
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
            {
              text: "Continue",
              style: "destructive",
              onPress: () => resolve(true),
            },
          ],
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
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
          disabled={isSubmitting}
          style={({ pressed }) => [
            styles.backButton,
            { opacity: pressed ? 0.5 : 1 },
          ]}
        >
          <Feather name="arrow-left" size={18} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Add Expense</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Amount Hero Card (lime) */}
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
                placeholderTextColor="rgba(15,17,21,0.35)"
                keyboardType="decimal-pad"
                returnKeyType="next"
                value={formatAmountDisplay(value)}
                onChangeText={(text) => {
                  const raw = text.replace(/,/g, "");
                  onChange(raw);
                }}
                onBlur={onBlur}
                editable={!isSubmitting}
                selectionColor={Colors.brandBlack}
                cursorColor={Colors.brandBlack}
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
                                backgroundColor: Colors.brandBlack,
                              },
                            ]}
                            onPress={() =>
                              setValue("category_id", cat.id, {
                                shouldValidate: true,
                              })
                            }
                            activeOpacity={0.85}
                            disabled={isSubmitting}
                          >
                            <View
                              style={[
                                styles.categoryIcon,
                                {
                                  backgroundColor: isSelected
                                    ? `${cat.color}33`
                                    : `${cat.color}1F`,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.categoryIconLetter,
                                  { color: cat.color },
                                ]}
                              >
                                {cat.name.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                            <Text
                              style={[
                                styles.categoryChipText,
                                isSelected && styles.categoryChipTextSelected,
                              ]}
                              numberOfLines={1}
                            >
                              {cat.name}
                            </Text>
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
                          size={15}
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
                        size={15}
                        color={Colors.accent}
                      />
                    </View>
                    <View style={styles.datePickerInfo}>
                      <Text style={styles.datePickerLabel}>DATE</Text>
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
    </SafeAreaView>
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
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  backButton: {
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
  title: {
    fontSize: 17,
    fontWeight: "800",
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },

  // Amount card (lime hero — premium focus)
  amountCard: {
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 18,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 0,
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textOnLime,
    opacity: 0.75,
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
  },
  currencySymbol: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.textOnLime,
    lineHeight: 44,
  },
  amountDisplay: {
    fontSize: 40,
    fontWeight: "800",
    color: Colors.textOnLime,
    flex: 1,
    lineHeight: 52,
    paddingVertical: 0,
    includeFontPadding: false,
    letterSpacing: -1.5,
  },
  amountPlaceholder: {
    color: "rgba(15,17,21,0.35)",
  },
  amountError: {
    fontSize: 12,
    color: Colors.danger,
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginTop: 8,
    fontWeight: "700",
  },

  // Sections (borderless card)
  section: {
    marginBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: 22,
    padding: Spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 0,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  errorLabel: {
    fontSize: 11,
    color: Colors.danger,
    fontWeight: "600",
  },
  loadingText: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
    fontWeight: "600",
  },

  // No category
  noCategoryBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: `${Colors.warning}12`,
    borderRadius: 14,
    padding: 12,
  },
  noCategoryIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: `${Colors.warning}20`,
    alignItems: "center",
    justifyContent: "center",
  },
  noCategoryText: {
    color: Colors.warning,
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
  },

  // Category grid (pill with rounded-square icon)
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    flexBasis: "47%",
    flexGrow: 1,
    paddingVertical: 8,
    paddingLeft: 8,
    paddingRight: 14,
    borderRadius: 14,
    backgroundColor: Colors.surfaceElevated,
    gap: 10,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  categoryIconLetter: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  categoryChipText: {
    fontSize: 13.5,
    color: Colors.textPrimary,
    fontWeight: "700",
    flex: 1,
    letterSpacing: -0.2,
  },
  categoryChipTextSelected: {
    color: Colors.white,
  },
  addCategoryChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.surfaceBorder,
    borderStyle: "dashed",
  },
  addCategoryText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: "700",
  },

  // Payment method
  paymentGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  paymentChip: {
    flexBasis: "30%",
    flexGrow: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: Colors.surfaceElevated,
  },
  paymentChipSelected: {
    backgroundColor: Colors.brandBlack,
  },
  paymentIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentIconWrapSelected: {
    backgroundColor: "rgba(204,250,50,0.25)",
  },
  paymentText: {
    fontSize: 12.5,
    color: Colors.textPrimary,
    fontWeight: "700",
    flex: 1,
  },
  paymentTextSelected: {
    color: Colors.white,
  },

  // Date picker
  datePickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: Spacing.md,
  },
  datePickerBtnError: {
    backgroundColor: `${Colors.danger}10`,
  },
  datePickerIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: `${Colors.accent}1F`,
    alignItems: "center",
    justifyContent: "center",
  },
  datePickerInfo: {
    flex: 1,
    gap: 2,
  },
  datePickerLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  datePickerValue: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  dateError: {
    fontSize: 11,
    color: Colors.danger,
    marginTop: -Spacing.sm,
    marginBottom: Spacing.sm,
    marginLeft: 2,
    fontWeight: "600",
  },

  spacer: { flex: 1, minHeight: Spacing.lg },
});
