/**
 * INSAF - Main Navigator
 *
 * Bottom tab navigation for authenticated users
 */

import React from 'react';
import { View, StyleSheet, Text as RNText } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';

// Main Screens
import { HomeScreen } from '../screens/main/HomeScreen';
import { LawyersScreen } from '../screens/main/LawyersScreen';
import { CasesScreen } from '../screens/main/CasesScreen';
import { ChatScreen } from '../screens/main/ChatScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';
import { AIChatListScreen } from '../screens/main/AIChatListScreen';
import { LawCoachScreen } from '../screens/main/LawCoachScreen';

// Detail Screens
import { LawyerDetailScreen } from '../screens/detail/LawyerDetailScreen';
import { CaseDetailScreen } from '../screens/detail/CaseDetailScreen';
import { ChatDetailScreen } from '../screens/detail/ChatDetailScreen';
import { CreateCaseScreen } from '../screens/detail/CreateCaseScreen';
import { NotificationsScreen } from '../screens/detail/NotificationsScreen';

// Settings Screens
import {
  EditProfileScreen,
  VerificationScreen,
  DocumentsScreen,
  WalletScreen,
  TransactionsScreen,
  PaymentMethodsScreen,
  NotificationSettingsScreen,
  HelpScreen,
  SupportScreen,
  TermsScreen,
  PrivacyScreen,
} from '../screens/settings';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Tab Icon Component
const TabIcon: React.FC<{
  focused: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}> = ({ focused, icon, label }) => {
  const theme = useAppTheme();

  return (
    <View style={styles.tabIconContainer}>
      {focused ? (
        <LinearGradient
          colors={['#d4af37', '#f4d03f']}
          style={styles.activeIconBg}
        >
          <Ionicons name={icon} size={22} color="#1a365d" />
        </LinearGradient>
      ) : (
        <View style={styles.inactiveIconBg}>
          <Ionicons name={icon} size={22} color={theme.colors.text.secondary} />
        </View>
      )}
      <RNText
        style={[
          styles.tabLabel,
          { color: focused ? theme.colors.brand.primary : theme.colors.text.tertiary },
        ]}
      >
        {label}
      </RNText>
    </View>
  );
};

// Tab Navigator
const TabNavigator: React.FC = () => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: theme.colors.surface.primary,
            paddingBottom: insets.bottom > 0 ? insets.bottom - 10 : 10,
            height: 70 + (insets.bottom > 0 ? insets.bottom - 10 : 0),
            borderTopColor: theme.colors.border.light,
          },
        ],
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="home" label="Home" />
          ),
        }}
      />
      <Tab.Screen
        name="LawyersTab"
        component={LawyersScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="people" label="Lawyers" />
          ),
        }}
      />
      <Tab.Screen
        name="CasesTab"
        component={CasesScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="briefcase" label="Cases" />
          ),
        }}
      />
      <Tab.Screen
        name="ChatTab"
        component={ChatScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="chatbubbles" label="Chat" />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="person" label="Profile" />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Main Navigator with Stack
export const MainNavigator: React.FC = () => {
  const theme = useAppTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background.primary },
      }}
    >
      <Stack.Screen name="MainTabs" component={TabNavigator} />

      {/* Detail Screens */}
      <Stack.Screen
        name="LawyerDetail"
        component={LawyerDetailScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="CaseDetail"
        component={CaseDetailScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="ChatDetail"
        component={ChatDetailScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="CreateCase"
        component={CreateCaseScreen}
        options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="AIChatList"
        component={AIChatListScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="LawCoach"
        component={LawCoachScreen}
        options={{ animation: 'slide_from_bottom' }}
      />

      {/* Settings Screens */}
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Verification"
        component={VerificationScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Documents"
        component={DocumentsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Wallet"
        component={WalletScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Transactions"
        component={TransactionsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="PaymentMethods"
        component={PaymentMethodsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Help"
        component={HelpScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Support"
        component={SupportScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Terms"
        component={TermsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Privacy"
        component={PrivacyScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    borderTopWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
  },
  activeIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  inactiveIconBg: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
});

export default MainNavigator;
