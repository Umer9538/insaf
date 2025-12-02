/**
 * INSAF - Auth Navigator
 *
 * Navigation stack for authentication screens
 */

import React from 'react';
import { View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from './types';
import { useAppTheme } from '../context/ThemeContext';

// Import actual screens
import { WelcomeScreen, LoginScreen, RegisterScreen } from '../screens/auth';
import { Text } from '../components/common/Text';

// Placeholder screens for screens not yet created
const ForgotPasswordScreen = () => (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
    <Text>Forgot Password Screen (Coming Soon)</Text>
  </View>
);

const OTPVerificationScreen = () => (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
    <Text>OTP Verification Screen (Coming Soon)</Text>
  </View>
);

const RegisterRoleScreen = () => (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
    <Text>Register Role Screen (Coming Soon)</Text>
  </View>
);

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator: React.FC = () => {
  const theme = useAppTheme();

  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: theme.colors.background.primary,
        },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="RegisterRole" component={RegisterRoleScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen
        name="OTPVerification"
        component={OTPVerificationScreen}
        options={{ animation: 'fade' }}
      />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
