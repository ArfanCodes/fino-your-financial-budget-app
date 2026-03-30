import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  BackHandler,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useEmergencyMode } from "../../context/EmergencyModeContext";
import { useFinanceStore } from "../../store/finance.store";
import { useBudgetStatus } from "../../hooks/useBudgetStatus";
import {
  Colors,
  FontSize,
  FontWeight,
  Radius,
  Spacing,
  TAB_BAR_HEIGHT,
} from "../../utils/constants";
import { formatCurrency } from "../../utils/helpers";

// ─── Helpers ───────────────────────────────────────────────────────────────────
function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// ─── Stat Tile ────────────────────────────────────────────────────────────────
const StatTile: React.FC<{
  label: string;
  value: string;
  accent?: string;
  icon: React.ComponentProps<typeof Feather>["name"];
}> = ({ label, value, accent = Colors.primary, icon }) => (
  <View style={[tileStyles.tile, { borderColor: `${accent}35` }]}>
    <View style={[tileStyles.iconWrap, { backgroundColor: `${accent}18` }]}>
      <Feather name={icon} size={18} color={accent} />
    </View>
    <Text style={tileStyles.value} numberOfLines={1}>{value}</Text>
    <Text style={tileStyles.label}>{label}</Text>
  </View>
);

const tileStyles = StyleSheet.create({
  tile: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    padding: Spacing.lg,
    gap: Spacing.sm,
    alignItems: "flex-start",
    minWidth: 100,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  value: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  label: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
  },
});

// ─── Category Row ─────────────────────────────────────────────────────────────
const CategoryBreakdownRow: React.FC<{
  name: string;
  color: string;
  spent: number;
  totalSpent: number;
  rank: number;
}> = ({ name, color, spent, totalSpent, rank }) => {
  const pct = totalSpent > 0 ? (spent / totalSpent) * 100 : 0;
  return (
    <View style={cbStyles.row}>
      <View style={cbStyles.left}>
        <View style={[cbStyles.rankBadge, { backgroundColor: `${color}20` }]}>
          <Text style={[cbStyles.rank, { color }]}>{rank}</Text>
        </View>
        <View style={[cbStyles.dot, { backgroundColor: color }]} />
        <Text style={cbStyles.name} numberOfLines={1}>{name}</Text>
      </View>
      <View style={cbStyles.right}>
        <Text style={cbStyles.spent}>{formatCurrency(spent)}</Text>
        <Text style={[cbStyles.pct, { color }]}>{pct.toFixed(0)}%</Text>
      </View>
    </View>
  );
};

const cbStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.surfaceBorder,
  },
  left: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, flex: 1 },
  rankBadge: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  rank: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  dot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  name: { fontSize: FontSize.md, color: Colors.textPrimary, fontWeight: FontWeight.medium, flex: 1 },
  right: { alignItems: "flex-end", gap: 3, flexShrink: 0 },
  spent: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  pct: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
});

// ─── Stable Flow / Exit Modal (single screen) ────────────────────────────────
interface StableModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirmExit: () => void;
}

