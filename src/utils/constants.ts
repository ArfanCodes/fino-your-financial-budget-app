// ─── Color Palette — Revolut/N26 inspired dark banking theme ──────────────────
export const Colors = {
  // Primary brand — controlled indigo accent
  primary: '#6366F1',
  primaryLight: '#818CF8',
  primaryDark: '#4F46E5',

  // Accent — teal, used sparingly
  accent: '#14B8A6',
  accentLight: '#2DD4BF',
  accentDark: '#0F9484',

  // Semantic
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',

  // Neutrals — deep neutral dark base (no blue cast, no purple tint)
  background: '#0F172A',
  surface: '#1E293B',
  surfaceElevated: '#273549',
  surfaceBorder: '#334155',

  // Text
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#475569',
  textInverse: '#0F172A',

  // Input
  inputBackground: '#1E293B',
  inputBorder: '#334155',
  inputBorderFocused: '#6366F1',
  inputPlaceholder: '#475569',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.65)',

  // White/Black
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

// ─── Spacing Scale ─────────────────────────────────────────────────────────────
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

// ─── Border Radius ─────────────────────────────────────────────────────────────
export const Radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
} as const;

// ─── Font Sizes ─────────────────────────────────────────────────────────────────
export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  display: 44,
} as const;

// ─── Font Weights ──────────────────────────────────────────────────────────────
export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

// ─── Screen Dimensions ─────────────────────────────────────────────────────────
export const HEADER_HEIGHT = 60;
export const TAB_BAR_HEIGHT = 64;

// ─── Animation Durations ───────────────────────────────────────────────────────
export const Duration = {
  fast: 150,
  normal: 250,
  slow: 400,
} as const;

// ─── Default Categories ────────────────────────────────────────────────────────
export const DEFAULT_CATEGORIES = [
  { name: 'Food & Dining', color: '#F87171' },
  { name: 'Transport', color: '#34D399' },
  { name: 'Shopping', color: '#60A5FA' },
  { name: 'Entertainment', color: '#A78BFA' },
  { name: 'Health', color: '#4ADE80' },
  { name: 'Bills & Utilities', color: '#FBBF24' },
  { name: 'Education', color: '#38BDF8' },
  { name: 'Other', color: '#94A3B8' },
] as const;
