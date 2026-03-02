import React, { useState } from "react";
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
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useForm, Controller } from "react-hook-form";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFocusEffect, CommonActions } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFinanceStore } from "../../store/finance.store";
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
  ExpensesStackParamList,
  PaymentMethod,
} from "../../types";

// ─── Types ─────────────────────────────────────────────────────────────────────
type Props = {
  navigation: NativeStackNavigationProp<ExpensesStackParamList, "AddExpense">;
};

// ─── Payment Method Options ────────────────────────────────────────────────────
const PAYMENT_METHODS: { label: string; value: PaymentMethod }[] = [
  { label: "Cash", value: "cash" },
  { label: "Card", value: "card" },
  { label: "UPI", value: "upi" },
  { label: "Bank Transfer", value: "bank_transfer" },
  { label: "Other", value: "other" },
];

// ─── Add Expense Screen ────────────────────────────────────────────────────────
export const AddExpenseScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const addExpense = useFinanceStore((s) => s.addExpense);
  const fetchCategories = useFinanceStore((s) => s.fetchCategories);
  const categories = useFinanceStore((s) => s.categories);
  const categoriesLoading = useFinanceStore((s) => s.categoriesLoading);

  const [isSubmitting, setIsSubmitting] = useState(false);

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

  useFocusEffect(
    React.useCallback(() => {
      if (categories.length === 0) {
        fetchCategories();
      }
    }, [fetchCategories, categories.length]),
  );

  const onSubmit = async (values: AddExpenseFormValues) => {
    if (isSubmitting) return;
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
      navigation.goBack(); // component unmounts — no further state updates needed
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      {/* Header — outside ScrollView so back button is always accessible */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
          disabled={isSubmitting}
          style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
        >
          <Feather name="arrow-left" size={22} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Add Expense</Text>
        <View style={{ width: 24 }} />
      </View>

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
          {/* Amount */}
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
              <InputField
                label="Amount"
                placeholder="0.00"
                keyboardType="decimal-pad"
                returnKeyType="next"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.amount?.message}
                editable={!isSubmitting}
              />
            )}
          />

          {/* Category */}
          <View style={styles.sectionContainer}>
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
                  <Text style={styles.loadingText}>Loading categories...</Text>
                ) : categories.length === 0 ? (
                  <TouchableOpacity
                    style={styles.noCategoryBox}
                    onPress={() =>
                      navigation.dispatch(
                        CommonActions.navigate({
                          name: "Settings",
                          params: { screen: "CategoryList" },
                        }),
                      )
                    }
                    disabled={isSubmitting}
                  >
                    <Feather
                      name="alert-circle"
                      size={14}
                      color={Colors.warning}
                    />
                    <Text style={styles.noCategoryText}>
                      No categories found. Tap to setup categories in Settings.
                    </Text>
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
                              backgroundColor: cat.color,
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
                              {
                                backgroundColor: isSelected
                                  ? "rgba(255,255,255,0.85)"
                                  : cat.color,
                              },
                            ]}
                          />
                          <Text
                            style={[
                              styles.categoryChipText,
                              isSelected && { color: Colors.white },
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
                        navigation.dispatch(
                          CommonActions.navigate({
                            name: "Settings",
                            params: {
                              screen: "AddCategory",
                              params: { fromAddExpense: true },
                            },
                          }),
                        )
                      }
                      activeOpacity={0.75}
                      disabled={isSubmitting}
                    >
                      <Feather
                        name="plus"
                        size={16}
                        color={Colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          />

          {/* Date */}
          <Controller
            control={control}
            name="date"
            rules={{
              required: "Date is required",
              pattern: {
                value: /^\d{4}-\d{2}-\d{2}$/,
                message: "Use YYYY-MM-DD format",
              },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <InputField
                label="Date"
                placeholder={todayISO()}
                keyboardType="numbers-and-punctuation"
                returnKeyType="next"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.date?.message}
                editable={!isSubmitting}
              />
            )}
          />

          {/* Note */}
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
              />
            )}
          />

          {/* Payment Method */}
          <Text style={styles.sectionLabel}>Payment Method</Text>
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

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },

  sectionContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
    marginTop: Spacing.xs,
  },
  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textMuted,
    letterSpacing: 0.8,
    textTransform: "uppercase",
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
  noCategoryBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: `${Colors.warning}12`,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${Colors.warning}40`,
  },
  noCategoryText: {
    color: Colors.warning,
    fontSize: FontSize.sm,
    flex: 1,
  },

  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    // Two chips per row with gap accounted for
    flexBasis: "47%",
    flexGrow: 1,
    paddingVertical: 11,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    gap: 8,
  },
  addCategoryChip: {
    width: 52,
    height: 43,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  categoryDot: { width: 9, height: 9, borderRadius: 5, flexShrink: 0 },
  categoryChipText: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: FontWeight.medium,
    flex: 1,
  },

  paymentGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  paymentChip: {
    flexBasis: "47%",
    flexGrow: 0,
    paddingVertical: 11,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentChipSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  paymentText: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: FontWeight.medium,
  },
  paymentTextSelected: {
    color: Colors.white,
    fontWeight: FontWeight.semibold,
  },

  spacer: { flex: 1, minHeight: Spacing.lg },
});
