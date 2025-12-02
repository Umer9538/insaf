/**
 * INSAF - Animated Button Component
 *
 * Professional button with animations (using native Animated API)
 */

import React, { useRef } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ViewStyle,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { Text } from './Text';

// Button variants
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
}) => {
  const theme = useAppTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  // Get button styles based on variant
  const getButtonStyles = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: theme.borderRadius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    };

    const sizeStyles: Record<ButtonSize, ViewStyle> = {
      sm: { height: theme.buttonHeight.sm, paddingHorizontal: theme.spacing.base },
      md: { height: theme.buttonHeight.md, paddingHorizontal: theme.spacing.xl },
      lg: { height: theme.buttonHeight.lg, paddingHorizontal: theme.spacing['2xl'] },
      xl: { height: theme.buttonHeight.xl, paddingHorizontal: theme.spacing['3xl'] },
    };

    const variantStyles: Record<ButtonVariant, ViewStyle> = {
      primary: { backgroundColor: theme.colors.interactive.primary },
      secondary: { backgroundColor: theme.colors.interactive.secondary },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: theme.colors.interactive.primary,
      },
      ghost: { backgroundColor: 'transparent' },
      gradient: { backgroundColor: 'transparent', overflow: 'hidden' },
      danger: { backgroundColor: theme.colors.status.error },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...(disabled && { opacity: 0.5 }),
      ...(fullWidth && { width: '100%' }),
    };
  };

  const getTextColor = (): string => {
    switch (variant) {
      case 'primary':
      case 'gradient':
      case 'danger':
        return '#FFFFFF';
      case 'secondary':
        return theme.isDark ? theme.colors.text.primary : theme.colors.text.inverse;
      case 'outline':
      case 'ghost':
        return theme.colors.interactive.primary;
      default:
        return '#FFFFFF';
    }
  };

  const getTextVariant = () => {
    switch (size) {
      case 'sm': return 'buttonSmall';
      case 'lg':
      case 'xl': return 'buttonLarge';
      default: return 'buttonMedium';
    }
  };

  const getIconSize = (): number => {
    switch (size) {
      case 'sm': return 16;
      case 'lg':
      case 'xl': return 24;
      default: return 20;
    }
  };

  const textColor = getTextColor();
  const iconSize = getIconSize();

  const renderContent = () => (
    <>
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Ionicons
              name={icon}
              size={iconSize}
              color={textColor}
              style={{ marginRight: theme.spacing.sm }}
            />
          )}
          <Text variant={getTextVariant() as any} style={{ color: textColor }}>
            {title}
          </Text>
          {icon && iconPosition === 'right' && (
            <Ionicons
              name={icon}
              size={iconSize}
              color={textColor}
              style={{ marginLeft: theme.spacing.sm }}
            />
          )}
        </>
      )}
    </>
  );

  if (variant === 'gradient') {
    return (
      <AnimatedTouchable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={1}
        style={[{ transform: [{ scale }] }, style]}
      >
        <LinearGradient
          colors={theme.colors.gradient.premium as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[getButtonStyles(), { width: fullWidth ? '100%' : undefined }]}
        >
          {renderContent()}
        </LinearGradient>
      </AnimatedTouchable>
    );
  }

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      activeOpacity={1}
      style={[getButtonStyles(), { transform: [{ scale }] }, style]}
    >
      {renderContent()}
    </AnimatedTouchable>
  );
};

// Icon Button
interface IconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  style?: ViewStyle;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onPress,
  size = 'md',
  variant = 'ghost',
  disabled = false,
  style,
}) => {
  const theme = useAppTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.9, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
  };

  const sizeMap = {
    sm: { container: 36, icon: 18 },
    md: { container: 44, icon: 22 },
    lg: { container: 52, icon: 26 },
  };

  const getBackgroundColor = () => {
    switch (variant) {
      case 'primary': return theme.colors.interactive.primary;
      case 'secondary': return theme.colors.surface.secondary;
      default: return 'transparent';
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case 'primary': return '#FFFFFF';
      default: return theme.colors.text.primary;
    }
  };

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      activeOpacity={1}
      style={[
        {
          width: sizeMap[size].container,
          height: sizeMap[size].container,
          borderRadius: sizeMap[size].container / 2,
          backgroundColor: getBackgroundColor(),
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.5 : 1,
          transform: [{ scale }],
        },
        style,
      ]}
    >
      <Ionicons name={icon} size={sizeMap[size].icon} color={getIconColor()} />
    </AnimatedTouchable>
  );
};

export default Button;
