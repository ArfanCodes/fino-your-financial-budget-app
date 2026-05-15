import React, { useRef, useState } from "react";
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
  Animated,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useForm, Controller } from "react-hook-form";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useRoute, RouteProp } from "@react-navigation/native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
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
  CategoriesStackParamList,
} from "../../types";

// ─── Types ─────────────────────────────────────────────────────────────────────
type Props = {
  navigation: NativeStackNavigationProp<
    CategoriesStackParamList,
    "AddCategory"
  >;
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
  "#E879F9",
  "#94A3B8",
];

const COLOR_NAMES: Record<string, string> = {
  "#F87171": "Coral Red",
  "#FB923C": "Sunset Orange",
  "#FBBF24": "Golden Yellow",
  "#4ADE80": "Mint Green",
  "#34D399": "Emerald",
  "#38BDF8": "Sky Blue",
  "#60A5FA": "Sapphire",
  "#818CF8": "Indigo",
  "#A78BFA": "Violet",
  "#F472B6": "Rose Pink",
  "#E879F9": "Fuchsia",
  "#94A3B8": "Slate",
};

// ─── Color Swatch ─────────────────────────────────────────────────────────────
const ColorSwatch: React.FC<{
  color: string;
  selected: boolean;
  onPress: () => void;
}> = ({ color, selected, onPress }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 0.85,
        useNativeDriver: true,
        tension: 250,
        friction: 10,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 250,
        friction: 10,
      }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[
          swatchStyles.swatch,
          { backgroundColor: color },
          selected && [
            swatchStyles.selected,
            { borderColor: color, shadowColor: color },
          ],
        ]}
        onPress={handlePress}
        activeOpacity={0.85}
      >
        {selected && (
          <View style={swatchStyles.checkBg}>
            <Feather name="check" size={13} color={Colors.white} />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const swatchStyles = StyleSheet.create({
  swatch: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    borderColor: "transparent",
  },
  selected: {
    borderWidth: 2.5,
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  checkBg: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
});

// ─── Add Category Screen ───────────────────────────────────────────────────────
export const AddCategoryScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const route = useRoute<RouteProp<CategoriesStackParamList, "AddCategory">>();
  const fromAddExpense = route.params?.fromAddExpense ?? false;
  const addCategory = useFinanceStore((s) => s.addCategory);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[7]);

  const previewScale = useRef(new Animated.Value(1)).current;

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    Animated.sequence([
      Animated.spring(previewScale, {
        toValue: 1.06,
        useNativeDriver: true,
        tension: 200,
        friction: 8,
      }),
      Animated.spring(previewScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 200,
        friction: 8,
      }),
    ]).start();
  };

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AddCategoryFormValues>({
    defaultValues: { name: "", color: PRESET_COLORS[7] },
    mode: "onBlur",
  });

  const watchName = watch("name");

  const onSubmit = async (values: AddCategoryFormValues) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const error = await addCategory(values.name.trim(), selectedColor);

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
          onPress={() =>
            fromAddExpense
              ? navigation.navigate("CategoryList")
              : navigation.goBack()
          }
          hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
          style={({ pressed }) => [
            styles.backBtn,
            { opacity: pressed ? 0.5 : 1 },
          ]}
        >
          <Feather name="arrow-left" size={18} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>New Category</Text>
          <Text style={styles.subtitle}>Give it a name and colour</Text>
        </View>
        <View style={{ width: 40 }} />
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
          {/* Preview Card */}
          <Animated.View
            style={[
              styles.previewCard,
              { transform: [{ scale: previewScale }] },
            ]}
          >
            <View
              style={[
                styles.previewIcon,
                { backgroundColor: `${selectedColor}1F` },
              ]}
            >
              <Text style={[styles.previewIconLetter, { color: selectedColor }]}>
                {(watchName?.trim() || "C").charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.previewInfo}>
              <Text style={styles.previewName} numberOfLines={1}>
                {watchName?.trim() || "Category Name"}
              </Text>
              <Text style={styles.previewColorName}>
                {COLOR_NAMES[selectedColor] ?? selectedColor}
              </Text>
            </View>
            <Text style={styles.previewBadgeText}>PREVIEW</Text>
          </Animated.View>

          {/* Name Input */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>Name</Text>
            </View>
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
          </View>

          {/* Color Picker */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>Colour</Text>
              <View style={styles.selectedColorBadge}>
                <View
                  style={[
                    styles.selectedColorDot,
                    { backgroundColor: selectedColor },
                  ]}
                />
                <Text style={styles.selectedColorName}>
                  {COLOR_NAMES[selectedColor] ?? selectedColor}
                </Text>
              </View>
            </View>
            <View style={styles.colorGrid}>
              {PRESET_COLORS.map((color) => (
                <ColorSwatch
                  key={color}
                  color={color}
                  selected={selectedColor === color}
                  onPress={() => handleColorSelect(color)}
                />
              ))}
            </View>
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
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  backBtn: {
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
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 11.5,
    color: Colors.textMuted,
    marginTop: 2,
    fontWeight: "600",
  },

  // Preview card
  previewCard: {
    backgroundColor: Colors.surface,
    borderRadius: 22,
    marginBottom: Spacing.lg,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 0,
  },
  previewIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  previewIconLetter: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  previewInfo: {
    flex: 1,
    gap: 3,
  },
  previewName: {
    fontSize: 15.5,
    fontWeight: "700",
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  previewColorName: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: "600",
  },
  previewBadgeText: {
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: Colors.textMuted,
  },

  // Section
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
  selectedColorBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    backgroundColor: Colors.surfaceElevated,
  },
  selectedColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  selectedColorName: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textSecondary,
    letterSpacing: -0.1,
  },

  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between",
  },

  spacer: { flex: 1, minHeight: Spacing.xl },
});
