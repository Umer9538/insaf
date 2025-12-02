/**
 * INSAF - Loading & Skeleton Components
 *
 * Loading states without reanimated (for Expo Go compatibility)
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ViewStyle, Dimensions, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../../context/ThemeContext';
import { Text } from './Text';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Spinner Loading
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', color }) => {
  const theme = useAppTheme();
  const rotation = useRef(new Animated.Value(0)).current;

  const sizeMap = {
    sm: 20,
    md: 32,
    lg: 48,
  };

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const spinnerColor = color || theme.colors.brand.primary;
  const spinnerSize = sizeMap[size];

  const rotateInterpolate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        {
          width: spinnerSize,
          height: spinnerSize,
          borderRadius: spinnerSize / 2,
          borderWidth: 3,
          borderColor: theme.colors.border.light,
          borderTopColor: spinnerColor,
          transform: [{ rotate: rotateInterpolate }],
        },
      ]}
    />
  );
};

// Dots Loading
interface DotsLoadingProps {
  color?: string;
}

export const DotsLoading: React.FC<DotsLoadingProps> = ({ color }) => {
  const theme = useAppTheme();
  const dotColor = color || theme.colors.brand.primary;

  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createDotAnimation = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const anim1 = createDotAnimation(dot1, 0);
    const anim2 = createDotAnimation(dot2, 150);
    const anim3 = createDotAnimation(dot3, 300);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, []);

  const createDotStyle = (dot: Animated.Value) => ({
    transform: [
      {
        scale: dot.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.3],
        }),
      },
    ],
    opacity: dot.interpolate({
      inputRange: [0, 1],
      outputRange: [0.5, 1],
    }),
  });

  return (
    <View style={styles.dotsContainer}>
      <Animated.View
        style={[styles.dot, { backgroundColor: dotColor }, createDotStyle(dot1)]}
      />
      <Animated.View
        style={[styles.dot, { backgroundColor: dotColor }, createDotStyle(dot2)]}
      />
      <Animated.View
        style={[styles.dot, { backgroundColor: dotColor }, createDotStyle(dot3)]}
      />
    </View>
  );
};

// Full Screen Loading
interface FullScreenLoadingProps {
  message?: string;
}

export const FullScreenLoading: React.FC<FullScreenLoadingProps> = ({
  message = 'Loading...',
}) => {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.fullScreenContainer,
        { backgroundColor: theme.colors.background.primary },
      ]}
    >
      <Spinner size="lg" />
      <Text variant="bodyMedium" color="secondary" style={styles.loadingText}>
        {message}
      </Text>
    </View>
  );
};

// Skeleton Component
interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const theme = useAppTheme();
  const shimmerPosition = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shimmerPosition, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const translateX = shimmerPosition.interpolate({
    inputRange: [-1, 1],
    outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
  });

  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.isDark
            ? theme.colors.surface.secondary
            : '#E5E7EB',
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View style={[styles.shimmer, { transform: [{ translateX }] }]}>
        <LinearGradient
          colors={
            theme.isDark
              ? ['transparent', 'rgba(255,255,255,0.05)', 'transparent']
              : ['transparent', 'rgba(255,255,255,0.5)', 'transparent']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.shimmerGradient}
        />
      </Animated.View>
    </View>
  );
};

// Skeleton Card
export const SkeletonCard: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.skeletonCard,
        {
          backgroundColor: theme.colors.card.background,
          borderRadius: theme.borderRadius.lg,
        },
        theme.shadows.sm,
        style,
      ]}
    >
      <View style={styles.skeletonCardHeader}>
        <Skeleton width={48} height={48} borderRadius={24} />
        <View style={styles.skeletonCardHeaderText}>
          <Skeleton width={120} height={16} />
          <Skeleton width={80} height={12} style={{ marginTop: 8 }} />
        </View>
      </View>
      <Skeleton width="100%" height={14} style={{ marginTop: 16 }} />
      <Skeleton width="80%" height={14} style={{ marginTop: 8 }} />
      <Skeleton width="60%" height={14} style={{ marginTop: 8 }} />
    </View>
  );
};

// Skeleton List
interface SkeletonListProps {
  count?: number;
  style?: ViewStyle;
}

export const SkeletonList: React.FC<SkeletonListProps> = ({
  count = 3,
  style,
}) => {
  return (
    <View style={style}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} style={{ marginBottom: 16 }} />
      ))}
    </View>
  );
};

// Pulse Animation Wrapper
interface PulseProps {
  children: React.ReactNode;
  isLoading?: boolean;
}

export const Pulse: React.FC<PulseProps> = ({ children, isLoading = true }) => {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let animation: Animated.CompositeAnimation;

    if (isLoading) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.5,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
    } else {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }

    return () => animation?.stop();
  }, [isLoading]);

  return <Animated.View style={{ opacity }}>{children}</Animated.View>;
};

const styles = StyleSheet.create({
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  fullScreenContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
  },
  shimmerGradient: {
    flex: 1,
    width: SCREEN_WIDTH,
  },
  skeletonCard: {
    padding: 16,
  },
  skeletonCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skeletonCardHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
});

export default Spinner;
