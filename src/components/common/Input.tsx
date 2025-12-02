/**
 * INSAF - Animated Input Component
 *
 * Professional text input with floating label animation
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { Text } from './Text';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string;
  hint?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  disabled?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  disabled = false,
  value,
  onFocus,
  onBlur,
  secureTextEntry,
  ...props
}) => {
  const theme = useAppTheme();
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(!secureTextEntry);

  // Animation values
  const focusAnim = useRef(new Animated.Value(0)).current;
  const labelAnim = useRef(new Animated.Value(value ? 1 : 0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Handle focus
  const handleFocus = useCallback(
    (e: any) => {
      setIsFocused(true);
      Animated.timing(focusAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
      Animated.timing(labelAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
      onFocus?.(e);
    },
    [onFocus, focusAnim, labelAnim]
  );

  // Handle blur
  const handleBlur = useCallback(
    (e: any) => {
      setIsFocused(false);
      Animated.timing(focusAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
      if (!value) {
        Animated.timing(labelAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }).start();
      }
      onBlur?.(e);
    },
    [onBlur, value, focusAnim, labelAnim]
  );

  // Update label animation when value changes
  useEffect(() => {
    if (value && labelAnim._value === 0) {
      Animated.timing(labelAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  }, [value, labelAnim]);

  // Shake animation for error
  useEffect(() => {
    if (error) {
      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: 1,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -1,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 1,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: 50,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [error, shakeAnim]);

  // Interpolate border color
  const borderColor = error
    ? theme.colors.status.error
    : focusAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [
          theme.colors.input.border,
          theme.colors.input.borderFocus,
        ],
      });

  // Interpolate translate X for shake
  const translateX = shakeAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [-10, 0, 10],
  });

  // Interpolate label position and scale
  const labelTranslateY = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -28],
  });

  const labelScale = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.85],
  });

  const labelColor = error
    ? theme.colors.status.error
    : focusAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [
          theme.colors.input.placeholder,
          theme.colors.input.borderFocus,
        ],
      });

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  // Determine actual secureTextEntry
  const actualSecureTextEntry = secureTextEntry && !isPasswordVisible;

  return (
    <View style={[styles.wrapper, containerStyle]}>
      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.input.background,
            borderRadius: theme.borderRadius.md,
            height: theme.inputHeight.md,
            borderWidth: 2,
            borderColor,
            transform: [{ translateX }],
          },
          disabled && { opacity: 0.5 },
        ]}
      >
        {/* Left Icon */}
        {leftIcon && (
          <View style={styles.leftIconContainer}>
            <Ionicons
              name={leftIcon}
              size={20}
              color={
                error
                  ? theme.colors.status.error
                  : isFocused
                  ? theme.colors.input.borderFocus
                  : theme.colors.input.placeholder
              }
            />
          </View>
        )}

        {/* Input Container */}
        <View style={styles.inputContainer}>
          {/* Floating Label */}
          <Animated.Text
            style={[
              styles.label,
              {
                left: leftIcon ? 44 : 16,
                backgroundColor: theme.colors.input.background,
                color: labelColor,
                transform: [
                  { translateY: labelTranslateY },
                  { scale: labelScale },
                ],
              },
            ]}
          >
            {label}
          </Animated.Text>

          {/* Text Input */}
          <TextInput
            ref={inputRef}
            style={[
              styles.input,
              {
                color: theme.colors.text.primary,
                paddingLeft: leftIcon ? 44 : 16,
                paddingRight: rightIcon || secureTextEntry ? 44 : 16,
              },
            ]}
            value={value}
            onFocus={handleFocus}
            onBlur={handleBlur}
            editable={!disabled}
            secureTextEntry={actualSecureTextEntry}
            placeholderTextColor={theme.colors.input.placeholder}
            {...props}
          />
        </View>

        {/* Right Icon / Password Toggle */}
        {(rightIcon || secureTextEntry) && (
          <TouchableOpacity
            style={styles.rightIconContainer}
            onPress={secureTextEntry ? togglePasswordVisibility : onRightIconPress}
          >
            <Ionicons
              name={
                secureTextEntry
                  ? isPasswordVisible
                    ? 'eye-off-outline'
                    : 'eye-outline'
                  : rightIcon!
              }
              size={20}
              color={theme.colors.input.placeholder}
            />
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Error or Hint */}
      {(error || hint) && (
        <Text
          variant="caption"
          color={error ? 'error' : 'secondary'}
          style={styles.helperText}
        >
          {error || hint}
        </Text>
      )}
    </View>
  );
};

// Search Input
interface SearchInputProps extends Omit<TextInputProps, 'style'> {
  onClear?: () => void;
  containerStyle?: ViewStyle;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onClear,
  containerStyle,
  ...props
}) => {
  const theme = useAppTheme();
  const focusAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    Animated.timing(focusAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    Animated.timing(focusAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.border.light, theme.colors.input.borderFocus],
  });

  return (
    <Animated.View
      style={[
        styles.searchContainer,
        {
          backgroundColor: theme.colors.surface.secondary,
          borderRadius: theme.borderRadius.full,
          borderWidth: 1,
          borderColor,
        },
        containerStyle,
      ]}
    >
      <Ionicons
        name="search-outline"
        size={20}
        color={theme.colors.text.tertiary}
        style={styles.searchIcon}
      />
      <TextInput
        style={[
          styles.searchInput,
          { color: theme.colors.text.primary },
        ]}
        value={value}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholderTextColor={theme.colors.input.placeholder}
        {...props}
      />
      {value && value.length > 0 && (
        <TouchableOpacity onPress={onClear} style={styles.clearButton}>
          <Ionicons
            name="close-circle"
            size={18}
            color={theme.colors.text.tertiary}
          />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    position: 'absolute',
    top: 14,
    fontSize: 16,
    paddingHorizontal: 4,
    zIndex: 1,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  leftIconContainer: {
    position: 'absolute',
    left: 12,
    zIndex: 2,
  },
  rightIconContainer: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  helperText: {
    marginTop: 4,
    marginLeft: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  clearButton: {
    padding: 4,
  },
});

export default Input;
