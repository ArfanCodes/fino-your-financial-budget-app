import React, { useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  StatusBar,
} from "react-native";
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
import type { SettingsStackParamList, Category } from "../../types";

// ─── Types ─────────────────────────────────────────────────────────────────────
type Props = {
  navigation: NativeStackNavigationProp<SettingsStackParamList, "CategoryList">;
};

// ─── Category Row ──────────────────────────────────────────────────────────────
const CategoryRow: React.FC<{
  item: Category;
  onDelete: (id: string, name: string) => void;
}> = React.memo(({ item, onDelete }) => (
  <View style={rowStyles.container}>
    <View style={[rowStyles.swatch, { backgroundColor: item.color }]} />
    <Text style={rowStyles.name} numberOfLines={1}>
      {item.name}
    </Text>
    <TouchableOpacity
      onPress={() => onDelete(item.id, item.name)}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      style={rowStyles.deleteBtn}
      accessibilityLabel={`Delete ${item.name}`}
    >
      <Feather name="trash-2" size={15} color={Colors.textMuted} />
    </TouchableOpacity>
  </View>
));

const rowStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.surfaceBorder,
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: Spacing.md,
  },
  name: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: FontWeight.medium,
  },
  deleteBtn: {
    paddingLeft: Spacing.md,
  },
});

// ─── Categories Screen ─────────────────────────────────────────────────────────
export const CategoriesScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const categories = useFinanceStore((s) => s.categories);
  const categoriesLoading = useFinanceStore((s) => s.categoriesLoading);
  const categoriesError = useFinanceStore((s) => s.categoriesError);
  const fetchCategories = useFinanceStore((s) => s.fetchCategories);
  const removeCategory = useFinanceStore((s) => s.removeCategory);

  useFocusEffect(
    useCallback(() => {
      fetchCategories();
    }, []),
  );

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      "Delete Category",
      `Delete "${name}"? Expenses in this category will not be deleted.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const error = await removeCategory(id);
            if (error) Alert.alert("Error", error);
          },
        },
      ],
    );
  };

  const renderEmpty = () => {
    if (categoriesLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconWrap}>
          <Feather name="tag" size={20} color={Colors.textMuted} />
        </View>
        <Text style={styles.emptyTitle}>No categories yet</Text>
        <Text style={styles.emptySubtitle}>
          Tap Add to create your first category
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.backBtn}
        >
          <Feather name="arrow-left" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Categories</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate("AddCategory")}
          activeOpacity={0.7}
        >
          <Feather name="plus" size={16} color={Colors.white} />
          <Text style={styles.addText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Error */}
      {categoriesError ? (
        <View style={styles.errorBanner}>
          <Feather name="alert-circle" size={14} color={Colors.danger} />
          <Text style={styles.errorText}>{categoriesError}</Text>
        </View>
      ) : null}

      {/* List */}
      {categoriesLoading && categories.length === 0 ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator color={Colors.primary} size="small" />
        </View>
      ) : (
        <View style={styles.listCard}>
          <FlatList
            data={categories}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <CategoryRow item={item} onDelete={handleDelete} />
            )}
            ListEmptyComponent={renderEmpty}
            showsVerticalScrollIndicator={false}
            scrollEnabled={categories.length > 8}
          />
        </View>
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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  backBtn: { marginRight: Spacing.md },
  title: {
    flex: 1,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
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

  listCard: {
    flex: 1,
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.surfaceBorder,
    overflow: "hidden",
  },

  emptyContainer: {
    paddingVertical: Spacing.xxxl,
    alignItems: "center",
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
