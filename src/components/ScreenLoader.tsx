import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Animated,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing } from "../utils/constants";

// ─── Screen Loader (gentle fade-in spinner) ───────────────────────────────────
export const ScreenLoader: React.FC<{ message?: string }> = ({
  message = "Loading…",
}) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 240,
      useNativeDriver: true,
    }).start();
  }, [opacity]);

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <ActivityIndicator size="large" color={Colors.accent} />
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
};

// ─── Error Banner ──────────────────────────────────────────────────────────────
interface ErrorBannerProps {
  message: string;
  onDismiss?: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  message,
  onDismiss,
}) => {
  if (!message) return null;
  return (
    <View style={styles.errorBanner}>
      <Text style={styles.errorText}>{message}</Text>
      {onDismiss && (
        <TouchableOpacity
          onPress={onDismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="x" size={16} color={Colors.danger} />
        </TouchableOpacity>
      )}
    </View>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  message: {
    fontSize: 13.5,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  errorBanner: {
    backgroundColor: `${Colors.danger}12`,
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
});
