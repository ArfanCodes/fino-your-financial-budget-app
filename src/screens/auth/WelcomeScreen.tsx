import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Colors,
  Spacing,
  FontSize,
  FontWeight,
  Radius,
} from "../../utils/constants";
import type { AuthStackParamList } from "../../types";

// ─── Types ─────────────────────────────────────────────────────────────────────
type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, "Welcome">;
};

const { height } = Dimensions.get("window");

// ─── Welcome Screen ────────────────────────────────────────────────────────────
export const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Logo */}
        <View style={styles.logoBlock}>
          <Image
            source={require("../../../assets/logo.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.logoText}>FINO</Text>
        </View>

        {/* Hero */}
        <View style={styles.heroBlock}>
          <Text style={styles.headline}>Your money,{"\n"}under control.</Text>
        </View>
      </Animated.View>

      {/* CTA buttons */}
      <Animated.View style={[styles.cta, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate("Signup")}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>Create Account</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate("Login")}
          activeOpacity={0.75}
        >
          <Text style={styles.secondaryBtnText}>Sign In</Text>
        </TouchableOpacity>

        <Text style={styles.credit}>made by Arfan</Text>
      </Animated.View>
    </SafeAreaView>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
  },

  content: {
    flex: 1,
    justifyContent: "center",
  },

  logoBlock: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xxxl,
    gap: Spacing.sm,
  },
  logoImage: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  logoText: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },

  heroBlock: {
    marginBottom: Spacing.xl,
  },
  headline: {
    fontSize: 38,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
    letterSpacing: -1.2,
    lineHeight: 46,
  },

  cta: {
    gap: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryBtnText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.white,
    letterSpacing: 0.2,
  },
  secondaryBtn: {
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  secondaryBtnText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  credit: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: Spacing.lg,
    fontWeight: FontWeight.medium,
    letterSpacing: 0.5,
  },
});
