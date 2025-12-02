/**
 * INSAF - Avatar Component
 *
 * User avatar with verification badge support
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ViewStyle, Image, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { Text } from './Text';

type AvatarSize = 'xs' | 'sm' | 'md' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';

interface AvatarProps {
  source?: string | null;
  name?: string;
  size?: AvatarSize;
  verified?: boolean;
  online?: boolean;
  style?: ViewStyle;
}

export const Avatar: React.FC<AvatarProps> = ({
  source,
  name,
  size = 'base',
  verified = false,
  online,
  style,
}) => {
  const theme = useAppTheme();
  const avatarSize = theme.avatarSize[size];
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const badgeFadeAnim = useRef(new Animated.Value(0)).current;

  // Animate avatar on mount
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Animate badge on mount with delay
  useEffect(() => {
    if (verified) {
      Animated.timing(badgeFadeAnim, {
        toValue: 1,
        duration: 300,
        delay: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [verified, badgeFadeAnim]);

  // Get initials from name
  const getInitials = (): string => {
    if (!name) return '?';
    const parts = name.split(' ').filter(Boolean);
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  // Get font size based on avatar size
  const getFontSize = (): number => {
    const fontSizeMap: Record<AvatarSize, number> = {
      xs: 10,
      sm: 12,
      md: 14,
      base: 16,
      lg: 20,
      xl: 24,
      '2xl': 28,
      '3xl': 32,
    };
    return fontSizeMap[size];
  };

  // Badge size based on avatar size
  const getBadgeSize = (): number => {
    if (avatarSize <= 32) return 12;
    if (avatarSize <= 48) return 16;
    if (avatarSize <= 64) return 20;
    return 24;
  };

  const badgeSize = getBadgeSize();

  return (
    <View style={[styles.container, { width: avatarSize, height: avatarSize }, style]}>
      {source ? (
        <Animated.Image
          source={{ uri: source }}
          style={[
            styles.image,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
              opacity: fadeAnim,
            },
          ]}
        />
      ) : (
        <LinearGradient
          colors={theme.colors.gradient.primary as [string, string]}
          style={[
            styles.placeholder,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
            },
          ]}
        >
          <Text
            variant="h3"
            style={[styles.initials, { fontSize: getFontSize(), color: '#FFFFFF' }]}
          >
            {getInitials()}
          </Text>
        </LinearGradient>
      )}

      {/* Verified Badge */}
      {verified && (
        <Animated.View
          style={[
            styles.verifiedBadge,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
              backgroundColor: theme.colors.verified.background,
              borderColor: theme.colors.background.primary,
              opacity: badgeFadeAnim,
            },
          ]}
        >
          <Ionicons
            name="checkmark"
            size={badgeSize * 0.6}
            color={theme.colors.verified.text}
          />
        </Animated.View>
      )}

      {/* Online Status */}
      {online !== undefined && (
        <View
          style={[
            styles.onlineIndicator,
            {
              width: badgeSize * 0.7,
              height: badgeSize * 0.7,
              borderRadius: badgeSize * 0.35,
              backgroundColor: online
                ? theme.colors.status.success
                : theme.colors.text.disabled,
              borderColor: theme.colors.background.primary,
            },
          ]}
        />
      )}
    </View>
  );
};

// Avatar Group
interface AvatarGroupProps {
  avatars: Array<{ source?: string; name?: string }>;
  max?: number;
  size?: AvatarSize;
  style?: ViewStyle;
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  avatars,
  max = 4,
  size = 'md',
  style,
}) => {
  const theme = useAppTheme();
  const avatarSize = theme.avatarSize[size];
  const displayAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;
  const overlap = avatarSize * 0.3;

  return (
    <View style={[styles.groupContainer, style]}>
      {displayAvatars.map((avatar, index) => (
        <View
          key={index}
          style={[
            styles.groupAvatar,
            {
              marginLeft: index === 0 ? 0 : -overlap,
              zIndex: displayAvatars.length - index,
              borderWidth: 2,
              borderColor: theme.colors.background.primary,
              borderRadius: avatarSize / 2,
            },
          ]}
        >
          <Avatar source={avatar.source} name={avatar.name} size={size} />
        </View>
      ))}
      {remainingCount > 0 && (
        <View
          style={[
            styles.remainingCount,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
              marginLeft: -overlap,
              backgroundColor: theme.colors.surface.tertiary,
              borderWidth: 2,
              borderColor: theme.colors.background.primary,
            },
          ]}
        >
          <Text variant="labelSmall" color="secondary">
            +{remainingCount}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    resizeMode: 'cover',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: '600',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    borderWidth: 2,
  },
  groupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupAvatar: {
    overflow: 'hidden',
  },
  remainingCount: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Avatar;
