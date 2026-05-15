import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, StatusBar } from "react-native";
import { Colors } from "../utils/constants";

/**
 * Branded boot splash. Shown during auth check + initial data prefetch.
 * Holds long enough to hide the initial mount jitter, then fades out
 * cleanly via the parent's conditional render.
 *
 * Pure visual — no spinner, just a soft pulse on the brand mark so the
 * screen feels alive without competing with the real loaders below.
 */
export const SplashScreen: React.FC = () => {
  const fadeIn = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Initial fade-in of the brand mark
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 320,
      useNativeDriver: true,
    }).start();

    // Gentle breathing pulse on the logo orb
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.06,
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
    loop.start();
    return () => loop.stop();
  }, [fadeIn, pulse]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      <Animated.View
        style={[
          styles.brand,
          { opacity: fadeIn, transform: [{ scale: pulse }] },
        ]}
      >
        <View style={styles.logoOrb}>
          <Text style={styles.logoText}>F</Text>
        </View>
        <Text style={styles.wordmark}>FinPulse</Text>
        <Text style={styles.tagline}>Premium finance, simplified</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  brand: {
    alignItems: "center",
    gap: 14,
  },
  logoOrb: {
    width: 78,
    height: 78,
    borderRadius: 26,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 0,
  },
  logoText: {
    fontSize: 38,
    fontWeight: "800",
    color: Colors.textOnLime,
    letterSpacing: -1.5,
  },
  wordmark: {
    fontSize: 26,
    fontWeight: "800",
    color: Colors.textPrimary,
    letterSpacing: -0.8,
    marginTop: 4,
  },
  tagline: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: "600",
    letterSpacing: 0.4,
  },
});
