/**
 * INSAF - Login Screen
 *
 * Beautiful animated login screen
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { Text } from '../../components/common/Text';
import { Button, IconButton } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { AuthStackParamList } from '../../navigation/types';
import { loginUser } from '../../services/auth.service';
import { validateEmail } from '../../utils/validations';

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // Animation values
  const backButtonOpacity = useRef(new Animated.Value(0)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const iconTranslateY = useRef(new Animated.Value(20)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(20)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleTranslateY = useRef(new Animated.Value(20)).current;
  const emailOpacity = useRef(new Animated.Value(0)).current;
  const emailTranslateY = useRef(new Animated.Value(20)).current;
  const passwordOpacity = useRef(new Animated.Value(0)).current;
  const passwordTranslateY = useRef(new Animated.Value(20)).current;
  const forgotOpacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonTranslateY = useRef(new Animated.Value(20)).current;
  const dividerOpacity = useRef(new Animated.Value(0)).current;
  const socialOpacity = useRef(new Animated.Value(0)).current;
  const socialTranslateY = useRef(new Animated.Value(20)).current;
  const registerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate elements in sequence
    Animated.sequence([
      Animated.delay(200),
      Animated.timing(backButtonOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.timing(iconOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(iconTranslateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    Animated.sequence([
      Animated.delay(400),
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    Animated.sequence([
      Animated.delay(500),
      Animated.parallel([
        Animated.timing(subtitleOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(subtitleTranslateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    Animated.sequence([
      Animated.delay(600),
      Animated.parallel([
        Animated.timing(emailOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(emailTranslateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    Animated.sequence([
      Animated.delay(700),
      Animated.parallel([
        Animated.timing(passwordOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(passwordTranslateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    Animated.sequence([
      Animated.delay(800),
      Animated.timing(forgotOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.sequence([
      Animated.delay(900),
      Animated.parallel([
        Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(buttonTranslateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    Animated.sequence([
      Animated.delay(1000),
      Animated.timing(dividerOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.sequence([
      Animated.delay(1100),
      Animated.parallel([
        Animated.timing(socialOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(socialTranslateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    Animated.sequence([
      Animated.delay(1200),
      Animated.timing(registerOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Validation
  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    // Strict email validation
    const emailError = validateEmail(email.trim());
    if (emailError) {
      newErrors.email = emailError;
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle login
  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await loginUser(email, password);
      // Navigation will be handled by auth state listener
    } catch (error: any) {
      let errorMessage = 'Login failed. Please try again.';

      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      }

      Alert.alert('Login Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      {/* Header Background */}
      <LinearGradient
        colors={theme.colors.gradient.primary as [string, string]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Back Button */}
        <Animated.View
          style={[
            styles.backButton,
            { top: insets.top + 8, opacity: backButtonOpacity },
          ]}
        >
          <IconButton
            icon="arrow-back"
            variant="ghost"
            size="md"
            onPress={() => navigation.goBack()}
            style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
          />
        </Animated.View>

        {/* Header Content */}
        <View style={[styles.headerContent, { paddingTop: insets.top + 60 }]}>
          <Animated.View
            style={{
              opacity: iconOpacity,
              transform: [{ translateY: iconTranslateY }],
            }}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="log-in-outline" size={32} color="#FFFFFF" />
            </View>
          </Animated.View>

          <Animated.View
            style={{
              opacity: titleOpacity,
              transform: [{ translateY: titleTranslateY }],
            }}
          >
            <Text variant="h1" style={styles.headerTitle}>
              Welcome Back
            </Text>
          </Animated.View>

          <Animated.View
            style={{
              opacity: subtitleOpacity,
              transform: [{ translateY: subtitleTranslateY }],
            }}
          >
            <Text variant="bodyMedium" style={styles.headerSubtitle}>
              Sign in to continue to INSAF
            </Text>
          </Animated.View>
        </View>

        {/* Curved Bottom */}
        <View style={[styles.curvedBottom, { backgroundColor: theme.colors.background.primary }]} />
      </LinearGradient>

      {/* Form Section */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.formContainer}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={{
              opacity: emailOpacity,
              transform: [{ translateY: emailTranslateY }],
            }}
          >
            <Input
              label="Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) setErrors({ ...errors, email: undefined });
              }}
              error={errors.email}
              leftIcon="mail-outline"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </Animated.View>

          <Animated.View
            style={{
              opacity: passwordOpacity,
              transform: [{ translateY: passwordTranslateY }],
            }}
          >
            <Input
              label="Password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) setErrors({ ...errors, password: undefined });
              }}
              error={errors.password}
              leftIcon="lock-closed-outline"
              secureTextEntry
              autoCapitalize="none"
            />
          </Animated.View>

          <Animated.View style={{ opacity: forgotOpacity }}>
            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword')}
              style={styles.forgotPassword}
            >
              <Text variant="labelMedium" color="link">
                Forgot Password?
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View
            style={[
              styles.buttonContainer,
              {
                opacity: buttonOpacity,
                transform: [{ translateY: buttonTranslateY }],
              },
            ]}
          >
            <Button
              title="Sign In"
              variant="gradient"
              size="lg"
              fullWidth
              loading={isLoading}
              onPress={handleLogin}
            />
          </Animated.View>

          {/* Divider */}
          <Animated.View
            style={[styles.dividerContainer, { opacity: dividerOpacity }]}
          >
            <View style={[styles.divider, { backgroundColor: theme.colors.border.light }]} />
            <Text variant="caption" color="tertiary" style={styles.dividerText}>
              or continue with
            </Text>
            <View style={[styles.divider, { backgroundColor: theme.colors.border.light }]} />
          </Animated.View>

          {/* Social Login */}
          <Animated.View
            style={[
              styles.socialContainer,
              {
                opacity: socialOpacity,
                transform: [{ translateY: socialTranslateY }],
              },
            ]}
          >
            <TouchableOpacity
              style={[styles.socialButton, { backgroundColor: theme.colors.surface.secondary }]}
              onPress={() => Alert.alert('Coming Soon', 'Google sign-in will be available soon.')}
            >
              <Ionicons name="logo-google" size={22} color={theme.colors.text.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.socialButton, { backgroundColor: theme.colors.surface.secondary }]}
              onPress={() => Alert.alert('Coming Soon', 'Apple sign-in will be available soon.')}
            >
              <Ionicons name="logo-apple" size={22} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </Animated.View>

          {/* Register Link */}
          <Animated.View
            style={[styles.registerContainer, { opacity: registerOpacity }]}
          >
            <Text variant="bodyMedium" color="secondary">
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text variant="labelLarge" color="link">
                Sign Up
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    height: 280,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  curvedBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  formContainer: {
    flex: 1,
    marginTop: -20,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -8,
    marginBottom: 24,
  },
  buttonContainer: {
    marginTop: 8,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
});

export default LoginScreen;
