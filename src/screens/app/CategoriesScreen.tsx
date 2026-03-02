import React, { useCallback, useState } from "react";
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
import type { CategoriesStackParamList, Category } from "../../types";

// ─── Types ─────────────────────────────────────────────────────────────────────
type Props = {
  navigation: NativeStackNavigationProp<
    CategoriesStackParamList,
    "CategoryList"
  >;
};

// ─── Category Card ─────────────────────────────────────────────────────────────
const CategoryCard: React.FC<{
  item: Category;
  onDelete: (id: string, name: string) => void;
}> = React.memo(({ item, onDelete }) => (
  <View style={cardStyles.card}>
    {/* Colored top accent bar */}
    <View style={[cardStyles.accentBar, { backgroundColor: item.color }]} />

    <View style={cardStyles.body}>
      {/* Icon bubble */}
      <View
        style={[cardStyles.iconBubble, { backgroundColor: `${item.color}22` }]}
      >
        <View style={[cardStyles.iconDot, { backgroundColor: item.color }]} />
      </View>

      {/* Name */}
      <Text style={cardStyles.name} numberOfLines={2}>
        {item.name}
      </Text>

      {/* Delete */}
      <TouchableOpacity
        onPress={() => onDelete(item.id, item.name)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={cardStyles.deleteBtn}
        accessibilityLabel={`Delete ${item.name}`}
      >
        <Feather name="trash-2" size={13} color={Colors.textMuted} />
      </TouchableOpacity>
    </View>
  </View>
));

const cardStyles = StyleSheet.create({
  card: {
    flex: 1,
    margin: Spacing.xs,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.surfaceBorder,
    overflow: "hidden",
  },
  accentBar: {
    height: 3,
    width: "100%",
  },
  body: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  iconBubble: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  iconDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  name: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    flex: 1,
  },
  deleteBtn: {
    alignSelf: "flex-end",
    padding: 2,
  },
});

// ─── Empty State ───────────────────────────────────────────────────────────────
const EmptyState: React.FC<{ onAdd: () => void }> = ({ onAdd }) => (
  <View style={emptyStyles.container}>
    <View style={emptyStyles.iconRing}>
      <View style={emptyStyles.iconInner}>
        <Feather name="tag" size={26} color={Colors.primary} />
      </View>
    </View>
    <Text style={emptyStyles.title}>No categories yet</Text>
    <Text style={emptyStyles.subtitle}>
      Create categories to organise{"\n"}your expenses by type
    </Text>
    <TouchableOpacity
      style={emptyStyles.cta}
      onPress={onAdd}
      activeOpacity={0.8}
    >
      <Feather name="plus" size={16} color={Colors.white} />
      <Text style={emptyStyles.ctaText}>Create first category</Text>
    </TouchableOpacity>
  </View>
);

const emptyStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxxl,
    gap: Spacing.sm,
  },
  iconRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  iconInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: `${Colors.primary}18`,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.full,
    marginTop: Spacing.md,
  },
  ctaText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
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

  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchCategories();
    }, []),
  );

  const handleDelete = (id: string, name: string) => {
    setDeleteTarget({ id, name });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const error = await removeCategory(deleteTarget.id);
    setDeleteTarget(null);
    if (error) Alert.alert("Error", error);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      <ConfirmModal
        visible={!!deleteTarget}
        title="Delete Category"
        message={`Delete "${deleteTarget?.name}"? Expenses in this category will not be deleted.`}
        confirmLabel="Delete"
        icon="trash-2"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.backBtn}
        >
          <Feather name="arrow-left" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.titleBlock}>
          <Text style={styles.title}>Categories</Text>
          {categories.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{categories.length}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate("AddCategory")}
          activeOpacity={0.8}
        >
          <Feather name="plus" size={18} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Subtitle */}
      {categories.length > 0 && (
        <Text style={styles.subtitle}>
          Tap a category colour to identify expenses
        </Text>
      )}

      {/* Error */}
      {categoriesError ? (
        <View style={styles.errorBanner}>
          <Feather name="alert-circle" size={14} color={Colors.danger} />
          <Text style={styles.errorText}>{categoriesError}</Text>
        </View>
      ) : null}

      {/* Content */}
      {categoriesLoading && categories.length === 0 ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator color={Colors.primary} size="small" />
        </View>
      ) : categories.length === 0 ? (
        <EmptyState onAdd={() => navigation.navigate("AddCategory")} />
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id}
          numColumns={2}
          renderItem={({ item }) => (
            <CategoryCard item={item} onDelete={handleDelete} />
          )}
          contentContainerStyle={[
            styles.grid,
            { paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB */}
      {categories.length > 0 && (
        <TouchableOpacity
          style={[styles.fab, { bottom: insets.bottom + 24 }]}
          onPress={() => navigation.navigate("AddCategory")}
          activeOpacity={0.85}
        >
          <Feather name="plus" size={22} color={Colors.white} />
        </TouchableOpacity>
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
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  titleBlock: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  countBadge: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.surfaceBorder,
  },
  countText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${Colors.primary}18`,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: `${Colors.primary}40`,
  },

  subtitle: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    paddingHorizontal: Spacing.lg + Spacing.xs + 36 + Spacing.sm,
    marginBottom: Spacing.md,
    letterSpacing: 0.2,
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

  grid: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
  },

  fab: {
    position: "absolute",
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
});

// ─── Categories Screen ─────────────────────────────────────────────────────────
