import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  StatusBar,
  TouchableOpacity,
  Modal,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useForm, Controller } from "react-hook-form";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "../../store/auth.store";
import { Button } from "../../components/Button";
import { InputField } from "../../components/InputField";
import { ErrorBanner } from "../../components/ScreenLoader";
import {
  Colors,
  Spacing,
  FontSize,
  FontWeight,
  Radius,
} from "../../utils/constants";
import type { AuthStackParamList, SignupFormValues } from "../../types";

// ─── Types ─────────────────────────────────────────────────────────────────────
type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, "Signup">;
};

// ─── Signup Screen ─────────────────────────────────────────────────────────────
export const SignupScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const signUp = useAuthStore((s) => s.signUp);
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupFormValues>({
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onBlur",
  });

  const passwordValue = watch("password");

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();
    clearError();
  }, []);

  const onSubmit = async (values: SignupFormValues) => {
    const result = await signUp(values);

    if (result.success && result.needsConfirmation) {
      setRegisteredEmail(values.email.trim().toLowerCase());
      setShowConfirmModal(true);
    }
    // If success && no confirmation → RootNavigator auto-navigates via user state
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + Spacing.xl,
              paddingBottom: insets.bottom + Spacing.xxl,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="arrow-left" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>

          {/* Header */}
          <Animated.View
            style={[
              styles.header,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>
              Start tracking your finances today
            </Text>
          </Animated.View>

          {/* Form */}
          <Animated.View
            style={[
              styles.form,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            {error ? (
              <ErrorBanner message={error} onDismiss={clearError} />
            ) : null}

            <Controller
              control={control}
              name="username"
              rules={{
                required: "Username is required",
                minLength: { value: 3, message: "At least 3 characters" },
                maxLength: { value: 20, message: "Max 20 characters" },
                pattern: {
                  value: /^[a-zA-Z0-9_]+$/,
                  message: "Only letters, numbers and underscores",
                },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <InputField
                  label="Username"
                  placeholder="Choose a username"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.username?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="email"
              rules={{
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Enter a valid email address",
                },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <InputField
                  label="Email Address"
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.email?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              rules={{
                required: "Password is required",
                minLength: { value: 8, message: "At least 8 characters" },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                  message: "Must include uppercase, lowercase and number",
                },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <InputField
                  label="Password"
                  placeholder="Create a strong password"
                  isPassword
                  returnKeyType="next"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                  hint={
                    !errors.password
                      ? "Min 8 chars, uppercase, lowercase & number"
                      : undefined
                  }
                />
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              rules={{
                required: "Please confirm your password",
                validate: (val) =>
                  val === passwordValue || "Passwords do not match",
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <InputField
                  label="Confirm Password"
                  placeholder="Repeat your password"
                  isPassword
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit(onSubmit)}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.confirmPassword?.message}
                />
              )}
            />

            <View style={styles.spacer} />

            <Button
              label="Create Account"
              onPress={handleSubmit(onSubmit)}
              isLoading={isLoading}
              size="lg"
            />

            <Text style={styles.terms}>
              By creating an account, you agree to our{" "}
              <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </Animated.View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Text
              style={styles.footerLink}
              onPress={() => navigation.replace("Login")}
            >
              Sign In
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Email Confirmation Modal */}
      <EmailConfirmModal
        visible={showConfirmModal}
        email={registeredEmail}
        onGoToLogin={() => {
          setShowConfirmModal(false);
          navigation.replace("Login");
        }}
      />
    </View>
  );
};

// ─── Email Confirm Modal ───────────────────────────────────────────────────────
const EmailConfirmModal: React.FC<{
  visible: boolean;
  email: string;
  onGoToLogin: () => void;
}> = ({ visible, email, onGoToLogin }) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    statusBarTranslucent
  >
    <View style={modalStyles.overlay}>
      <View style={modalStyles.card}>
        <View style={modalStyles.iconWrap}>
          <Feather name="mail" size={24} color={Colors.primary} />
        </View>
        <Text style={modalStyles.title}>Check your inbox</Text>
        <Text style={modalStyles.body}>
          We've sent a confirmation link to{" "}
          <Text style={modalStyles.email}>{email}</Text>.{"\n\n"}
          Please verify your email before signing in.
        </Text>
        <Button label="Go to Sign In" onPress={onGoToLogin} size="md" />
      </View>
    </View>
  </Modal>
);

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },

  backBtn: { marginBottom: Spacing.xl, width: 40 },

  header: { marginBottom: Spacing.xl },
  title: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
    letterSpacing: -0.8,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },

  form: { flex: 1 },
  spacer: { flex: 1, minHeight: Spacing.lg },

  terms: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: "center",
    marginTop: Spacing.md,
    lineHeight: 18,
  },
  termsLink: { color: Colors.primary },

  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.xl,
  },
  footerText: { fontSize: FontSize.md, color: Colors.textSecondary },
  footerLink: {
    fontSize: FontSize.md,
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    width: "100%",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.surfaceBorder,
    gap: Spacing.md,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${Colors.primary}18`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: "center",
  },
  body: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
  email: {
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },
});
