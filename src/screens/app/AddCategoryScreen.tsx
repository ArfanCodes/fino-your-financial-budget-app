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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
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
          <Feather name="arrow-left" size={20} color={Colors.textPrimary} />
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
            {/* Colored top accent */}
            <View
              style={[styles.previewAccent, { backgroundColor: selectedColor }]}
            />
            <View style={styles.previewBody}>
              <View
                style={[
                  styles.previewIconBubble,
                  { backgroundColor: `${selectedColor}25` },
                ]}
              >
                <View
                  style={[
                    styles.previewIconDot,
                    { backgroundColor: selectedColor },
                  ]}
                />
              </View>
              <View style={styles.previewInfo}>
                <Text style={styles.previewName} numberOfLines={1}>
                  {watchName?.trim() || "Category Name"}
                </Text>
                <Text style={styles.previewColorName}>
                  {COLOR_NAMES[selectedColor] ?? selectedColor}
                </Text>
              </View>
              <View
                style={[
                  styles.previewBadge,
                  {
                    backgroundColor: `${selectedColor}20`,
                    borderColor: `${selectedColor}40`,
                  },
                ]}
              >
                <Text
                  style={[styles.previewBadgeText, { color: selectedColor }]}
                >
                  PREVIEW
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Name Input */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="type" size={13} color={Colors.primary} />
              <Text style={styles.sectionLabel}>NAME</Text>
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
              <Feather name="droplet" size={13} color={Colors.primary} />
              <Text style={styles.sectionLabel}>COLOUR</Text>
              <View
                style={[
                  styles.selectedColorBadge,
                  {
                    backgroundColor: `${selectedColor}20`,
                    borderColor: `${selectedColor}40`,
                  },
                ]}
              >
                <View
                  style={[
                    styles.selectedColorDot,
                    { backgroundColor: selectedColor },
                  ]}
                />
                <Text
                  style={[styles.selectedColorName, { color: selectedColor }]}
                >
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
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },

  // Preview card
  previewCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginBottom: Spacing.lg,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  previewAccent: {
    height: 4,
    width: "100%",
  },
  previewBody: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    gap: Spacing.md,
  },
  previewIconBubble: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  previewIconDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  previewInfo: {
    flex: 1,
    gap: 3,
  },
  previewName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  previewColorName: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  previewBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  previewBadgeText: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.6,
  },

  // Section
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
    fontWeight: FontWeight.bold,
    color: Colors.textMuted,
    letterSpacing: 1,
    flex: 1,
  },
  selectedColorBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  selectedColorDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  selectedColorName: {
    fontSize: 10,
    fontWeight: FontWeight.semibold,
  },

  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },

  spacer: { flex: 1, minHeight: Spacing.xl },
});
