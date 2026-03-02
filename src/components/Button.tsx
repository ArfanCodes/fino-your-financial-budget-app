import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Animated,
} from 'react-native';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../utils/constants';

// ─── Types ─────────────────────────────────────────────────────────────────────
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  fullWidth?: boolean;
}

// ─── Button Component ──────────────────────────────────────────────────────────
export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  style,
  labelStyle,
  fullWidth = true,
}) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const isDisabled = disabled || isLoading;

  return (
    <Animated.View
      style={[
        fullWidth && styles.fullWidth,
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        style={[
          styles.base,
          styles[`variant_${variant}`],
          styles[`size_${size}`],
          isDisabled && styles.disabled,
          style,
        ]}
      >
        {isLoading ? (
          <ActivityIndicator
            color={variant === 'secondary' || variant === 'ghost' ? Colors.primary : Colors.white}
            size="small"
          />
        ) : (
          <Text
            style={[
              styles.label,
              styles[`labelVariant_${variant}`],
              styles[`labelSize_${size}`],
              labelStyle,
            ]}
          >
            {label}
          </Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  fullWidth: { width: '100%' },

  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    flexDirection: 'row',
  },

  // Variants
  variant_primary: {
    backgroundColor: Colors.primary,
  },
  variant_secondary: {
    backgroundColor: Colors.transparent,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  variant_ghost: {
    backgroundColor: Colors.transparent,
  },
  variant_danger: {
    backgroundColor: Colors.danger,
  },

  // Sizes
  size_sm: { paddingVertical: Spacing.xs + 2, paddingHorizontal: Spacing.md, minHeight: 36 },
  size_md: { paddingVertical: Spacing.sm + 4, paddingHorizontal: Spacing.lg, minHeight: 50 },
  size_lg: { paddingVertical: Spacing.md - 2, paddingHorizontal: Spacing.xl, minHeight: 56 },

  disabled: { opacity: 0.5 },

  // Labels
  label: {
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.3,
  },
  labelVariant_primary: { color: Colors.white },
  labelVariant_secondary: { color: Colors.primary },
  labelVariant_ghost: { color: Colors.textSecondary },
  labelVariant_danger: { color: Colors.white },

  labelSize_sm: { fontSize: FontSize.sm },
  labelSize_md: { fontSize: FontSize.md },
  labelSize_lg: { fontSize: FontSize.lg },
});
