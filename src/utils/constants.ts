// ─── Color Palette — FinPulse (Neon Lime + Deep Olive on Light Gray) ─────────
export const Colors = {
  // Primary brand — Electric neon lime used for hero card backgrounds & highlights
  primary: '#CCFA32',
  primaryLight: '#DEFC6B',
  primaryDark: '#A8D625',

  // Brand accent — Deep olive/green used for active pills, progress fills,
  // "View all" links, the Pro Level chip, and dark text-on-lime callouts.
  accent: '#4D6B12',
  accentLight: '#6B8C2A',
  accentDark: '#37500A',

  // True black — pill selectors (Month/Week), Upgrade, Send icon, primary CTAs
  brandBlack: '#0F1115',
  brandBlackSoft: '#1A1D24',

  // Semantic
  success: '#4D6B12',   // Use brand olive for "under budget" success states
  warning: '#FFAB00',
  danger: '#E5484D',    // Negative transactions, sign-out, alerts
  info: '#0D8FB2',

  // Neutrals — Light fintech surfaces
  background: '#F2F3F5',      // Soft neutral page background
  surface: '#FFFFFF',         // Crisp pure white cards
  surfaceElevated: '#EAECEF', // Faint button/chip background
  surfaceBorder: '#E4E6EB',   // Hairline borders

  // Text
  textPrimary: '#0F1115',     // Near-black for headings & balances
  textSecondary: '#6B7280',   // Slate for sub-labels
  textMuted: '#9BA0A8',       // Lightest slate for placeholders
  textInverse: '#FFFFFF',     // White text on dark buttons
  textOnLime: '#0F1115',      // Always dark text on lime backgrounds

  // Input
  inputBackground: '#FFFFFF',
  inputBorder: '#E4E6EB',
  inputBorderFocused: '#0F1115',
  inputPlaceholder: '#9BA0A8',

  // Overlay (modal backdrop — kept subtle so colored hero cards don't muddy)
  overlay: 'rgba(15, 17, 21, 0.25)',

  // Utility
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
  md: 12,
  lg: 18,
  xl: 24,
  xxl: 28,
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
