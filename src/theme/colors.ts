/**
 * INSAF Design System - Colors
 *
 * A premium legal services color palette conveying:
 * - Trust & Security (Deep Navy)
 * - Justice & Excellence (Gold)
 * - Clarity & Professionalism (Clean neutrals)
 */

export const palette = {
  // Primary - Deep Navy (Trust, Authority)
  navy: {
    50: '#E8EBF0',
    100: '#C5CDD9',
    200: '#9FADC0',
    300: '#798DA7',
    400: '#5C7594',
    500: '#3F5D81',
    600: '#334D6E',
    700: '#273C57',
    800: '#1B2B40',
    900: '#0F1A29',
    950: '#080D14',
  },

  // Secondary - Royal Gold (Justice, Premium)
  gold: {
    50: '#FFF9E6',
    100: '#FFEFC2',
    200: '#FFE499',
    300: '#FFD966',
    400: '#FFCD33',
    500: '#F5B800',
    600: '#CC9900',
    700: '#997300',
    800: '#664D00',
    900: '#332600',
  },

  // Accent - Teal (Growth, Balance)
  teal: {
    50: '#E6F7F7',
    100: '#B3E8E8',
    200: '#80D9D9',
    300: '#4DCACA',
    400: '#26BFBF',
    500: '#00B3B3',
    600: '#009999',
    700: '#007A7A',
    800: '#005C5C',
    900: '#003D3D',
  },

  // Success
  success: {
    light: '#4ADE80',
    main: '#22C55E',
    dark: '#16A34A',
  },

  // Warning
  warning: {
    light: '#FCD34D',
    main: '#F59E0B',
    dark: '#D97706',
  },

  // Error
  error: {
    light: '#F87171',
    main: '#EF4444',
    dark: '#DC2626',
  },

  // Info
  info: {
    light: '#60A5FA',
    main: '#3B82F6',
    dark: '#2563EB',
  },

  // Neutrals
  neutral: {
    0: '#FFFFFF',
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0A0A0A',
    1000: '#000000',
  },
};

// Light Theme Colors
export const lightColors = {
  // Backgrounds
  background: {
    primary: '#FFFFFF',
    secondary: '#F8FAFC',
    tertiary: '#F1F5F9',
    elevated: '#FFFFFF',
    overlay: 'rgba(15, 26, 41, 0.5)',
  },

  // Surfaces
  surface: {
    primary: '#FFFFFF',
    secondary: '#F8FAFC',
    tertiary: '#F1F5F9',
    disabled: '#E2E8F0',
  },

  // Text
  text: {
    primary: palette.navy[900],
    secondary: palette.navy[600],
    tertiary: palette.navy[400],
    disabled: palette.neutral[400],
    inverse: '#FFFFFF',
    link: palette.teal[600],
  },

  // Brand
  brand: {
    primary: palette.navy[700],
    secondary: palette.gold[500],
    accent: palette.teal[500],
  },

  // Borders
  border: {
    light: '#E2E8F0',
    medium: '#CBD5E1',
    strong: '#94A3B8',
    focus: palette.navy[500],
  },

  // Status
  status: {
    success: palette.success.main,
    successBg: '#DCFCE7',
    warning: palette.warning.main,
    warningBg: '#FEF3C7',
    error: palette.error.main,
    errorBg: '#FEE2E2',
    info: palette.info.main,
    infoBg: '#DBEAFE',
  },

  // Interactive
  interactive: {
    primary: palette.navy[700],
    primaryHover: palette.navy[800],
    primaryPressed: palette.navy[900],
    secondary: palette.gold[500],
    secondaryHover: palette.gold[600],
    disabled: palette.neutral[300],
  },

  // Gradients
  gradient: {
    primary: [palette.navy[700], palette.navy[900]],
    secondary: [palette.gold[400], palette.gold[600]],
    accent: [palette.teal[400], palette.teal[600]],
    premium: [palette.navy[800], palette.gold[600]],
    card: ['#FFFFFF', '#F8FAFC'],
  },

  // Shadows (rgba values for shadows)
  shadow: {
    color: 'rgba(15, 26, 41, 0.1)',
    colorStrong: 'rgba(15, 26, 41, 0.2)',
  },

  // Specific UI Elements
  card: {
    background: '#FFFFFF',
    border: '#E2E8F0',
  },

  input: {
    background: '#FFFFFF',
    border: '#CBD5E1',
    borderFocus: palette.navy[500],
    placeholder: palette.neutral[400],
  },

  tabBar: {
    background: '#FFFFFF',
    active: palette.navy[700],
    inactive: palette.neutral[400],
  },

  // Case status colors
  caseStatus: {
    draft: palette.neutral[400],
    posted: palette.info.main,
    bidding: palette.gold[500],
    assigned: palette.teal[500],
    inProgress: palette.navy[500],
    completed: palette.success.main,
    disputed: palette.error.main,
    cancelled: palette.neutral[500],
  },

  // Verification badge
  verified: {
    background: palette.gold[500],
    text: palette.navy[900],
  },
};

