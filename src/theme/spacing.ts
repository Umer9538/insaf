/**
 * INSAF Design System - Spacing & Layout
 *
 * Consistent spacing system based on 4px grid
 */

// Base spacing unit
const BASE_UNIT = 4;

// Spacing scale (4px grid)
export const spacing = {
  none: 0,
  xs: BASE_UNIT,           // 4
  sm: BASE_UNIT * 2,       // 8
  md: BASE_UNIT * 3,       // 12
  base: BASE_UNIT * 4,     // 16
  lg: BASE_UNIT * 5,       // 20
  xl: BASE_UNIT * 6,       // 24
  '2xl': BASE_UNIT * 8,    // 32
  '3xl': BASE_UNIT * 10,   // 40
  '4xl': BASE_UNIT * 12,   // 48
  '5xl': BASE_UNIT * 16,   // 64
  '6xl': BASE_UNIT * 20,   // 80
  '7xl': BASE_UNIT * 24,   // 96
};

// Border radius
export const borderRadius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
};

// Border width
export const borderWidth = {
  none: 0,
  thin: 1,
  medium: 2,
  thick: 3,
};

// Icon sizes
export const iconSize = {
  xs: 12,
  sm: 16,
  md: 20,
  base: 24,
  lg: 28,
  xl: 32,
  '2xl': 40,
  '3xl': 48,
};

// Avatar sizes
export const avatarSize = {
  xs: 24,
  sm: 32,
  md: 40,
  base: 48,
  lg: 56,
  xl: 64,
  '2xl': 80,
  '3xl': 96,
  '4xl': 128,
};

// Button heights
export const buttonHeight = {
  sm: 36,
  md: 44,
  lg: 52,
  xl: 60,
};

// Input heights
export const inputHeight = {
  sm: 40,
  md: 48,
  lg: 56,
};

// Screen padding
export const screenPadding = {
  horizontal: spacing.base,
  vertical: spacing.lg,
};

// Card padding
export const cardPadding = {
  sm: spacing.md,
  md: spacing.base,
  lg: spacing.xl,
};

// Shadow presets (for elevation)
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  '2xl': {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    elevation: 16,
  },
  inner: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 0,
  },
};

// Z-index scale
export const zIndex = {
  hide: -1,
  base: 0,
  dropdown: 100,
  sticky: 200,
  fixed: 300,
  modal: 400,
  popover: 500,
  tooltip: 600,
  toast: 700,
  overlay: 800,
  max: 999,
};

// Animation durations
export const duration = {
  instant: 0,
  fastest: 100,
  fast: 200,
  normal: 300,
  slow: 400,
  slower: 500,
  slowest: 700,
};

// Animation easings
export const easing = {
  linear: [0, 0, 1, 1],
  easeIn: [0.4, 0, 1, 1],
  easeOut: [0, 0, 0.2, 1],
  easeInOut: [0.4, 0, 0.2, 1],
  bounce: [0.68, -0.55, 0.265, 1.55],
};

export type Spacing = typeof spacing;
export type BorderRadius = typeof borderRadius;
export type Shadows = typeof shadows;
