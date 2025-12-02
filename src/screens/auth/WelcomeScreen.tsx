/**
 * INSAF - Welcome Screen
 *
 * Beautiful animated welcome screen with app introduction
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Image,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { Text } from '../../components/common/Text';
import { Button } from '../../components/common/Button';
import { AuthStackParamList } from '../../navigation/types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type WelcomeScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;

export const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<WelcomeScreenNavigationProp>();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  // Animation values
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoRotate = useRef(new Animated.Value(-10)).current;
  const circleScale1 = useRef(new Animated.Value(0)).current;
  const circleScale2 = useRef(new Animated.Value(0)).current;
  const circleScale3 = useRef(new Animated.Value(0)).current;
  const appNameOpacity = useRef(new Animated.Value(0)).current;
  const appNameTranslateY = useRef(new Animated.Value(20)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineTranslateY = useRef(new Animated.Value(20)).current;
  const featuresOpacity = useRef(new Animated.Value(0)).current;
  const featuresTranslateY = useRef(new Animated.Value(20)).current;
  const descriptionOpacity = useRef(new Animated.Value(0)).current;
  const descriptionTranslateY = useRef(new Animated.Value(20)).current;
  const bottomOpacity = useRef(new Animated.Value(0)).current;
  const bottomTranslateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Logo animation
    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          damping: 12,
          stiffness: 100,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(logoRotate, {
            toValue: -10,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.spring(logoRotate, {
            toValue: 0,
            damping: 8,
            stiffness: 200,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();

    // Circle animations
    Animated.spring(circleScale1, {
      toValue: 1,
      damping: 15,
      useNativeDriver: true,
    }).start();

    Animated.sequence([
      Animated.delay(200),
      Animated.spring(circleScale2, {
        toValue: 1,
        damping: 15,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.sequence([
      Animated.delay(400),
      Animated.spring(circleScale3, {
        toValue: 1,
        damping: 15,
        useNativeDriver: true,
      }),
    ]).start();

    // App name animation
    Animated.sequence([
      Animated.delay(600),
      Animated.parallel([
        Animated.timing(appNameOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(appNameTranslateY, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Tagline animation
    Animated.sequence([
      Animated.delay(800),
      Animated.parallel([
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(taglineTranslateY, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Features animation
    Animated.sequence([
      Animated.delay(1000),
      Animated.parallel([
        Animated.timing(featuresOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(featuresTranslateY, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Description animation
    Animated.sequence([
      Animated.delay(1400),
      Animated.parallel([
        Animated.timing(descriptionOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(descriptionTranslateY, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Bottom section animation
    Animated.sequence([
      Animated.delay(1600),
      Animated.parallel([
        Animated.timing(bottomOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(bottomTranslateY, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  // Features data
  const features = [
    { icon: 'shield-checkmark', text: 'Verified Lawyers' },
    { icon: 'lock-closed', text: 'Secure Payments' },
    { icon: 'sparkles', text: 'AI-Powered' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      {/* Background Gradient */}
      <LinearGradient
        colors={
          theme.isDark
            ? ['transparent', theme.colors.background.secondary]
            : ['transparent', theme.colors.background.tertiary]
        }
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Animated Background Circles */}
      <Animated.View
        style={[
          styles.backgroundCircle,
          styles.circle1,
          { backgroundColor: theme.colors.brand.primary },
          {
            transform: [{ scale: circleScale1 }],
            opacity: circleScale1.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.1],
            }),
          },
        ]}
      />
      <Animated.View
        style={[
          styles.backgroundCircle,
          styles.circle2,
          { backgroundColor: theme.colors.brand.secondary },
          {
            transform: [{ scale: circleScale2 }],
            opacity: circleScale2.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.08],
            }),
          },
        ]}
      />
      <Animated.View
        style={[
          styles.backgroundCircle,
          styles.circle3,
          { backgroundColor: theme.colors.brand.accent },
          {
            transform: [{ scale: circleScale3 }],
            opacity: circleScale3.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.05],
            }),
          },
        ]}
      />

      {/* Content */}
      <View style={[styles.content, { paddingTop: insets.top + 40 }]}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <Animated.View
            style={[
              styles.logoContainer,
              {
                transform: [
                  { scale: logoScale },
                  {
                    rotate: logoRotate.interpolate({
                      inputRange: [-10, 0],
                      outputRange: ['-10deg', '0deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={theme.colors.gradient.premium as [string, string]}
              style={styles.logoBackground}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="scale" size={48} color="#FFFFFF" />
            </LinearGradient>
          </Animated.View>

          <Animated.View
            style={{
              opacity: appNameOpacity,
              transform: [{ translateY: appNameTranslateY }],
            }}
          >
            <Text variant="displaySmall" align="center" style={styles.appName}>
              INSAF
            </Text>
          </Animated.View>

          <Animated.View
            style={{
              opacity: taglineOpacity,
              transform: [{ translateY: taglineTranslateY }],
            }}
          >
            <Text variant="bodyLarge" color="secondary" align="center" style={styles.tagline}>
              Justice Made Accessible
            </Text>
          </Animated.View>
        </View>

        {/* Features Section */}
        <Animated.View
          style={[
            styles.featuresSection,
            {
              opacity: featuresOpacity,
              transform: [{ translateY: featuresTranslateY }],
            },
          ]}
        >
          <View style={styles.featuresRow}>
            {features.map((feature, index) => (
              <View
                key={feature.text}
                style={[
                  styles.featureItem,
                  { backgroundColor: theme.colors.surface.secondary },
                ]}
              >
                <View
                  style={[
                    styles.featureIcon,
                    { backgroundColor: `${theme.colors.brand.primary}15` },
                  ]}
                >
                  <Ionicons
                    name={feature.icon as any}
                    size={20}
                    color={theme.colors.brand.primary}
                  />
                </View>
                <Text variant="labelSmall" color="secondary" style={styles.featureText}>
                  {feature.text}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Description */}
        <Animated.View
          style={[
            styles.descriptionSection,
            {
              opacity: descriptionOpacity,
              transform: [{ translateY: descriptionTranslateY }],
            },
          ]}
        >
          <Text variant="bodyMedium" color="secondary" align="center">
            Connect with verified lawyers, manage your legal cases, and get AI-powered
            assistance - all in one secure platform.
          </Text>
        </Animated.View>
      </View>

      {/* Bottom Section */}
      <Animated.View
        style={[
          styles.bottomSection,
          { paddingBottom: insets.bottom + 24 },
          {
            opacity: bottomOpacity,
            transform: [{ translateY: bottomTranslateY }],
          },
        ]}
      >
        <Button
          title="Get Started"
          variant="gradient"
          size="lg"
          fullWidth
          icon="arrow-forward"
          iconPosition="right"
          onPress={() => navigation.navigate('Register')}
        />

        <View style={styles.loginRow}>
          <Text variant="bodyMedium" color="secondary">
            Already have an account?
          </Text>
          <Button
            title="Login"
            variant="ghost"
            size="md"
            onPress={() => navigation.navigate('Login')}
          />
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: SCREEN_HEIGHT * 0.5,
  },
  backgroundCircle: {
    position: 'absolute',
    borderRadius: 1000,
  },
  circle1: {
    width: SCREEN_WIDTH * 1.5,
    height: SCREEN_WIDTH * 1.5,
    top: -SCREEN_WIDTH * 0.5,
    right: -SCREEN_WIDTH * 0.5,
  },
  circle2: {
    width: SCREEN_WIDTH * 1.2,
    height: SCREEN_WIDTH * 1.2,
    top: SCREEN_HEIGHT * 0.3,
    left: -SCREEN_WIDTH * 0.6,
  },
  circle3: {
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_WIDTH * 0.8,
    bottom: SCREEN_HEIGHT * 0.1,
    right: -SCREEN_WIDTH * 0.3,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 40,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoBackground: {
    width: 100,
    height: 100,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  appName: {
    fontWeight: '800',
    letterSpacing: 4,
  },
  tagline: {
    marginTop: 8,
    letterSpacing: 1,
  },
  featuresSection: {
    marginTop: 48,
  },
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  featureItem: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    minWidth: 100,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  featureText: {
    textAlign: 'center',
  },
  descriptionSection: {
    marginTop: 40,
    paddingHorizontal: 16,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  loginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
});

export default WelcomeScreen;
