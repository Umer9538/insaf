/**
 * INSAF - Custom Tab Bar
 *
 * Animated bottom tab bar with beautiful design
 */

import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, Animated } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../context/ThemeContext';
import { Text } from '../components/common/Text';

// Tab icon mapping
const TAB_ICONS: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  HomeTab: { active: 'home', inactive: 'home-outline' },
  CasesTab: { active: 'briefcase', inactive: 'briefcase-outline' },
  MessagesTab: { active: 'chatbubbles', inactive: 'chatbubbles-outline' },
  ProfileTab: { active: 'person', inactive: 'person-outline' },
};

// Tab labels
const TAB_LABELS: Record<string, string> = {
  HomeTab: 'Home',
  CasesTab: 'Cases',
  MessagesTab: 'Messages',
  ProfileTab: 'Profile',
};

// Tab Item Component
interface TabItemProps {
  route: any;
  index: number;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
}

const TabItem: React.FC<TabItemProps> = ({
  route,
  index,
  isFocused,
  onPress,
  onLongPress,
}) => {
  const theme = useAppTheme();
  const scale = React.useRef(new Animated.Value(1)).current;
  const progress = React.useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.spring(progress, {
      toValue: isFocused ? 1 : 0,
      damping: 15,
      stiffness: 200,
      mass: 1,
      useNativeDriver: true,
    }).start();
  }, [isFocused, progress]);

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.9,
      damping: 15,
      stiffness: 400,
      mass: 1,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      damping: 15,
      stiffness: 400,
      mass: 1,
      useNativeDriver: true,
    }).start();
  };

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -2],
  });

  const labelOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 1],
  });

  const labelScale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1],
  });

  const indicatorScaleX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const icons = TAB_ICONS[route.name] || { active: 'help', inactive: 'help-outline' };
  const label = TAB_LABELS[route.name] || route.name;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.tabItem}
    >
      <Animated.View style={[
        styles.iconContainer,
        {
          transform: [
            { scale: scale },
            { translateY: translateY },
          ],
        },
      ]}>
        <Ionicons
          name={isFocused ? icons.active : icons.inactive}
          size={24}
          color={
            isFocused
              ? theme.colors.tabBar.active
              : theme.colors.tabBar.inactive
          }
        />
      </Animated.View>

      <Animated.View style={{
        opacity: labelOpacity,
        transform: [{ scale: labelScale }],
      }}>
        <Text
          variant="labelSmall"
          style={{
            color: isFocused
              ? theme.colors.tabBar.active
              : theme.colors.tabBar.inactive,
            marginTop: 2,
          }}
        >
          {label}
        </Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.indicator,
          { backgroundColor: theme.colors.tabBar.active },
          {
            opacity: progress,
            transform: [{ scaleX: indicatorScaleX }],
          },
        ]}
      />
    </TouchableOpacity>
  );
};

// Custom Tab Bar Component
export const CustomTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.tabBar.background,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          borderTopColor: theme.colors.border.light,
          ...theme.shadows.lg,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <TabItem
            key={route.key}
            route={route}
            index={index}
            isFocused={isFocused}
            onPress={onPress}
            onLongPress={onLongPress}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 28,
  },
  indicator: {
    position: 'absolute',
    top: 0,
    width: 24,
    height: 3,
    borderRadius: 1.5,
  },
});

export default CustomTabBar;
