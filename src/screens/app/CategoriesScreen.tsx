import React, { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  StatusBar,
  Animated,
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
  index: number;
}> = React.memo(({ item, onDelete, index }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        delay: index * 60,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        delay: index * 60,
        useNativeDriver: true,
        tension: 80,
        friction: 9,
      }),
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      tension: 200,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 200,
      friction: 10,
    }).start();
  };

  return (
    <Animated.View
      style={[
        cardStyles.card,
        { opacity, transform: [{ scale }, { translateY }] },
      ]}
    >
      {/* Colored left accent bar */}
      <View style={[cardStyles.accentBar, { backgroundColor: item.color }]} />

      <View style={cardStyles.body}>
        {/* Icon bubble */}
        <View
          style={[
            cardStyles.iconBubble,
            { backgroundColor: `${item.color}22` },
          ]}
        >
          <View style={[cardStyles.iconDot, { backgroundColor: item.color }]}>
            <View style={cardStyles.iconDotInner} />
          </View>
        </View>

        {/* Name */}
        <Text style={cardStyles.name} numberOfLines={2}>
          {item.name}
        </Text>

        {/* Bottom row */}
        <View style={cardStyles.bottomRow}>
          <View
            style={[
              cardStyles.colorPill,
              {
                backgroundColor: `${item.color}20`,
                borderColor: `${item.color}50`,
              },
            ]}
          >
            <View
              style={[cardStyles.colorPillDot, { backgroundColor: item.color }]}
            />
            <Text style={[cardStyles.colorPillText, { color: item.color }]}>
              {item.color.toUpperCase()}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => onDelete(item.id, item.name)}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={cardStyles.deleteBtn}
            accessibilityLabel={`Delete ${item.name}`}
          >
            <Feather name="trash-2" size={13} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
});

const cardStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  accentBar: {
    height: 4,
    width: "100%",
  },
  body: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  iconBubble: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  iconDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  iconDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  name: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  colorPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  colorPillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  colorPillText: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.4,
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
});

// ─── Empty State ───────────────────────────────────────────────────────────────
const EmptyState: React.FC<{ onAdd: () => void }> = ({ onAdd }) => {
  const pulse = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.08,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <View style={emptyStyles.container}>
      <Animated.View
        style={[emptyStyles.iconRing, { transform: [{ scale: pulse }] }]}
      >
        <View style={emptyStyles.iconInner}>
          <Feather name="tag" size={28} color={Colors.primary} />
        </View>
      </Animated.View>
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
};

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
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1.5,
    borderColor: `${Colors.primary}30`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
    backgroundColor: `${Colors.primary}08`,
  },
  iconInner: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: `${Colors.primary}20`,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: Spacing.xs,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.full,
    marginTop: Spacing.md,
    elevation: 6,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
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
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
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
          <Feather name="plus" size={20} color={Colors.white} />
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
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={styles.loadingText}>Loading categories...</Text>
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
            { paddingBottom: insets.bottom + 110 },
          ]}
          columnWrapperStyle={styles.row}
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
          <Feather name="plus" size={24} color={Colors.white} />
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
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
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
    letterSpacing: -0.3,
  },
  countBadge: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    minWidth: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  countText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },

  subtitle: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    paddingHorizontal: Spacing.lg,
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

  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },

  grid: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
  },
  row: {
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },

  fab: {
    position: "absolute",
    right: Spacing.lg,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
  },
});
