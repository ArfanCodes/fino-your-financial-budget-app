import React, { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  StatusBar,
  Animated,
} from "react-native";
import { ConfirmModal } from "../../components/ConfirmModal";
import { FadeIn } from "../../components/FadeIn";
import { Skeleton } from "../../components/Skeleton";
import { Feather } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
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
  index: number;
}> = React.memo(({ item, onDelete, index }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 280,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        delay: index * 50,
        useNativeDriver: true,
        tension: 120,
        friction: 14,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        cardStyles.card,
        { opacity, transform: [{ translateY }] },
      ]}
    >
      <View
        style={[cardStyles.iconWrap, { backgroundColor: `${item.color}1F` }]}
      >
        <Text style={[cardStyles.iconLetter, { color: item.color }]}>
          {item.name.charAt(0).toUpperCase()}
        </Text>
      </View>

      <Text style={cardStyles.name} numberOfLines={2}>
        {item.name}
      </Text>

      <View style={cardStyles.bottomRow}>
        <View style={cardStyles.colorPill}>
          <View
            style={[cardStyles.colorPillDot, { backgroundColor: item.color }]}
          />
          <Text style={cardStyles.colorPillText}>
            {item.color.toUpperCase()}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => onDelete(item.id, item.name)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={cardStyles.deleteBtn}
          accessibilityLabel={`Delete ${item.name}`}
        >
          <Feather name="trash-2" size={13} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
});

const cardStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 14,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 0,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  iconLetter: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  name: {
    fontSize: 14.5,
    fontWeight: "700",
    color: Colors.textPrimary,
    lineHeight: 19,
    letterSpacing: -0.2,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  colorPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
    backgroundColor: Colors.surfaceElevated,
  },
  colorPillDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  colorPillText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
    color: Colors.textSecondary,
  },
  deleteBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
});

// ─── Empty State ───────────────────────────────────────────────────────────────
const EmptyState: React.FC<{ onAdd: () => void }> = ({ onAdd }) => (
  <View style={emptyStyles.container}>
    <View style={emptyStyles.iconWrap}>
      <Feather name="tag" size={26} color={Colors.accent} />
    </View>
    <Text style={emptyStyles.title}>No categories yet</Text>
    <Text style={emptyStyles.subtitle}>
      Create categories to organise{"\n"}your expenses by type
    </Text>
    <TouchableOpacity
      style={emptyStyles.cta}
      onPress={onAdd}
      activeOpacity={0.85}
    >
      <Feather name="plus" size={14} color={Colors.white} />
      <Text style={emptyStyles.ctaText}>Create category</Text>
    </TouchableOpacity>
  </View>
);

const emptyStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    paddingTop: 60,
    gap: 8,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13.5,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    fontWeight: "500",
    marginBottom: Spacing.xs,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.brandBlack,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 99,
    marginTop: Spacing.md,
  },
  ctaText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: -0.2,
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
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      <ConfirmModal
        visible={!!deleteTarget}
        title="Delete Category"
        message={`Delete "${deleteTarget?.name}"? Expenses in this category will not be deleted.`}
        confirmLabel="Delete"
        icon="trash-2"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <FadeIn duration={360} style={{ flex: 1 }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.backBtn}
        >
          <Feather name="arrow-left" size={18} color={Colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.titleBlock}>
          <Text style={styles.title}>Categories</Text>
          {categories.length > 0 && (
            <Text style={styles.titleCount}>· {categories.length}</Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate("AddCategory")}
          activeOpacity={0.85}
        >
          <Feather name="plus" size={15} color={Colors.textOnLime} />
          <Text style={styles.addBtnText}>Add</Text>
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
        <View style={[styles.grid, { flex: 1 }]}>
          {[0, 1, 2, 3].map((row) => (
            <View key={row} style={styles.row}>
              {[0, 1].map((col) => (
                <View key={col} style={skeletonStyles.card}>
                  <Skeleton width={44} height={44} radius={14} delay={(row * 2 + col) * 70} />
                  <Skeleton width="70%" height={14} radius={6} delay={(row * 2 + col) * 70 + 40} />
                  <Skeleton width="45%" height={11} radius={6} delay={(row * 2 + col) * 70 + 70} />
                </View>
              ))}
            </View>
          ))}
        </View>
      ) : categories.length === 0 ? (
        <EmptyState onAdd={() => navigation.navigate("AddCategory")} />
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id}
          numColumns={2}
          renderItem={({ item, index }) => (
            <CategoryCard item={item} onDelete={handleDelete} index={index} />
          )}
          contentContainerStyle={[
            styles.grid,
            { paddingBottom: insets.bottom + 60 },
          ]}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
        />
      )}
      </FadeIn>
    </SafeAreaView>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
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
  titleBlock: {
    flex: 1,
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    marginLeft: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  titleCount: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textMuted,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 9,
    paddingHorizontal: 14,
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
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: -0.2,
  },

  subtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    fontWeight: "600",
  },

  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: `${Colors.danger}12`,
    borderRadius: 14,
    marginHorizontal: Spacing.lg,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: Spacing.sm,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },

  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: "600",
  },

  grid: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 4,
  },
  row: {
    gap: 10,
    marginBottom: 10,
    flexDirection: "row",
  },
});

const skeletonStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 14,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 0,
  },
});
