/**
 * INSAF Design System - Theme Index
 *
 * Export all theme tokens and utilities
 */

export * from './colors';
export * from './typography';
export * from './spacing';

import { lightColors, darkColors, ThemeColors } from './colors';
import { typography, Typography } from './typography';
import {
  spacing,
  borderRadius,
  borderWidth,
  iconSize,
  avatarSize,
  buttonHeight,
  inputHeight,
  screenPadding,
  cardPadding,
  shadows,
  zIndex,
  duration,
  easing,
  Spacing,
  BorderRadius,
  Shadows,
} from './spacing';

// Theme type
export interface Theme {
  colors: ThemeColors;
  typography: Typography;
  spacing: Spacing;
  borderRadius: BorderRadius;
  borderWidth: typeof borderWidth;
  iconSize: typeof iconSize;
  avatarSize: typeof avatarSize;
  buttonHeight: typeof buttonHeight;
  inputHeight: typeof inputHeight;
  screenPadding: typeof screenPadding;
  cardPadding: typeof cardPadding;
  shadows: Shadows;
  zIndex: typeof zIndex;
  duration: typeof duration;
  easing: typeof easing;
  isDark: boolean;
}

// Light theme
export const lightTheme: Theme = {
  colors: lightColors,
  typography,
  spacing,
  borderRadius,
  borderWidth,
  iconSize,
  avatarSize,
  buttonHeight,
  inputHeight,
  screenPadding,
  cardPadding,
  shadows,
  zIndex,
  duration,
  easing,
  isDark: false,
};

// Dark theme
export const darkTheme: Theme = {
  colors: darkColors,
  typography,
  spacing,
  borderRadius,
  borderWidth,
  iconSize,
  avatarSize,
  buttonHeight,
  inputHeight,
  screenPadding,
  cardPadding,
  shadows,
  zIndex,
  duration,
  easing,
  isDark: true,
};
