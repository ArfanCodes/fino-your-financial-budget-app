import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
} from "react-native";
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
import type { SettingsStackParamList } from "../../types";

// ─── Types ─────────────────────────────────────────────────────────────────────
type Props = {
  navigation: NativeStackNavigationProp<SettingsStackParamList, "SettingsHome">;
};

type FeatherIcon = React.ComponentProps<typeof Feather>["name"];

// ─── Row component ─────────────────────────────────────────────────────────────
const SettingsRow: React.FC<{
  icon: FeatherIcon;
  label: string;
  sublabel?: string;
  onPress?: () => void;
  destructive?: boolean;
  showChevron?: boolean;
}> = React.memo(
  ({ icon, label, sublabel, onPress, destructive, showChevron = true }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={onPress ? 0.6 : 1}
      disabled={!onPress}
    >
      <View style={[styles.rowIcon, destructive && styles.rowIconDestructive]}>
        <Feather
          name={icon}
          size={16}
          color={destructive ? Colors.danger : Colors.textSecondary}
        />
      </View>
      <View style={styles.rowContent}>
        <Text
          style={[styles.rowLabel, destructive && styles.rowLabelDestructive]}
        >
          {label}
        </Text>
        {sublabel ? <Text style={styles.rowSublabel}>{sublabel}</Text> : null}
      </View>
      {showChevron && onPress ? (
        <Feather name="chevron-right" size={16} color={Colors.textMuted} />
      ) : null}
    </TouchableOpacity>
  ),
);

// ─── Section Header ────────────────────────────────────────────────────────────
const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <Text style={styles.sectionHeader}>{title}</Text>
);

// ─── Settings Screen ───────────────────────────────────────────────────────────
export const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const isLoading = useAuthStore((s) => s.isLoading);

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => signOut(),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing.xxxl },
        ]}
      >
        {/* Account */}
        <View style={styles.accountCard}>
          <View style={styles.accountAvatar}>
            <Feather name="user" size={20} color={Colors.primary} />
          </View>
          <View style={styles.accountInfo}>
            <Text style={styles.accountEmail} numberOfLines={1}>
              {user?.email}
            </Text>
            <Text style={styles.accountLabel}>Personal Account</Text>
          </View>
        </View>

        {/* Data */}
        <SectionHeader title="Data" />
        <View style={styles.group}>
          <SettingsRow
            icon="tag"
            label="Manage Categories"
            sublabel="Add or remove spending categories"
            onPress={() => navigation.navigate("CategoryList")}
          />
        </View>

        {/* Preferences */}
        <SectionHeader title="Preferences" />
        <View style={styles.group}>
          <SettingsRow
            icon="bell"
            label="Notifications"
            sublabel="Coming soon"
            showChevron={false}
          />
          <SettingsRow
            icon="lock"
            label="Security"
            sublabel="Coming soon"
            showChevron={false}
          />
        </View>

        {/* Account actions */}
        <SectionHeader title="Account" />
        <View style={styles.group}>
          <SettingsRow
            icon="log-out"
            label={isLoading ? "Signing out..." : "Sign Out"}
            onPress={handleSignOut}
            destructive
            showChevron={false}
          />
        </View>
      </ScrollView>
    </View>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },

  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },

  // Account card
  accountCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.surfaceBorder,
  },
  accountAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${Colors.primary}18`,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  accountInfo: { flex: 1 },
  accountEmail: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  accountLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  // Section
  sectionHeader: {
    fontSize: 11,
    fontWeight: FontWeight.semibold,
    color: Colors.textMuted,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xs,
  },

  // Group
  group: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.surfaceBorder,
    overflow: "hidden",
  },

  // Row
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.surfaceBorder,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  rowIconDestructive: {
    backgroundColor: `${Colors.danger}15`,
  },
  rowContent: { flex: 1 },
  rowLabel: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: FontWeight.medium,
  },
  rowLabelDestructive: {
    color: Colors.danger,
  },
  rowSublabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
