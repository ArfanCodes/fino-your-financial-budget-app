import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { ConfirmModal } from "../../components/ConfirmModal";
import { Feather } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
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

// ─── Clean Arrow Row ───────────────────────────────────────────────────────────
const SettingsRow: React.FC<{
  icon: FeatherIcon;
  label: string;
  onPress?: () => void;
  destructive?: boolean;
  isLast?: boolean;
}> = React.memo(({ icon, label, onPress, destructive, isLast }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, {
      toValue: 0.98,
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

  const resolvedColor = destructive ? Colors.danger : Colors.textPrimary;

  return (
    <Animated.View style={{ transform: [{ scale }], width: "100%" }}>
      <TouchableOpacity
        style={[rowStyles.row, isLast && rowStyles.rowLast]}
        onPress={onPress}
        onPressIn={onPress ? onPressIn : undefined}
        onPressOut={onPress ? onPressOut : undefined}
        activeOpacity={1}
        disabled={!onPress}
      >
        <Feather name={icon} size={18} color={resolvedColor} style={rowStyles.icon} />
        <Text style={[rowStyles.label, { color: resolvedColor }]}>{label}</Text>
        <Feather name="chevron-right" size={16} color={Colors.textMuted} />
      </TouchableOpacity>
    </Animated.View>
  );
});
SettingsRow.displayName = "SettingsRow";

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.surfaceBorder,
    borderBottomColor: Colors.surfaceBorder,
    // Removed literal backgroundColor here to inherit from group and stop Android clipping
  },
  rowLast: { borderBottomWidth: 0 },
  icon: { marginRight: Spacing.md },
  label: {
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
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
  wrapper: { marginBottom: Spacing.lg },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    paddingHorizontal: 4,
  },
  group: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
});

// ─── Settings Screen ───────────────────────────────────────────────────────────
export const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhoto, setEditPhoto] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const email = user?.email ?? "hello@finance.com";
  const displayName = user?.username || email.split("@")[0] || "User";
  const avatarUrl = user?.avatar_url;
  const initials = getInitials(user?.username || email);

  const openEditModal = () => {
    setEditName(displayName);
    setEditPhoto(avatarUrl || null);
    setShowEditModal(true);
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      // Workaround because we don't have a storage bucket active: we'll save the local URI or base64 
      // directly to Firestore for simulation purposes. In prod, upload this URI to Firebase Storage and save the public URL.
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setEditPhoto(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) return;
    setIsSaving(true);
    const { updateProfile } = useAuthStore.getState();
    await updateProfile(editName, editPhoto || undefined);
    setIsSaving(false);
    setShowEditModal(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

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
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.iconBtn}
          activeOpacity={0.7}
        >
          <Feather name="chevron-left" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7} onPress={openEditModal}>
          <Feather name="edit-2" size={16} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* ── Edit Profile Modal ── */}
      <Modal visible={showEditModal} transparent animationType="slide" onRequestClose={() => setShowEditModal(false)}>
        <View style={modalStyles.overlay}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ width: "100%" }}>
            <View style={[modalStyles.sheet, { paddingBottom: insets.bottom + Spacing.lg }]}>
              <View style={modalStyles.handle} />
              <View style={modalStyles.header}>
                <Text style={modalStyles.title}>Edit Profile</Text>
                <TouchableOpacity onPress={() => setShowEditModal(false)} style={modalStyles.closeBtn}>
                  <Feather name="x" size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={modalStyles.avatarSection}>
                <TouchableOpacity style={styles.avatarWrap} onPress={handlePickImage} activeOpacity={0.8}>
                  {editPhoto ? (
                    <Image source={{ uri: editPhoto }} style={modalStyles.avatarImage} />
                  ) : (
                    <Text style={styles.avatarText}>{getInitials(editName || email)}</Text>
                  )}
                  <View style={modalStyles.cameraBadge}>
                    <Feather name="camera" size={12} color={Colors.white} />
                  </View>
                </TouchableOpacity>
                <Text style={modalStyles.avatarHelper}>Tap to change photo</Text>
              </View>

              <View style={modalStyles.inputSection}>
                <Text style={modalStyles.inputLabel}>Display Name</Text>
                <TextInput
                  style={modalStyles.input}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Enter your name"
                  placeholderTextColor={Colors.inputPlaceholder}
                />
              </View>

              <TouchableOpacity style={[modalStyles.saveBtn, isSaving && { opacity: 0.7 }]} onPress={handleSaveProfile} disabled={isSaving}>
                <Text style={modalStyles.saveBtnText}>{isSaving ? "Saving..." : "Save Changes"}</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 40 },
        ]}
      >
        {/* ── Center Profile Hero ── */}
        <View style={styles.profileHero}>
          <TouchableOpacity style={styles.avatarWrap} onPress={openEditModal} activeOpacity={0.9}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={modalStyles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{initials}</Text>
            )}
          </TouchableOpacity>
          <Text style={styles.profileName} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.profileEmail} numberOfLines={1}>
            {email}
          </Text>
        </View>

        {/* ── Premium Banner ── */}
        <TouchableOpacity
          style={styles.premiumBanner}
          activeOpacity={0.9}
        >
          <View style={styles.premiumIconWrap}>
            <Feather name="award" size={18} color={Colors.white} />
          </View>
          <View>
            <Text style={styles.premiumTitle}>Premium Account</Text>
            <Text style={styles.premiumSub}>Enjoy your premium features</Text>
          </View>
        </TouchableOpacity>

        {/* ── Sections ── */}
        <Section title="Account Settings">
          <SettingsRow
            icon="user"
            label="Account"
            onPress={() => {}}
          />
          <SettingsRow
            icon="bell"
            label="Notifications"
            onPress={() => {}}
          />
          <SettingsRow
            icon="shield"
            label="Security & Privacy"
            onPress={() => {}}
            isLast
          />
        </Section>

        <Section title="Data & Preferences">
          <SettingsRow
            icon="sliders"
            label="Preferences"
            onPress={() => {}}
          />
          <SettingsRow
            icon="download"
            label="Export Data"
            onPress={() => {}}
          />
          <SettingsRow
            icon="refresh-cw"
            label="Sync"
            onPress={() => {}}
            isLast
          />
        </Section>

        <Section title="Settings">
          <SettingsRow
            icon="help-circle"
            label="Help & Support"
            onPress={() => {}}
          />
          <SettingsRow
            icon="log-out"
            label={isLoading ? "Signing out…" : "Log out"}
            onPress={() => setShowSignOutModal(true)}
            destructive
            isLast
          />
        </Section>

      </ScrollView>
    </SafeAreaView>
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },

  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },

  // Profile Hero
  profileHero: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  avatarWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  avatarText: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    letterSpacing: 1,
  },
  profileName: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },

  // Premium Banner
  premiumBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  premiumIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  premiumTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    marginBottom: 2,
  },
  premiumSub: {
    fontSize: FontSize.xs,
    color: "rgba(255, 255, 255, 0.8)",
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.surfaceBorder,
    alignSelf: "center",
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 40,
  },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  avatarHelper: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
  },
  inputSection: {
    marginBottom: Spacing.xl,
  },
  inputLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    height: 50,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
});
