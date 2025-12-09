/**
 * INSAF - Root Navigator
 *
 * Main navigation container that handles auth state and routing
 */

import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from './types';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { LawyerNavigator } from './LawyerNavigator';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

// Screens
import { SplashScreen } from '../screens/SplashScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { BookConsultationScreen } from '../screens/detail/BookConsultationScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const ONBOARDING_KEY = '@insaf_onboarding_complete';

export const RootNavigator: React.FC = () => {
  const { theme, isDark } = useTheme();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);

  // Check if user is a lawyer
  const isLawyer = user?.role === 'LAWYER' || user?.role === 'LAW_FIRM';

  // Check onboarding status
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const value = await AsyncStorage.getItem(ONBOARDING_KEY);
        setHasSeenOnboarding(value === 'true');
      } catch (error) {
        setHasSeenOnboarding(false);
      }
    };
    checkOnboarding();
  }, []);

  // Handle splash screen
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      setHasSeenOnboarding(true);
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  };

  // Custom navigation theme
  const navigationTheme = {
    dark: isDark,
    colors: {
      primary: theme.colors.brand.primary,
      background: theme.colors.background.primary,
      card: theme.colors.surface.primary,
      text: theme.colors.text.primary,
      border: theme.colors.border.light,
      notification: theme.colors.status.error,
    },
    fonts: DefaultTheme.fonts,
  };

  // Show splash screen
  if (showSplash) {
    return (
      <>
        <StatusBar style="light" />
        <SplashScreen />
      </>
    );
  }

  // Show loading while checking auth and onboarding
  if (authLoading || hasSeenOnboarding === null) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background.primary, alignItems: 'center', justifyContent: 'center' }}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <ActivityIndicator size="large" color={theme.colors.brand.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        {!hasSeenOnboarding ? (
          <Stack.Screen name="Onboarding">
            {(props) => <OnboardingScreen {...props} onComplete={completeOnboarding} />}
          </Stack.Screen>
        ) : !isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : isLawyer ? (
          <Stack.Screen name="Lawyer" component={LawyerNavigator} />
        ) : (
          <Stack.Screen name="Main" component={MainNavigator} />
        )}

        {/* Modals available globally */}
        <Stack.Screen
          name="BookConsultation"
          component={BookConsultationScreen}
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
