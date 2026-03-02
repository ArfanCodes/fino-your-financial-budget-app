import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
} from "react-native";
import { ConfirmModal } from "../../components/ConfirmModal";
import { Feather } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "../../store/auth.store";
import {
  Colors,
  Spacing,
  FontSize,
  FontWeight,
  Radius,
} from "../../utils/constants";
import { getInitials } from "../../utils/helpers";
import type { AppStackParamList } from "../../types";

// ─── Types ─────────────────────────────────────────────────────────────────────
type Props = {
  navigation: NativeStackNavigationProp<AppStackParamList, "Settings">;
};
type FeatherIcon = React.ComponentProps<typeof Feather>["name"];

// ─── Pressable Row ─────────────────────────────────────────────────────────────
const SettingsRow: React.FC<{
  icon: FeatherIcon;
  iconColor?: string;
  iconBg?: string;
  label: string;
  sublabel?: string;
  onPress?: () => void;
  destructive?: boolean;
  showChevron?: boolean;
  isLast?: boolean;
  right?: React.ReactNode;
}> = React.memo(
  ({
    icon,
    iconColor,
    iconBg,
    label,
    sublabel,
    onPress,
    destructive,
    showChevron = true,
    isLast,
    right,
  }) => {
    const scale = useRef(new Animated.Value(1)).current;

    const onPressIn = () =>
      Animated.spring(scale, {
        toValue: 0.97,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }).start();

    const onPressOut = () =>
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }).start();

    const resolvedIconColor = destructive
      ? Colors.danger
      : (iconColor ?? Colors.textSecondary);
    const resolvedIconBg = destructive
      ? `${Colors.danger}18`
      : (iconBg ?? Colors.surfaceElevated);

    return (
      <Animated.View style={{ transform: [{ scale }] }}>
        <TouchableOpacity
          style={[rowStyles.row, isLast && rowStyles.rowLast]}
          onPress={onPress}
          onPressIn={onPress ? onPressIn : undefined}
          onPressOut={onPress ? onPressOut : undefined}
          activeOpacity={1}
          disabled={!onPress}
        >
          <View
            style={[rowStyles.iconWrap, { backgroundColor: resolvedIconBg }]}
          >
            <Feather name={icon} size={16} color={resolvedIconColor} />
          </View>
          <View style={rowStyles.content}>
            <Text
              style={[rowStyles.label, destructive && rowStyles.labelDanger]}
            >
              {label}
            </Text>
            {sublabel ? (
              <Text style={rowStyles.sublabel}>{sublabel}</Text>
            ) : null}
          </View>
          {right ?? null}
          {showChevron && onPress && !right ? (
            <Feather name="chevron-right" size={15} color={Colors.textMuted} />
          ) : null}
        </TouchableOpacity>
      </Animated.View>
    );
  },
);
SettingsRow.displayName = "SettingsRow";

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.surfaceBorder,
    gap: Spacing.md,
  },
  rowLast: { borderBottomWidth: 0 },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  content: { flex: 1 },
  label: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: FontWeight.medium,
  },
  labelDanger: { color: Colors.danger },
  sublabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
});

// ─── Section ───────────────────────────────────────────────────────────────────
const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <View style={secStyles.wrapper}>
    <Text style={secStyles.label}>{title}</Text>
    <View style={secStyles.group}>{children}</View>
  </View>
);

const secStyles = StyleSheet.create({
  wrapper: { marginBottom: Spacing.sm },
  label: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: Colors.textMuted,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: Spacing.sm,
    paddingHorizontal: 4,
  },
  group: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.surfaceBorder,
    overflow: "hidden",
  },
});

// ─── Badge ─────────────────────────────────────────────────────────────────────
const Badge: React.FC<{ label: string }> = ({ label }) => (
  <View style={bdgStyles.badge}>
    <Text style={bdgStyles.text}>{label}</Text>
  </View>
);

const bdgStyles = StyleSheet.create({
  badge: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  text: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.3,
  },
});

