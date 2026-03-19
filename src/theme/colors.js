// GigEase Design Tokens – Blue / White / Green Fintech Theme

export const COLORS = {
  // Primary Blues
  primaryDark: '#0A1F44',
  primary: '#1A56DB',
  primaryLight: '#3B82F6',
  primaryFaded: '#DBEAFE',
  primaryUltraLight: '#EFF6FF',

  // Greens
  success: '#16A34A',
  successLight: '#BBF7D0',
  successFaded: '#F0FDF4',

  // Status
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  info: '#0EA5E9',
  infoLight: '#E0F2FE',

  // Neutrals
  white: '#FFFFFF',
  background: '#F1F5F9',
  cardBg: '#FFFFFF',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  
  // Text
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textWhite: '#FFFFFF',

  // Shadows
  shadowColor: '#0A1F44',

  // Specific risk colors
  riskLow: '#16A34A',
  riskMedium: '#F59E0B',
  riskHigh: '#EF4444',

  // Gradient helpers
  gradientStart: '#1A56DB',
  gradientEnd: '#3B82F6',
};

export const SHADOWS = {
  small: {
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  medium: {
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};

export const FONT_SIZES = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  display: 36,
};
