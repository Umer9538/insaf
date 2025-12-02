/**
 * INSAF - Themed Text Component
 *
 * Typography component with theme support
 */

import React, { useEffect, useRef } from 'react';
import {
  Text as RNText,
  TextProps as RNTextProps,
  TextStyle,
  Animated,
} from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { typography } from '../../theme/typography';

// Typography variants
type TypographyVariant = keyof typeof typography;

// Text color variants
type TextColor =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'disabled'
  | 'inverse'
  | 'link'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'brand';

interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: TextColor;
  align?: TextStyle['textAlign'];
  animated?: boolean;
  children: React.ReactNode;
}

export const Text: React.FC<TextProps> = ({
  variant = 'bodyMedium',
  color = 'primary',
  align,
  animated = false,
  style,
  children,
  ...props
}) => {
  const theme = useAppTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Fade in animation on mount when animated is true
  useEffect(() => {
    if (animated) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [animated, fadeAnim]);

  // Get typography styles
  const typographyStyle = typography[variant];

  // Get color
  const getColor = (): string => {
    switch (color) {
      case 'primary':
        return theme.colors.text.primary;
      case 'secondary':
        return theme.colors.text.secondary;
      case 'tertiary':
        return theme.colors.text.tertiary;
      case 'disabled':
        return theme.colors.text.disabled;
      case 'inverse':
        return theme.colors.text.inverse;
      case 'link':
        return theme.colors.text.link;
      case 'success':
        return theme.colors.status.success;
      case 'warning':
        return theme.colors.status.warning;
      case 'error':
        return theme.colors.status.error;
      case 'info':
        return theme.colors.status.info;
      case 'brand':
        return theme.colors.brand.primary;
      default:
        return theme.colors.text.primary;
    }
  };

  const combinedStyle = [
    typographyStyle,
    { color: getColor() },
    align && { textAlign: align },
    animated && { opacity: fadeAnim },
    style,
  ];

  if (animated) {
    return (
      <Animated.Text style={combinedStyle} {...props}>
        {children}
      </Animated.Text>
    );
  }

  return (
    <RNText style={combinedStyle} {...props}>
      {children}
    </RNText>
  );
};

// Convenience components
export const Heading1: React.FC<Omit<TextProps, 'variant'>> = (props) => (
  <Text variant="h1" {...props} />
);

export const Heading2: React.FC<Omit<TextProps, 'variant'>> = (props) => (
  <Text variant="h2" {...props} />
);

export const Heading3: React.FC<Omit<TextProps, 'variant'>> = (props) => (
  <Text variant="h3" {...props} />
);

export const Heading4: React.FC<Omit<TextProps, 'variant'>> = (props) => (
  <Text variant="h4" {...props} />
);

export const Body: React.FC<Omit<TextProps, 'variant'>> = (props) => (
  <Text variant="bodyMedium" {...props} />
);

export const BodySmall: React.FC<Omit<TextProps, 'variant'>> = (props) => (
  <Text variant="bodySmall" {...props} />
);

export const Caption: React.FC<Omit<TextProps, 'variant'>> = (props) => (
  <Text variant="caption" color="secondary" {...props} />
);

export const Label: React.FC<Omit<TextProps, 'variant'>> = (props) => (
  <Text variant="labelMedium" {...props} />
);

export default Text;