// ─── Settings Screen ───────────────────────────────────────────────────────────
export const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [showSignOutModal, setShowSignOutModal] = useState(false);

  const email = user?.email ?? "";
  const displayName = user?.username || email.split("@")[0] || "User";
  const initials = getInitials(user?.username || email);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      <ConfirmModal
        visible={showSignOutModal}
        title="Sign Out"
        message="You will be returned to the login screen."
        confirmLabel="Sign Out"
        cancelLabel="Stay"
        icon="log-out"
        variant="warning"
        onConfirm={() => {
          setShowSignOutModal(false);
          signOut();
        }}
        onCancel={() => setShowSignOutModal(false)}
      />

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.closeBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <Feather name="x" size={18} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 40 },
        ]}
      >
        {/* ── Profile Hero ── */}
        <View style={styles.profileCard}>
          <View style={styles.profileOrb} />
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarText}>{initials}</Text>
            <View style={styles.avatarBadge}>
              <Feather name="check" size={8} color={Colors.white} />
            </View>
          </View>
          <Text style={styles.profileName} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.profileEmail} numberOfLines={1}>
            {email}
          </Text>
        </View>

        {/* ── Preferences ── */}
        <Section title="Preferences">
          <SettingsRow
            icon="bell"
            iconColor={Colors.warning}
            iconBg={`${Colors.warning}18`}
            label="Notifications"
            sublabel="Push alerts & reminders"
            right={<Badge label="Soon" />}
            showChevron={false}
          />
          <SettingsRow
            icon="shield"
            iconColor={Colors.success}
            iconBg={`${Colors.success}18`}
            label="Security"
            sublabel="Biometrics & PIN"
            right={<Badge label="Soon" />}
            showChevron={false}
          />
          <SettingsRow
            icon="moon"
            iconColor={Colors.primaryLight}
            iconBg={`${Colors.primary}18`}
            label="Appearance"
            sublabel="Dark mode"
            right={<Badge label="Soon" />}
            showChevron={false}
            isLast
          />
        </Section>

        {/* ── Data ── */}
        <Section title="Data">
          <SettingsRow
            icon="download"
            iconColor={Colors.accent}
            iconBg={`${Colors.accent}18`}
            label="Export Data"
            sublabel="Download your transactions as CSV"
            right={<Badge label="Soon" />}
            showChevron={false}
          />
          <SettingsRow
            icon="refresh-cw"
            iconColor={Colors.info}
            iconBg={`${Colors.info}18`}
            label="Sync"
            sublabel="Last synced just now"
            showChevron={false}
            isLast
          />
        </Section>

        {/* ── Support ── */}
        <Section title="Support">
          <SettingsRow
            icon="help-circle"
            iconColor={Colors.textSecondary}
            label="Help & FAQ"
            right={<Badge label="Soon" />}
            showChevron={false}
          />
          <SettingsRow
            icon="message-circle"
            iconColor={Colors.textSecondary}
            label="Send Feedback"
            right={<Badge label="Soon" />}
            showChevron={false}
            isLast
          />
        </Section>

        {/* ── Account ── */}
        <Section title="Account">
          <SettingsRow
            icon="log-out"
            label={isLoading ? "Signing out…" : "Sign Out"}
            onPress={() => setShowSignOutModal(true)}
            destructive
            showChevron={false}
            isLast
          />
        </Section>

        <Text style={styles.version}>Finance Tracker · v1.0.0</Text>
      </ScrollView>
    </View>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.surfaceBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },

  scroll: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },

  // Profile card
  profileCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.surfaceBorder,
    padding: Spacing.lg,
    alignItems: "center",
    overflow: "hidden",
    marginBottom: Spacing.sm,
    elevation: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
  },
  profileOrb: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: `${Colors.primary}0C`,
    top: -80,
    right: -60,
  },
  avatarWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primaryDark,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: Colors.primary,
    marginBottom: Spacing.md,
    elevation: 6,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  avatarText: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    letterSpacing: 0.5,
  },
  avatarBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.success,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  profileName: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
    textTransform: "capitalize",
    marginBottom: 3,
  },
  profileEmail: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },

  version: {
    textAlign: "center",
    fontSize: 11,
    color: Colors.textMuted,
    paddingVertical: Spacing.md,
    letterSpacing: 0.3,
  },
});
