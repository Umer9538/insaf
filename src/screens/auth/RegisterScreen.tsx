/**
 * INSAF - Register Screen
 *
 * Beautiful animated registration screen with role selection
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
import { Card } from '../../components/common/Card';
import { AuthStackParamList } from '../../navigation/types';
import { registerUser, UserRole } from '../../services/auth.service';
import { validateEmail } from '../../utils/validations';

type RegisterScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

// Role options
const ROLES: { id: UserRole; title: string; description: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  {
    id: 'CLIENT',
    title: 'Client',
    description: 'Find lawyers and manage your legal cases',
    icon: 'person-outline',
  },
  {
    id: 'LAWYER',
    title: 'Lawyer',
    description: 'Offer legal services and grow your practice',
    icon: 'briefcase-outline',
  },
  {
    id: 'CORPORATE',
    title: 'Corporate',
    description: 'Manage legal matters for your organization',
    icon: 'business-outline',
  },
];

export const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  // Form state
  const [step, setStep] = useState<1 | 2>(1);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Animation values
  const backButtonOpacity = useRef(new Animated.Value(0)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const iconTranslateY = useRef(new Animated.Value(20)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(20)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleTranslateY = useRef(new Animated.Value(20)).current;
  const stepIndicatorOpacity = useRef(new Animated.Value(0)).current;

  // Form field animations
  const field1Opacity = useRef(new Animated.Value(0)).current;
  const field1TranslateY = useRef(new Animated.Value(20)).current;
  const field2Opacity = useRef(new Animated.Value(0)).current;
  const field2TranslateY = useRef(new Animated.Value(20)).current;
  const field3Opacity = useRef(new Animated.Value(0)).current;
  const field3TranslateY = useRef(new Animated.Value(20)).current;
  const field4Opacity = useRef(new Animated.Value(0)).current;
  const field4TranslateY = useRef(new Animated.Value(20)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonTranslateY = useRef(new Animated.Value(20)).current;
  const loginOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Reset and trigger animations when component mounts or step changes
    backButtonOpacity.setValue(0);
    iconOpacity.setValue(0);
    iconTranslateY.setValue(20);
    titleOpacity.setValue(0);
    titleTranslateY.setValue(20);
    subtitleOpacity.setValue(0);
    subtitleTranslateY.setValue(20);
    stepIndicatorOpacity.setValue(0);
    field1Opacity.setValue(0);
    field1TranslateY.setValue(20);
    field2Opacity.setValue(0);
    field2TranslateY.setValue(20);
    field3Opacity.setValue(0);
    field3TranslateY.setValue(20);
    field4Opacity.setValue(0);
    field4TranslateY.setValue(20);
    buttonOpacity.setValue(0);
    buttonTranslateY.setValue(20);
    loginOpacity.setValue(0);

    // Animate header elements
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
      Animated.timing(stepIndicatorOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Animate form fields
    Animated.sequence([
      Animated.delay(600),
      Animated.parallel([
        Animated.timing(field1Opacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(field1TranslateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    Animated.sequence([
      Animated.delay(700),
      Animated.parallel([
        Animated.timing(field2Opacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(field2TranslateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    Animated.sequence([
      Animated.delay(800),
      Animated.parallel([
        Animated.timing(field3Opacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(field3TranslateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    Animated.sequence([
      Animated.delay(900),
      Animated.parallel([
        Animated.timing(field4Opacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(field4TranslateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    Animated.sequence([
      Animated.delay(1000),
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
      Animated.delay(1100),
      Animated.timing(loginOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [step]);

  // Validation
  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (fullName.trim().length < 3) {
      newErrors.fullName = 'Name must be at least 3 characters';
    }

    // Strict email validation
    const emailError = validateEmail(email.trim());
    if (emailError) {
      newErrors.email = emailError;
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    if (!selectedRole) {
      Alert.alert('Select Role', 'Please select how you want to use INSAF.');
      return false;
    }
    return true;
  };

  // Handle next step
  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  // Handle registration
  const handleRegister = async () => {
    if (!validateStep2()) return;

    setIsLoading(true);
    try {
      await registerUser(email, password, fullName, selectedRole!);
      Alert.alert(
        'Success!',
        'Your account has been created. Please check your email to verify your account.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      let errorMessage = 'Registration failed. Please try again.';

      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak.';
      }

      Alert.alert('Registration Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Role Card Component
  const RoleCard: React.FC<{
    role: typeof ROLES[0];
    selected: boolean;
    onSelect: () => void;
    index: number;
  }> = ({ role, selected, onSelect, index }) => {
    const scale = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
      Animated.spring(scale, {
        toValue: 0.97,
        damping: 15,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scale, {
        toValue: 1,
        damping: 15,
        useNativeDriver: true,
      }).start();
    };

    return (
      <Animated.View
        style={{
          transform: [{ scale }],
          opacity: field1Opacity,
          marginBottom: 12,
        }}
      >
        <TouchableOpacity
          onPress={onSelect}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
        >
          <View
            style={[
              styles.roleCard,
              {
                backgroundColor: selected
                  ? `${theme.colors.brand.primary}10`
                  : theme.colors.surface.secondary,
                borderColor: selected
                  ? theme.colors.brand.primary
                  : theme.colors.border.light,
                borderWidth: selected ? 2 : 1,
              },
            ]}
          >
            <View
              style={[
                styles.roleIconContainer,
                {
                  backgroundColor: selected
                    ? theme.colors.brand.primary
                    : theme.colors.surface.tertiary,
                },
              ]}
            >
              <Ionicons
                name={role.icon}
                size={24}
                color={selected ? '#FFFFFF' : theme.colors.text.secondary}
              />
            </View>
            <View style={styles.roleContent}>
              <Text variant="h4" color={selected ? 'brand' : 'primary'}>
                {role.title}
              </Text>
              <Text variant="bodySmall" color="secondary" style={styles.roleDescription}>
                {role.description}
              </Text>
            </View>
            <View
              style={[
                styles.roleCheck,
                {
                  backgroundColor: selected
                    ? theme.colors.brand.primary
                    : 'transparent',
                  borderColor: selected
                    ? theme.colors.brand.primary
                    : theme.colors.border.medium,
                },
              ]}
            >
              {selected && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      {/* Header */}
      <LinearGradient
        colors={theme.colors.gradient.primary as [string, string]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
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
            onPress={() => (step === 2 ? setStep(1) : navigation.goBack())}
            style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
          />
        </Animated.View>

        <View style={[styles.headerContent, { paddingTop: insets.top + 60 }]}>
          <Animated.View
            style={{
              opacity: iconOpacity,
              transform: [{ translateY: iconTranslateY }],
            }}
          >
            <View style={styles.iconContainer}>
              <Ionicons
                name={step === 1 ? 'person-add-outline' : 'shield-checkmark-outline'}
                size={32}
                color="#FFFFFF"
              />
            </View>
          </Animated.View>

          <Animated.View
            style={{
              opacity: titleOpacity,
              transform: [{ translateY: titleTranslateY }],
            }}
          >
            <Text variant="h1" style={styles.headerTitle}>
              {step === 1 ? 'Create Account' : 'Choose Your Role'}
            </Text>
          </Animated.View>

          <Animated.View
            style={{
              opacity: subtitleOpacity,
              transform: [{ translateY: subtitleTranslateY }],
            }}
          >
            <Text variant="bodyMedium" style={styles.headerSubtitle}>
              {step === 1
                ? 'Join INSAF and access legal services'
                : 'How will you use INSAF?'}
            </Text>
          </Animated.View>

          {/* Step Indicator */}
          <Animated.View
            style={[styles.stepIndicator, { opacity: stepIndicatorOpacity }]}
          >
            <View
              style={[
                styles.stepDot,
                { backgroundColor: '#FFFFFF' },
              ]}
            />
            <View
              style={[
                styles.stepLine,
                { backgroundColor: step === 2 ? '#FFFFFF' : 'rgba(255,255,255,0.3)' },
              ]}
            />
            <View
              style={[
                styles.stepDot,
                { backgroundColor: step === 2 ? '#FFFFFF' : 'rgba(255,255,255,0.3)' },
              ]}
            />
          </Animated.View>
        </View>

        <View style={[styles.curvedBottom, { backgroundColor: theme.colors.background.primary }]} />
      </LinearGradient>

      {/* Form */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.formContainer}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {step === 1 ? (
            <>
              <Animated.View
                style={{
                  opacity: field1Opacity,
                  transform: [{ translateY: field1TranslateY }],
                }}
              >
                <Input
                  label="Full Name"
                  value={fullName}
                  onChangeText={(text) => {
                    setFullName(text);
                    if (errors.fullName) setErrors({ ...errors, fullName: '' });
                  }}
                  error={errors.fullName}
                  leftIcon="person-outline"
                  autoCapitalize="words"
                />
              </Animated.View>

              <Animated.View
                style={{
                  opacity: field2Opacity,
                  transform: [{ translateY: field2TranslateY }],
                }}
              >
                <Input
                  label="Email"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) setErrors({ ...errors, email: '' });
                  }}
                  error={errors.email}
                  leftIcon="mail-outline"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </Animated.View>

              <Animated.View
                style={{
                  opacity: field3Opacity,
                  transform: [{ translateY: field3TranslateY }],
                }}
              >
                <Input
                  label="Password"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) setErrors({ ...errors, password: '' });
                  }}
                  error={errors.password}
                  hint="Min 8 chars with uppercase, lowercase & number"
                  leftIcon="lock-closed-outline"
                  secureTextEntry
                  autoCapitalize="none"
                />
              </Animated.View>

              <Animated.View
                style={{
                  opacity: field4Opacity,
                  transform: [{ translateY: field4TranslateY }],
                }}
              >
                <Input
                  label="Confirm Password"
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                  }}
                  error={errors.confirmPassword}
                  leftIcon="lock-closed-outline"
                  secureTextEntry
                  autoCapitalize="none"
                />
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
                  title="Continue"
                  variant="gradient"
                  size="lg"
                  fullWidth
                  icon="arrow-forward"
                  iconPosition="right"
                  onPress={handleNext}
                />
              </Animated.View>
            </>
          ) : (
            <>
              {ROLES.map((role, index) => (
                <RoleCard
                  key={role.id}
                  role={role}
                  selected={selectedRole === role.id}
                  onSelect={() => setSelectedRole(role.id)}
                  index={index}
                />
              ))}

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
                  title="Create Account"
                  variant="gradient"
                  size="lg"
                  fullWidth
                  loading={isLoading}
                  onPress={handleRegister}
                />
              </Animated.View>
            </>
          )}

          {/* Login Link */}
          <Animated.View
            style={[styles.loginContainer, { opacity: loginOpacity }]}
          >
            <Text variant="bodyMedium" color="secondary">
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text variant="labelLarge" color="link">
                Sign In
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
    height: 300,
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
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  stepLine: {
    width: 40,
    height: 2,
    marginHorizontal: 8,
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
  buttonContainer: {
    marginTop: 24,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
  },
  roleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleContent: {
    flex: 1,
    marginLeft: 14,
  },
  roleDescription: {
    marginTop: 2,
  },
  roleCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default RegisterScreen;