// Dark Theme Colors
export const darkColors = {
  // Backgrounds
  background: {
    primary: palette.navy[950],
    secondary: palette.navy[900],
    tertiary: palette.navy[800],
    elevated: palette.navy[800],
    overlay: 'rgba(0, 0, 0, 0.7)',
  },

  // Surfaces
  surface: {
    primary: palette.navy[900],
    secondary: palette.navy[800],
    tertiary: palette.navy[700],
    disabled: palette.navy[800],
  },

  // Text
  text: {
    primary: '#FFFFFF',
    secondary: palette.neutral[300],
    tertiary: palette.neutral[400],
    disabled: palette.neutral[600],
    inverse: palette.navy[900],
    link: palette.teal[400],
  },

  // Brand
  brand: {
    primary: palette.gold[500],
    secondary: palette.navy[400],
    accent: palette.teal[400],
  },

  // Borders
  border: {
    light: palette.navy[700],
    medium: palette.navy[600],
    strong: palette.navy[500],
    focus: palette.gold[500],
  },

  // Status
  status: {
    success: palette.success.light,
    successBg: 'rgba(34, 197, 94, 0.15)',
    warning: palette.warning.light,
    warningBg: 'rgba(245, 158, 11, 0.15)',
    error: palette.error.light,
    errorBg: 'rgba(239, 68, 68, 0.15)',
    info: palette.info.light,
    infoBg: 'rgba(59, 130, 246, 0.15)',
  },

  // Interactive
  interactive: {
    primary: palette.gold[500],
    primaryHover: palette.gold[400],
    primaryPressed: palette.gold[600],
    secondary: palette.navy[500],
    secondaryHover: palette.navy[400],
    disabled: palette.navy[700],
  },

  // Gradients
  gradient: {
    primary: [palette.navy[800], palette.navy[950]],
    secondary: [palette.gold[500], palette.gold[700]],
    accent: [palette.teal[500], palette.teal[700]],
    premium: [palette.gold[600], palette.navy[800]],
    card: [palette.navy[800], palette.navy[900]],
  },

  // Shadows
  shadow: {
    color: 'rgba(0, 0, 0, 0.3)',
    colorStrong: 'rgba(0, 0, 0, 0.5)',
  },

  // Specific UI Elements
  card: {
    background: palette.navy[800],
    border: palette.navy[700],
  },

  input: {
    background: palette.navy[800],
    border: palette.navy[600],
    borderFocus: palette.gold[500],
    placeholder: palette.neutral[500],
  },

  tabBar: {
    background: palette.navy[900],
    active: palette.gold[500],
    inactive: palette.neutral[500],
  },

  // Case status colors
  caseStatus: {
    draft: palette.neutral[500],
    posted: palette.info.light,
    bidding: palette.gold[400],
    assigned: palette.teal[400],
    inProgress: palette.navy[300],
    completed: palette.success.light,
    disputed: palette.error.light,
    cancelled: palette.neutral[500],
  },

  // Verification badge
  verified: {
    background: palette.gold[500],
    text: palette.navy[900],
  },
};

export type ThemeColors = typeof lightColors;