const StableModal: React.FC<StableModalProps> = ({ visible, onCancel, onConfirmExit }) => {
  const insets = useSafeAreaInsets();
  const upsertBudget = useFinanceStore((s) => s.upsertBudget);
  const [limitText, setLimitText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Reset when modal opens
  useEffect(() => {
    if (visible) {
      setLimitText("");
      setError(null);
      setSaving(false);
    }
  }, [visible]);

  const handleConfirm = async () => {
    const limit = parseFloat(limitText.replace(/,/g, ""));
    if (!limitText.trim() || isNaN(limit) || limit <= 0) {
      setError("Please enter a valid budget amount to continue");
      return;
    }
    setError(null);
    setSaving(true);
    await upsertBudget(null, limit, currentMonthKey());
    setSaving(false);
    onConfirmExit();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* Backdrop — tapping it cancels */}
        <View style={stableStyles.overlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            onPress={onCancel}
            activeOpacity={1}
          />
          <View style={[stableStyles.sheet, { paddingBottom: insets.bottom || 12 }]}>
            {/* Handle */}
            <View style={stableStyles.handle} />

            {/* Icon */}
            <View style={stableStyles.iconRow}>
              <View style={stableStyles.iconWrap}>
                <Feather name="shield" size={30} color={Colors.success} />
              </View>
            </View>

            {/* Title + subtitle */}
            <Text style={stableStyles.title}>Exit Emergency Mode</Text>
            <Text style={stableStyles.subtitle}>
              Set a new monthly budget to stay accountable, then return to the dashboard.
            </Text>

            {/* Divider */}
            <View style={stableStyles.divider} />

            {/* Budget input */}
            <Text style={stableStyles.inputLabel}>NEW MONTHLY BUDGET</Text>
            <View style={[stableStyles.inputWrapper, error ? { borderColor: Colors.danger } : {}]}>
              <Text style={stableStyles.currencySymbol}>₹</Text>
              <TextInput
                style={stableStyles.input}
                value={limitText}
                onChangeText={(t) => { setLimitText(t); setError(null); }}
                placeholder="e.g. 20,000"
                placeholderTextColor={Colors.inputPlaceholder}
                keyboardType="numeric"
                autoFocus
                selectionColor={Colors.success}
                cursorColor={Colors.success}
              />
            </View>
            {error && <Text style={stableStyles.errorText}>{error}</Text>}

            {/* Confirm button */}
            <TouchableOpacity
              style={[stableStyles.primaryBtn, saving && { opacity: 0.6 }]}
              onPress={handleConfirm}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <>
                  <Feather name="check-circle" size={18} color={Colors.white} />
                  <Text style={stableStyles.primaryBtnText}>I'm Stable — Back to Dashboard</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Cancel */}
            <TouchableOpacity
              style={stableStyles.cancelBtn}
              onPress={onCancel}
              activeOpacity={0.7}
            >
              <Text style={stableStyles.cancelText}>Stay in Emergency Mode</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const stableStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderTopWidth: 2,
    borderColor: `${Colors.success}50`,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.surfaceBorder,
    alignSelf: "center",
    marginBottom: Spacing.lg,
  },
  iconRow: {
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: `${Colors.success}18`,
    borderWidth: 1.5,
    borderColor: `${Colors.success}35`,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: "center",
    letterSpacing: -0.4,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.surfaceBorder,
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.inputBackground,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: `${Colors.success}50`,
    paddingHorizontal: Spacing.md,
    minHeight: 58,
    marginBottom: Spacing.xs,
  },
  currencySymbol: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.success,
    marginRight: 6,
  },
  input: {
    flex: 1,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    paddingVertical: 0,
  },
  errorText: {
    fontSize: FontSize.xs,
    color: Colors.danger,
    marginBottom: Spacing.sm,
    marginLeft: 2,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.success,
    borderRadius: Radius.md,
    minHeight: 54,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  primaryBtnText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    letterSpacing: 0.1,
  },
  cancelBtn: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 4,
  },
  cancelText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
  },
});

