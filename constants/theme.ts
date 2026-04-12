// AustraliaPath Design System
// Palette inspired by the Australian flag and landscape

export const Colors = {
  // Brand
  primary: '#00843D',       // Australian green
  primaryDark: '#005C2A',
  primaryLight: '#4CAF7A',
  accent: '#FFCD00',        // Gold
  accentDark: '#E6B800',

  // Neutrals
  background: '#F8F9FA',
  surface: '#FFFFFF',
  surfaceElevated: '#F0F4F8',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',

  // Text
  textPrimary: '#1A202C',
  textSecondary: '#4A5568',
  textTertiary: '#718096',
  textInverse: '#FFFFFF',
  textDisabled: '#A0AEC0',

  // Semantic
  success: '#38A169',
  warning: '#D69E2E',
  error: '#E53E3E',
  info: '#3182CE',

  // Premium / Paywall
  premium: '#7B4FBE',
  premiumLight: '#9F7AEA',
  premiumGradientStart: '#7B4FBE',
  premiumGradientEnd: '#4299E1',

  // Score colours
  scoreFull: '#38A169',    // 80–100
  scoreGood: '#68D391',    // 60–79
  scoreOk: '#ECC94B',      // 40–59
  scoreLow: '#FC8181',     // < 40

  // States (light mode only for MVP)
  overlay: 'rgba(0,0,0,0.5)',
  overlayLight: 'rgba(0,0,0,0.15)',
  shimmer: '#E8ECF1',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Typography = {
  // Font families (use system fonts for MVP — add custom later)
  fontRegular: undefined,   // System default
  fontMedium: undefined,
  fontSemiBold: undefined,
  fontBold: undefined,

  // Sizes
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  display: 38,
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
};
