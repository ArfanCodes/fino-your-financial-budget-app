import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useForm, Controller } from "react-hook-form";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useRoute, RouteProp } from "@react-navigation/native";
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
import type {
  AddCategoryFormValues,
  SettingsStackParamList,
} from "../../types";

// ─── Types ─────────────────────────────────────────────────────────────────────
type Props = {
  navigation: NativeStackNavigationProp<SettingsStackParamList, "AddCategory">;
};

// ─── Preset Colors ─────────────────────────────────────────────────────────────
const PRESET_COLORS = [
  "#F87171",
  "#FB923C",
  "#FBBF24",
  "#4ADE80",
  "#34D399",
  "#38BDF8",
  "#60A5FA",
  "#818CF8",
  "#A78BFA",
  "#F472B6",
  "#94A3B8",
  "#64748B",
];

// ─── Add Category Screen ───────────────────────────────────────────────────────
export const AddCategoryScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const route = useRoute<RouteProp<SettingsStackParamList, "AddCategory">>();
  const fromAddExpense = route.params?.fromAddExpense ?? false;
  const addCategory = useFinanceStore((s) => s.addCategory);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[7]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AddCategoryFormValues>({
    defaultValues: { name: "", color: PRESET_COLORS[7] },
    mode: "onBlur",
  });

  const onSubmit = async (values: AddCategoryFormValues) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const error = await addCategory(values.name.trim(), selectedColor);

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
          onPress={() =>
            fromAddExpense
              ? navigation.navigate("CategoryList")
              : navigation.goBack()
          }
          hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
          style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
        >
          <Feather name="arrow-left" size={22} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>New Category</Text>
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
          {/* Preview */}
          <View style={styles.previewRow}>
            <View
              style={[styles.previewSwatch, { backgroundColor: selectedColor }]}
            />
            <View>
              <Text style={styles.previewLabel}>Preview</Text>
              <Text style={styles.previewHint}>Select a color below</Text>
            </View>
          </View>

          {/* Name Input */}
          <Controller
            control={control}
            name="name"
            rules={{
              required: "Category name is required",
              minLength: { value: 2, message: "Minimum 2 characters" },
              maxLength: { value: 30, message: "Maximum 30 characters" },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <InputField
                label="Category Name"
                placeholder="e.g. Food & Dining"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.name?.message}
                returnKeyType="done"
                onSubmitEditing={handleSubmit(onSubmit)}
              />
            )}
          />

          {/* Color Picker */}
          <Text style={styles.colorLabel}>Color</Text>
          <View style={styles.colorGrid}>
            {PRESET_COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: color },
                  selectedColor === color && styles.colorSwatchSelected,
                ]}
                onPress={() => setSelectedColor(color)}
                activeOpacity={0.8}
              >
                {selectedColor === color ? (
                  <Feather name="check" size={14} color={Colors.white} />
                ) : null}
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.spacer} />

          <Button
            label="Create Category"
            onPress={handleSubmit(onSubmit)}
            isLoading={isSubmitting}
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

  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.surfaceBorder,
    gap: Spacing.md,
  },
  previewSwatch: {
    width: 40,
    height: 40,
    borderRadius: 10,
  },
  previewLabel: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: FontWeight.medium,
    marginBottom: 2,
  },
  previewHint: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },

  colorLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textMuted,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: Spacing.sm,
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  colorSwatch: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  colorSwatchSelected: {
    borderWidth: 2.5,
    borderColor: Colors.white,
  },

  spacer: { flex: 1, minHeight: Spacing.xl },
});
