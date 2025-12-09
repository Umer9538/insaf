/**
 * INSAF - Lawyer Navigator
 *
 * Bottom tab navigation for lawyer users
 */

import React from 'react';
import { View, StyleSheet, Text as RNText } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';

// Lawyer Screens
import { LawyerDashboardScreen } from '../screens/lawyer/LawyerDashboardScreen';
import { AvailableCasesScreen } from '../screens/lawyer/AvailableCasesScreen';
import { MyBidsScreen } from '../screens/lawyer/MyBidsScreen';

// Shared Screens
import { ChatScreen } from '../screens/main/ChatScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';
import { AIChatListScreen } from '../screens/main/AIChatListScreen';
import { LawAssistantScreen } from '../screens/lawyer/LawAssistantScreen';
import { LawyersScreen } from '../screens/main/LawyersScreen';
import { FollowListScreen } from '../screens/main/FollowListScreen';

// Detail Screens
import { CaseDetailScreen } from '../screens/detail/CaseDetailScreen';
import { ChatDetailScreen } from '../screens/detail/ChatDetailScreen';
import { NotificationsScreen } from '../screens/detail/NotificationsScreen';
import { LawyerDetailScreen } from '../screens/detail/LawyerDetailScreen';

// Lawyer-specific Detail Screens
import { SubmitBidScreen } from '../screens/lawyer/SubmitBidScreen';
import { LawyerEarningsScreen } from '../screens/lawyer/LawyerEarningsScreen';
import { LawyerProfileEditScreen } from '../screens/lawyer/LawyerProfileEditScreen';
import { LawyerVerificationScreen } from '../screens/lawyer/LawyerVerificationScreen';

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
        name="DashboardTab"
        component={LawyerDashboardScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="home" label="Dashboard" />
          ),
        }}
      />
      <Tab.Screen
        name="CasesTab"
        component={AvailableCasesScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="briefcase" label="Cases" />
          ),
        }}
      />
      <Tab.Screen
        name="BidsTab"
        component={MyBidsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="hand-left" label="Bids" />
          ),
        }}
      />
      <Tab.Screen
        name="ChatTab"
        component={ChatScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="chatbubbles" label="Messages" />
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

// Lawyer Navigator with Stack
export const LawyerNavigator: React.FC = () => {
  const theme = useAppTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background.primary },
      }}
    >
      <Stack.Screen name="LawyerTabs" component={TabNavigator} />

      {/* Detail Screens */}
      <Stack.Screen
        name="CaseDetail"
        component={CaseDetailScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="SubmitBid"
        component={SubmitBidScreen}
        options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
      />
      <Stack.Screen
        name="LawyerEarnings"
        component={LawyerEarningsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="LawyerProfileEdit"
        component={LawyerProfileEditScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="ChatDetail"
        component={ChatDetailScreen}
        options={{ animation: 'slide_from_right' }}
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
        name="LawAssistant"
        component={LawAssistantScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="Lawyers"
        component={LawyersScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="LawyerDetail"
        component={LawyerDetailScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="FollowList"
        component={FollowListScreen}
        options={{ animation: 'slide_from_right' }}
      />

      <Stack.Screen
        name="LawyerVerification"
        component={LawyerVerificationScreen}
        options={{ animation: 'slide_from_right' }}
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

export default LawyerNavigator;
