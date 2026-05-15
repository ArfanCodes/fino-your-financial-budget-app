import React, { useEffect, useRef } from "react";
import { Animated, ViewStyle, StyleProp } from "react-native";

/**
 * Premium screen-reveal animation. Crossfades children from 0→1 opacity
 * AND lightly scales them from 0.98→1 in the same window. Feels native
 * (think iOS settings push), softer than a slide, and lighter than a
 * full sheet animation. Native-driver only — no JS-thread cost.
 *
 * Default duration sits in the 220–320 ms sweet spot used by most
 * modern fintech / productivity apps.
 */
interface FadeInProps {
  children: React.ReactNode;
  /** Override the default 260ms fade+scale. */
  duration?: number;
  /** Stagger delay (ms) — useful when revealing sections in sequence. */
  delay?: number;
  /** Disable the scale and just crossfade (rare — use for tiny inline reveals). */
  noScale?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const FadeIn: React.FC<FadeInProps> = ({
  children,
  duration = 260,
  delay = 0,
  noScale = false,
  style,
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(noScale ? 1 : 0.98)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, scale, duration, delay]);

  return (
    <Animated.View style={[{ opacity, transform: [{ scale }] }, style]}>
      {children}
    </Animated.View>
  );
};
