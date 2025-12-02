/**
 * INSAF - Animated Card Component
 *
 * Versatile card component with animations and variants
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../../context/ThemeContext';

// Card variants
type CardVariant = 'elevated' | 'outlined' | 'filled' | 'gradient';
type CardPadding = 'none' | 'sm' | 'md' | 'lg';

// Animation presets
type AnimationPreset = 'fadeIn' | 'fadeInDown' | 'fadeInUp' | 'slideInRight' | 'none';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  onPress?: () => void;
  disabled?: boolean;
  animation?: AnimationPreset;
  animationDelay?: number;
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'elevated',
  padding = 'md',
  onPress,
  disabled = false,
  animation = 'fadeIn',
  animationDelay = 0,
  style,
}) => {
  const theme = useAppTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;
  const translateXAnim = useRef(new Animated.Value(0)).current;

  // Entrance animation
  useEffect(() => {
    if (animation === 'none') {
      opacityAnim.setValue(1);
      return;
    }

    const animations: Animated.CompositeAnimation[] = [];

    // Set initial values based on animation type
    switch (animation) {
      case 'fadeInDown':
        translateYAnim.setValue(-20);
        animations.push(
          Animated.timing(translateYAnim, {
            toValue: 0,
            duration: 400,
            delay: animationDelay,
            useNativeDriver: true,
          })
        );
        break;
      case 'fadeInUp':
        translateYAnim.setValue(20);
        animations.push(
          Animated.timing(translateYAnim, {
            toValue: 0,
            duration: 400,
            delay: animationDelay,
            useNativeDriver: true,
          })
        );
        break;
      case 'slideInRight':
        translateXAnim.setValue(50);
        animations.push(
          Animated.timing(translateXAnim, {
            toValue: 0,
            duration: 400,
            delay: animationDelay,
            useNativeDriver: true,
          })
        );
        break;
    }

    // Add fade in animation for all types except 'none'
    animations.push(
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: animation === 'fadeIn' ? 300 : 400,
        delay: animationDelay,
        useNativeDriver: true,
      })
    );

    Animated.parallel(animations).start();
  }, [animation, animationDelay]);

  // Press animation handlers
  const handlePressIn = () => {
    if (onPress) {
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        damping: 15,
        stiffness: 400,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        damping: 15,
        stiffness: 400,
        useNativeDriver: true,
      }).start();
    }
  };

  // Get padding value
  const getPadding = (): number => {
    switch (padding) {
      case 'none':
        return 0;
      case 'sm':
        return theme.cardPadding.sm;
      case 'lg':
        return theme.cardPadding.lg;
      default:
        return theme.cardPadding.md;
    }
  };

  // Get card styles based on variant
  const getCardStyles = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: theme.borderRadius.lg,
      padding: getPadding(),
      overflow: 'hidden',
    };

    switch (variant) {
      case 'elevated':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.card.background,
          ...theme.shadows.md,
        };
      case 'outlined':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.card.background,
          borderWidth: 1,
          borderColor: theme.colors.card.border,
        };
      case 'filled':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.surface.secondary,
        };
      case 'gradient':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
        };
      default:
        return baseStyle;
    }
  };

  // Animated styles
  const animatedStyle = {
    opacity: animation === 'none' ? 1 : opacityAnim,
    transform: [
      { scale: scaleAnim },
      { translateY: translateYAnim },
      { translateX: translateXAnim },
    ],
  };

  // Gradient card
  if (variant === 'gradient') {
    if (onPress) {
      return (
        <Animated.View style={[animatedStyle, style]}>
          <TouchableOpacity
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled}
            activeOpacity={1}
          >
            <LinearGradient
              colors={theme.colors.gradient.card as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[getCardStyles(), { padding: getPadding() }]}
            >
              {children}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      );
    }

    return (
      <Animated.View style={[animatedStyle, style]}>
        <LinearGradient
          colors={theme.colors.gradient.card as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[getCardStyles(), { padding: getPadding() }]}
        >
          {children}
        </LinearGradient>
      </Animated.View>
    );
  }

  // Regular card
  if (onPress) {
    return (
      <Animated.View style={[animatedStyle, style]}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
          activeOpacity={1}
          style={getCardStyles()}
        >
          {children}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[getCardStyles(), animatedStyle, style]}>
      {children}
    </Animated.View>
  );
};

// Premium Card with gold accent
interface PremiumCardProps extends Omit<CardProps, 'variant'> {
  accentPosition?: 'left' | 'top';
}

export const PremiumCard: React.FC<PremiumCardProps> = ({
  children,
  accentPosition = 'left',
  style,
  ...props
}) => {
  const theme = useAppTheme();

  return (
    <Card variant="elevated" {...props} style={style}>
      <View
        style={[
          styles.premiumAccent,
          {
            backgroundColor: theme.colors.brand.secondary,
          },
          accentPosition === 'left'
            ? styles.premiumAccentLeft
            : styles.premiumAccentTop,
        ]}
      />
      {children}
    </Card>
  );
};

// Stats Card
interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  animation?: AnimationPreset;
  animationDelay?: number;
  style?: ViewStyle;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  trend,
  animation = 'fadeInUp',
  animationDelay = 0,
  style,
}) => {
  const theme = useAppTheme();
  const Text = require('./Text').Text;

  return (
    <Card
      variant="elevated"
      animation={animation}
      animationDelay={animationDelay}
      style={[styles.statsCard, style]}
    >
      <View style={styles.statsHeader}>
        <Text variant="caption" color="secondary">
          {title}
        </Text>
        {icon && <View style={styles.statsIcon}>{icon}</View>}
      </View>
      <Text variant="displaySmall" color="primary" style={styles.statsValue}>
        {value}
      </Text>
      {trend && (
        <View style={styles.statsTrend}>
          <Text
            variant="caption"
            style={{
              color: trend.isPositive
                ? theme.colors.status.success
                : theme.colors.status.error,
            }}
          >
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </Text>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  premiumAccent: {
    position: 'absolute',
  },
  premiumAccentLeft: {
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  premiumAccentTop: {
    left: 0,
    right: 0,
    top: 0,
    height: 4,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  statsCard: {
    minWidth: 140,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statsIcon: {
    opacity: 0.7,
  },
  statsValue: {
    marginBottom: 4,
  },
  statsTrend: {
    marginTop: 4,
  },
});

export default Card;
