// ─── Color Palette — Fintech White & Electric Violet ─────────────────────────
export const Colors = {
  // Primary brand — Electric Violet from the cards
  primary: '#7148FC',         
  primaryLight: '#9474FF',
  primaryDark: '#5024DE',

  // Accent — Pink highlights for minor icons
  accent: '#FF57A6',          
  accentLight: '#FF88C2',
  accentDark: '#D82E7E',

  // Semantic (Bright variations matching screenshot)
  success: '#10C759', // Vibrant 'transfer' green
  warning: '#FFAB00',
  danger: '#FF3D71',  // Redish-pink for expensive transactions
  info: '#00B8D9',

  // Neutrals — Air-light fintech vibes
  background: '#F6F8FD',      // Faint icy-lavender/white background
  surface: '#FFFFFF',         // Crisp pure white cards
  surfaceElevated: '#F2F5FB', // Soft button backgrounds (for pills)
  surfaceBorder: '#E8ECF4',   // Very faint, airy borders

  // Text — Maximum readability
  textPrimary: '#12141D',     // Stark dark black-navy for strong contrast
  textSecondary: '#6B7280',   // Cool slate for subtext and axis labels
  textMuted: '#9BA3BB',       // Lighter faint slate
  textInverse: '#FFFFFF',     // White text on dark colored buttons

  // Input
  inputBackground: '#F2F5FB',
  inputBorder: '#E8ECF4',
  inputBorderFocused: '#7148FC',
  inputPlaceholder: '#9BA3BB',

  // Overlay
  overlay: 'rgba(18, 20, 29, 0.4)',

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