// ─── Recovery Screen ──────────────────────────────────────────────────────────
export const RecoveryScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const categories = useFinanceStore((s) => s.categories);
  const { exitEmergencyMode, isEmergencyModeActive } = useEmergencyMode();
  const [showStableModal, setShowStableModal] = useState(false);

  // Animated red pulse for the emergency indicator
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isEmergencyModeActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [isEmergencyModeActive]);

  const {
    state,
    totalLimit,
    totalSpent,
    remainingBudget,
    overBudgetAmount,
    daysRemaining,
    dailyAllowedSpend,
    topCategoryId,
    topCategoryName,
    topCategorySpent,
    categorySpentMap,
  } = useBudgetStatus();

  // ── Intercept Android back button ──────────────────────────────────────────
  useEffect(() => {
    if (!isEmergencyModeActive) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      setShowStableModal(true);
      return true; // block default
    });
    return () => sub.remove();
  }, [isEmergencyModeActive]);

  // ── Block swipe-back / gesture navigation on the header back button ────────
  // We replace the back button with our custom one below.

  const handleBackPress = useCallback(() => {
    if (isEmergencyModeActive) {
      setShowStableModal(true);
    } else {
      navigation.goBack();
    }
  }, [isEmergencyModeActive, navigation]);

  const handleConfirmExit = useCallback(() => {
    setShowStableModal(false);
    exitEmergencyMode();
    // Navigate all the way back to the Dashboard
    navigation.reset({
      index: 0,
      routes: [{ name: "MainTabs" }],
    });
  }, [exitEmergencyMode, navigation]);

  // ── Category lookup ───────────────────────────────────────────────────────
  const categoryMap = useMemo(() => {
    const m = new Map<string, { name: string; color: string }>();
    categories.forEach((c) => m.set(c.id, { name: c.name, color: c.color }));
    return m;
  }, [categories]);

  const topCategories = useMemo(() => {
    return Array.from(categorySpentMap.entries())
      .map(([id, spent]) => ({
        id, spent,
        name: categoryMap.get(id)?.name ?? "Unknown",
        color: categoryMap.get(id)?.color ?? Colors.primary,
      }))
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 3);
  }, [categorySpentMap, categoryMap]);

  // ── Recommendations ───────────────────────────────────────────────────────
  const recommendations = useMemo(() => {
    const recs: { icon: React.ComponentProps<typeof Feather>["name"]; title: string; subtitle: string; accent: string }[] = [];

    if (topCategoryId && topCategorySpent > 0) {
      recs.push({
        icon: "tag",
        title: `Reduce ${topCategoryName} spending`,
        subtitle: `You spent ${formatCurrency(topCategorySpent)} on ${topCategoryName} this month — your highest category.`,
        accent: Colors.warning,
      });
    }

    if (daysRemaining > 0 && dailyAllowedSpend > 0) {
      recs.push({
        icon: "calendar",
        title: "Daily spending target",
        subtitle: `Limit yourself to ${formatCurrency(dailyAllowedSpend)}/day for the remaining ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} to recover.`,
        accent: Colors.info,
      });
    } else {
      recs.push({
        icon: "pause-circle",
        title: "Pause non-essential spending",
        subtitle: "Consider deferring discretionary purchases until the next month resets.",
        accent: Colors.danger,
      });
    }

    recs.push({
      icon: "pie-chart",
      title: "Set per-category budgets",
      subtitle: "Fine-grained category limits give you earlier warnings and better control.",
      accent: Colors.accent,
    });

    return recs;
  }, [topCategoryId, topCategoryName, topCategorySpent, daysRemaining, dailyAllowedSpend]);

  const isEmergency = state === "emergency";
  const accentColor = isEmergency ? Colors.danger : Colors.warning;

  return (
    <View style={[
      screenStyles.root,
      isEmergencyModeActive && { backgroundColor: "#0d0101" },
    ]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={isEmergencyModeActive ? "#0d0101" : Colors.background}
      />


      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={[
        screenStyles.header,
        { paddingTop: insets.top + Spacing.sm },
        isEmergencyModeActive && {
          backgroundColor: '#1f0303',
          borderBottomColor: '#cc1515',
          borderBottomWidth: 1.5,
        },
      ]}>
        <TouchableOpacity
          onPress={handleBackPress}
          style={[
            screenStyles.backBtn,
            isEmergencyModeActive && { backgroundColor: `${Colors.danger}20`, borderWidth: 1, borderColor: `${Colors.danger}45` },
          ]}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Feather
            name={isEmergencyModeActive ? "shield-off" : "arrow-left"}
            size={18}
            color={isEmergencyModeActive ? Colors.danger : Colors.textPrimary}
          />
        </TouchableOpacity>

        <View style={screenStyles.headerCenter}>
          {isEmergencyModeActive && (
            <View style={screenStyles.emergencyChip}>
              <Feather name="zap" size={10} color={Colors.danger} />
              <Text style={screenStyles.emergencyChipText}>EMERGENCY MODE</Text>
            </View>
          )}
          <Text style={[
            screenStyles.headerTitle,
            isEmergencyModeActive && { color: Colors.danger },
          ]}>
            Recovery Plan
          </Text>
          <Text style={screenStyles.headerSub}>
            {isEmergency ? "Budget exceeded" : "Approaching limit"}
          </Text>
        </View>

        {/* Exit button — only when in emergency mode */}
        {isEmergencyModeActive ? (
          <TouchableOpacity
            onPress={() => setShowStableModal(true)}
            style={screenStyles.exitBtn}
            activeOpacity={0.8}
          >
            <Text style={screenStyles.exitBtnText}>Exit</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={[
          screenStyles.scrollContent,
          { paddingBottom: insets.bottom + TAB_BAR_HEIGHT + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Status Banner ─────────────────────────────────────────────────── */}
        <View style={[
          screenStyles.statusBanner,
          {
            borderColor: isEmergencyModeActive ? '#cc1515' : `${accentColor}35`,
            backgroundColor: isEmergencyModeActive ? '#2a0404' : `${accentColor}0D`,
          },
        ]}>
          <View style={[screenStyles.statusIconWrap, { backgroundColor: `${accentColor}20` }]}>
            <Feather
              name={isEmergency ? "alert-triangle" : "alert-circle"}
              size={20}
              color={accentColor}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[screenStyles.statusTitle, { color: accentColor }]}>
              {isEmergency
                ? `₹${Math.round(overBudgetAmount).toLocaleString("en-IN")} over budget`
                : `${Math.round((totalSpent / totalLimit) * 100)}% of budget used`}
            </Text>
            <Text style={screenStyles.statusSub}>
              {isEmergency
                ? "Your spending has exceeded this month's limit"
                : `${formatCurrency(remainingBudget)} remaining of ${formatCurrency(totalLimit)}`}
            </Text>
          </View>
        </View>

        {/* ── Budget Summary ─────────────────────────────────────────────────── */}
        <Text style={screenStyles.sectionTitle}>Budget Summary</Text>
        <View style={screenStyles.tilesRow}>
          <StatTile icon="trending-up" label="Total Spent" value={formatCurrency(totalSpent)} accent={isEmergency ? Colors.danger : Colors.warning} />
          <StatTile icon="credit-card" label="Monthly Limit" value={formatCurrency(totalLimit)} accent={Colors.primary} />
        </View>
        <View style={[screenStyles.tilesRow, { marginTop: Spacing.sm }]}>
          {isEmergency ? (
            <StatTile icon="alert-triangle" label="Over Budget" value={formatCurrency(overBudgetAmount)} accent={Colors.danger} />
          ) : (
            <StatTile icon="check-circle" label="Remaining" value={formatCurrency(remainingBudget)} accent={Colors.success} />
          )}
          <StatTile icon="calendar" label="Days Left" value={`${daysRemaining} day${daysRemaining !== 1 ? "s" : ""}`} accent={Colors.info} />
        </View>

        {/* ── Daily Guidance ────────────────────────────────────────────────── */}
        {daysRemaining > 0 && (
          <>
            <Text style={screenStyles.sectionTitle}>Daily Guidance</Text>
            <View style={screenStyles.guidanceCard}>
              <View style={screenStyles.guidanceLeft}>
                <Text style={screenStyles.guidanceLabel}>To recover, limit to</Text>
                <Text style={screenStyles.guidanceAmount}>
                  {dailyAllowedSpend > 0 ? formatCurrency(Math.round(dailyAllowedSpend)) : "₹0"}
                  <Text style={screenStyles.guidanceUnit}> / day</Text>
                </Text>
                <Text style={screenStyles.guidanceSub}>
                  for the next {daysRemaining} day{daysRemaining !== 1 ? "s" : ""}
                </Text>
              </View>
              <View style={screenStyles.guidanceIconBox}>
                <Feather name="target" size={28} color={Colors.primary} />
              </View>
            </View>
          </>
        )}

        {/* ── Top Categories ────────────────────────────────────────────────── */}
        {topCategories.length > 0 && (
          <>
            <Text style={screenStyles.sectionTitle}>Top Spending Categories</Text>
            <View style={screenStyles.card}>
              {topCategories.map((cat, i) => (
                <CategoryBreakdownRow
                  key={cat.id}
                  name={cat.name}
                  color={cat.color}
                  spent={cat.spent}
                  totalSpent={totalSpent}
                  rank={i + 1}
                />
              ))}
            </View>
          </>
        )}

        {/* ── Recommendations ───────────────────────────────────────────────── */}
        <Text style={screenStyles.sectionTitle}>Smart Recommendations</Text>
        {recommendations.map((rec, i) => (
          <View key={i} style={[recStyles.card, { borderColor: `${rec.accent}25` }]}>
            <View style={[recStyles.iconWrap, { backgroundColor: `${rec.accent}15` }]}>
              <Feather name={rec.icon} size={16} color={rec.accent} />
            </View>
            <View style={recStyles.text}>
              <Text style={recStyles.title}>{rec.title}</Text>
              <Text style={recStyles.subtitle}>{rec.subtitle}</Text>
            </View>
          </View>
        ))}

        {/* ── Exit Emergency Mode CTA (bottom) ─────────────────────────────── */}
        {isEmergencyModeActive && (
          <TouchableOpacity
            style={screenStyles.exitCTA}
            onPress={() => setShowStableModal(true)}
            activeOpacity={0.8}
          >
            <Feather name="shield" size={18} color={Colors.success} />
            <Text style={screenStyles.exitCTAText}>I'm Stable — Exit Emergency Mode</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* ── Stable Exit Flow Modal ────────────────────────────────────────── */}
      <StableModal
        visible={showStableModal}
        onCancel={() => setShowStableModal(false)}
        onConfirmExit={handleConfirmExit}
      />
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const screenStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.surfaceBorder,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { flex: 1, alignItems: "center", gap: 4 },
  emergencyChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: `${Colors.danger}18`,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: `${Colors.danger}40`,
  },
  emergencyChipText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.danger,
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  headerSub: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 1 },
  exitBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.md,
    backgroundColor: `${Colors.success}18`,
    borderWidth: 1,
    borderColor: `${Colors.success}40`,
  },
  exitBtnText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.success,
  },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  statusIconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  statusTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, letterSpacing: -0.3 },
  statusSub: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 3 },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textMuted,
    letterSpacing: 1.0,
    textTransform: "uppercase",
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  tilesRow: { flexDirection: "row", gap: Spacing.md },
  guidanceCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  guidanceLeft: { flex: 1, gap: 5 },
  guidanceLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  guidanceAmount: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.primary,
    letterSpacing: -1,
  },
  guidanceUnit: { fontSize: FontSize.lg, fontWeight: FontWeight.medium, color: Colors.textSecondary },
  guidanceSub: { fontSize: FontSize.md, color: Colors.textMuted },
  guidanceIconBox: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: `${Colors.primary}15`,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    overflow: "hidden",
  },
  exitCTA: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    backgroundColor: `${Colors.success}14`,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: `${Colors.success}40`,
    paddingVertical: Spacing.lg,
  },
  exitCTAText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.success,
    letterSpacing: -0.2,
  },
});

const recStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  iconWrap: { width: 44, height: 44, borderRadius: 13, alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 },
  text: { flex: 1, gap: 5 },
  title: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary, letterSpacing: -0.2 },
  subtitle: { fontSize: FontSize.sm, color: Colors.textMuted, lineHeight: 20 },
});
