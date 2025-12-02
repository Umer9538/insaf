/**
 * INSAF - Badge Component
 *
 * Status badges, tags, and chips
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { Text } from './Text';

type BadgeVariant = 'solid' | 'outline' | 'subtle';
type BadgeColor = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'gold';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  color?: BadgeColor;
  size?: BadgeSize;
  icon?: keyof typeof Ionicons.glyphMap;
  onRemove?: () => void;
  animated?: boolean;
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'solid',
  color = 'primary',
  size = 'md',
  icon,
  onRemove,
  animated = true,
  style,
}) => {
  const theme = useAppTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [animated, fadeAnim]);

  // Get colors based on color prop
  const getColors = () => {
    const colorMap = {
      primary: {
        bg: theme.colors.brand.primary,
        bgSubtle: `${theme.colors.brand.primary}20`,
        text: '#FFFFFF',
        textSubtle: theme.colors.brand.primary,
        border: theme.colors.brand.primary,
      },
      secondary: {
        bg: theme.colors.surface.tertiary,
        bgSubtle: theme.colors.surface.secondary,
        text: theme.colors.text.primary,
        textSubtle: theme.colors.text.secondary,
        border: theme.colors.border.medium,
      },
      success: {
        bg: theme.colors.status.success,
        bgSubtle: theme.colors.status.successBg,
        text: '#FFFFFF',
        textSubtle: theme.colors.status.success,
        border: theme.colors.status.success,
      },
      warning: {
        bg: theme.colors.status.warning,
        bgSubtle: theme.colors.status.warningBg,
        text: '#000000',
        textSubtle: theme.colors.status.warning,
        border: theme.colors.status.warning,
      },
      error: {
        bg: theme.colors.status.error,
        bgSubtle: theme.colors.status.errorBg,
        text: '#FFFFFF',
        textSubtle: theme.colors.status.error,
        border: theme.colors.status.error,
      },
      info: {
        bg: theme.colors.status.info,
        bgSubtle: theme.colors.status.infoBg,
        text: '#FFFFFF',
        textSubtle: theme.colors.status.info,
        border: theme.colors.status.info,
      },
      gold: {
        bg: theme.colors.brand.secondary,
        bgSubtle: `${theme.colors.brand.secondary}20`,
        text: theme.colors.verified.text,
        textSubtle: theme.colors.brand.secondary,
        border: theme.colors.brand.secondary,
      },
    };
    return colorMap[color];
  };

  const colors = getColors();

  // Size styles
  const sizeStyles = {
    sm: {
      paddingVertical: 2,
      paddingHorizontal: 8,
      fontSize: 10,
      iconSize: 10,
      borderRadius: theme.borderRadius.sm,
    },
    md: {
      paddingVertical: 4,
      paddingHorizontal: 10,
      fontSize: 12,
      iconSize: 12,
      borderRadius: theme.borderRadius.md,
    },
    lg: {
      paddingVertical: 6,
      paddingHorizontal: 14,
      fontSize: 14,
      iconSize: 14,
      borderRadius: theme.borderRadius.md,
    },
  };

  const currentSize = sizeStyles[size];

  // Get variant styles
  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'solid':
        return { backgroundColor: colors.bg };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors.border,
        };
      case 'subtle':
        return { backgroundColor: colors.bgSubtle };
      default:
        return { backgroundColor: colors.bg };
    }
  };

  const getTextColor = (): string => {
    switch (variant) {
      case 'solid':
        return colors.text;
      case 'outline':
      case 'subtle':
        return colors.textSubtle;
      default:
        return colors.text;
    }
  };

  const textColor = getTextColor();

  const Container = animated ? Animated.View : View;
  const animatedStyle = animated ? { opacity: fadeAnim } : {};

  return (
    <Container
      style={[
        styles.badge,
        {
          paddingVertical: currentSize.paddingVertical,
          paddingHorizontal: currentSize.paddingHorizontal,
          borderRadius: currentSize.borderRadius,
        },
        getVariantStyles(),
        animatedStyle,
        style,
      ]}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={currentSize.iconSize}
          color={textColor}
          style={styles.icon}
        />
      )}
      <Text
        variant="labelSmall"
        style={[{ color: textColor, fontSize: currentSize.fontSize }]}
      >
        {label}
      </Text>
      {onRemove && (
        <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
          <Ionicons name="close" size={currentSize.iconSize} color={textColor} />
        </TouchableOpacity>
      )}
    </Container>
  );
};

// Verified Badge (Special for lawyers)
export const VerifiedBadge: React.FC<{ size?: BadgeSize }> = ({ size = 'md' }) => {
  return (
    <Badge
      label="Verified"
      color="gold"
      variant="solid"
      size={size}
      icon="shield-checkmark"
    />
  );
};

// Case Status Badge
interface CaseStatusBadgeProps {
  status: string;
  size?: BadgeSize;
}

export const CaseStatusBadge: React.FC<CaseStatusBadgeProps> = ({
  status,
  size = 'md',
}) => {
  const theme = useAppTheme();

  const getStatusConfig = () => {
    const statusMap: Record<string, { label: string; color: BadgeColor; icon: keyof typeof Ionicons.glyphMap }> = {
      DRAFT: { label: 'Draft', color: 'secondary', icon: 'document-outline' },
      POSTED: { label: 'Posted', color: 'info', icon: 'paper-plane-outline' },
      BIDDING: { label: 'Bidding', color: 'gold', icon: 'pricetag-outline' },
      ASSIGNED: { label: 'Assigned', color: 'primary', icon: 'person-outline' },
      IN_PROGRESS: { label: 'In Progress', color: 'info', icon: 'hourglass-outline' },
      CASE_CLEAR_PENDING: { label: 'Pending Clear', color: 'warning', icon: 'time-outline' },
      COMPLETED: { label: 'Completed', color: 'success', icon: 'checkmark-circle-outline' },
      DISPUTED: { label: 'Disputed', color: 'error', icon: 'warning-outline' },
      CANCELLED: { label: 'Cancelled', color: 'secondary', icon: 'close-circle-outline' },
    };

    return statusMap[status] || { label: status, color: 'secondary' as BadgeColor, icon: 'help-outline' as keyof typeof Ionicons.glyphMap };
  };

  const config = getStatusConfig();

  return (
    <Badge
      label={config.label}
      color={config.color}
      variant="subtle"
      size={size}
      icon={config.icon}
    />
  );
};

// Notification Count Badge
interface NotificationBadgeProps {
  count: number;
  maxCount?: number;
  style?: ViewStyle;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  maxCount = 99,
  style,
}) => {
  const theme = useAppTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (count > 0) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [count, fadeAnim]);

  if (count <= 0) return null;

  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

  return (
    <Animated.View
      style={[
        styles.notificationBadge,
        {
          backgroundColor: theme.colors.status.error,
          minWidth: count > 9 ? 24 : 20,
          opacity: fadeAnim,
        },
        style,
      ]}
    >
      <Text
        variant="caption"
        style={[styles.notificationText, { color: '#FFFFFF' }]}
      >
        {displayCount}
      </Text>
    </Animated.View>
  );
};

// Chip (Selectable Badge)
interface ChipProps extends Omit<BadgeProps, 'onRemove'> {
  selected?: boolean;
  onPress?: () => void;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  onPress,
  icon,
  size = 'md',
  style,
}) => {
  const theme = useAppTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      damping: 15,
      stiffness: 400,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      damping: 15,
      stiffness: 400,
      useNativeDriver: true,
    }).start();
  };

  const sizeStyles = {
    sm: { paddingVertical: 6, paddingHorizontal: 12, iconSize: 14 },
    md: { paddingVertical: 8, paddingHorizontal: 16, iconSize: 16 },
    lg: { paddingVertical: 10, paddingHorizontal: 20, iconSize: 18 },
  };

  const currentSize = sizeStyles[size];

  return (
    <Animated.View
      style={[
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={[
          styles.chip,
          {
            paddingVertical: currentSize.paddingVertical,
            paddingHorizontal: currentSize.paddingHorizontal,
            backgroundColor: selected
              ? theme.colors.brand.primary
              : theme.colors.surface.secondary,
            borderRadius: theme.borderRadius.full,
            borderWidth: 1,
            borderColor: selected
              ? theme.colors.brand.primary
              : theme.colors.border.light,
          },
          style,
        ]}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={currentSize.iconSize}
            color={selected ? '#FFFFFF' : theme.colors.text.secondary}
            style={styles.chipIcon}
          />
        )}
        <Text
          variant="labelMedium"
          style={{
            color: selected ? '#FFFFFF' : theme.colors.text.primary,
          }}
        >
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
  removeButton: {
    marginLeft: 4,
    padding: 2,
  },
  notificationBadge: {
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  notificationText: {
    fontSize: 11,
    fontWeight: '600',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipIcon: {
    marginRight: 6,
  },
});

export default Badge;
