/**
 * INSAF - Profile Screen
 *
 * User profile and settings
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme, useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Text } from '../../components/common/Text';

// Menu Sections
const PROFILE_MENU = [
  {
    title: 'Account',
    items: [
      { id: 'edit', icon: 'person-outline', label: 'Edit Profile', route: 'EditProfile' },
      { id: 'verification', icon: 'shield-checkmark-outline', label: 'Verification Status', route: 'Verification' },
      { id: 'documents', icon: 'document-text-outline', label: 'My Documents', route: 'Documents' },
    ],
  },
  {
    title: 'Payments',
    items: [
      { id: 'wallet', icon: 'wallet-outline', label: 'Wallet & Escrow', route: 'Wallet' },
      { id: 'transactions', icon: 'receipt-outline', label: 'Transaction History', route: 'Transactions' },
      { id: 'payment-methods', icon: 'card-outline', label: 'Payment Methods', route: 'PaymentMethods' },
    ],
  },
  {
    title: 'Preferences',
    items: [
      { id: 'notifications', icon: 'notifications-outline', label: 'Notifications', route: 'NotificationSettings' },
      { id: 'language', icon: 'language-outline', label: 'Language', value: 'English' },
      { id: 'theme', icon: 'moon-outline', label: 'Dark Mode', toggle: true },
    ],
  },
  {
    title: 'Support',
    items: [
      { id: 'help', icon: 'help-circle-outline', label: 'Help Center', route: 'Help' },
      { id: 'contact', icon: 'chatbubble-outline', label: 'Contact Support', route: 'Support' },
      { id: 'feedback', icon: 'star-outline', label: 'Rate the App' },
    ],
  },
  {
    title: 'Legal',
    items: [
      { id: 'terms', icon: 'document-outline', label: 'Terms of Service', route: 'Terms' },
      { id: 'privacy', icon: 'lock-closed-outline', label: 'Privacy Policy', route: 'Privacy' },
    ],
  },
];

export const ProfileScreen: React.FC = () => {
  const theme = useAppTheme();
  const { isDark, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user, logout } = useAuth();

  // Animated values
  const headerAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;
  const menuAnims = useRef(PROFILE_MENU.map(() => new Animated.Value(0))).current;
  const logoutAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animations = [
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(statsAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      ...menuAnims.map((anim) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        })
      ),
      Animated.timing(logoutAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ];

    Animated.stagger(100, animations).start();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleMenuPress = (item: any) => {
    if (item.route) {
      navigation.navigate(item.route);
    } else if (item.id === 'feedback') {
      Alert.alert('Rate INSAF', 'Thank you for using INSAF! Would you like to rate us?');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={theme.colors.gradient.primary as [string, string]}
          style={[styles.header, { paddingTop: insets.top + 16 }]}
        >
          <Animated.View
            style={{
              opacity: headerAnim,
              transform: [{
                translateY: headerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              }],
            }}
          >
            {/* Profile Avatar */}
            <View style={styles.avatarSection}>
              <LinearGradient
                colors={['#d4af37', '#f4d03f']}
                style={styles.avatarGradient}
              >
                <Ionicons name="person" size={40} color="#1a365d" />
              </LinearGradient>
              <TouchableOpacity style={styles.editAvatarButton}>
                <Ionicons name="camera" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* User Info */}
            <View style={styles.userInfo}>
              <Text variant="h2" style={styles.userName}>
                {user?.displayName || 'User'}
              </Text>
              <Text variant="bodySmall" style={styles.userEmail}>
                {user?.email || 'user@example.com'}
              </Text>
              <View style={styles.roleBadge}>
                <Ionicons name="shield-checkmark" size={12} color="#4CAF50" />
                <Text variant="caption" style={styles.roleText}>
                  Verified {user?.role || 'Client'}
                </Text>
              </View>
            </View>

            {/* Stats */}
            <Animated.View
              style={[
                styles.statsContainer,
                {
                  opacity: statsAnim,
                  transform: [{
                    translateY: statsAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  }],
                }
              ]}
            >
              <View style={styles.statItem}>
                <Text variant="h3" style={styles.statValue}>3</Text>
                <Text variant="caption" style={styles.statLabel}>Active Cases</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text variant="h3" style={styles.statValue}>12</Text>
                <Text variant="caption" style={styles.statLabel}>Total Cases</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text variant="h3" style={styles.statValue}>4.8</Text>
                <Text variant="caption" style={styles.statLabel}>Rating</Text>
              </View>
            </Animated.View>
          </Animated.View>
        </LinearGradient>

        {/* Menu Sections */}
        <View style={styles.menuContainer}>
          {PROFILE_MENU.map((section, sectionIndex) => (
            <Animated.View
              key={section.title}
              style={[
                styles.menuSection,
                {
                  opacity: menuAnims[sectionIndex],
                  transform: [{
                    translateX: menuAnims[sectionIndex].interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0],
                    }),
                  }],
                }
              ]}
            >
              <Text variant="labelMedium" color="secondary" style={styles.sectionTitle}>
                {section.title}
              </Text>
              <View style={[styles.menuCard, { backgroundColor: theme.colors.surface.primary }]}>
                {section.items.map((item, itemIndex) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.menuItem,
                      itemIndex < section.items.length - 1 && styles.menuItemBorder,
                    ]}
                    onPress={() => !item.toggle && handleMenuPress(item)}
                    activeOpacity={item.toggle ? 1 : 0.7}
                  >
                    <View style={[styles.menuIconContainer, { backgroundColor: `${theme.colors.brand.primary}15` }]}>
                      <Ionicons
                        name={item.icon as any}
                        size={20}
                        color={theme.colors.brand.primary}
                      />
                    </View>
                    <Text variant="bodyMedium" color="primary" style={styles.menuLabel}>
                      {item.label}
                    </Text>
                    {item.toggle ? (
                      <Switch
                        value={isDark}
                        onValueChange={toggleTheme}
                        trackColor={{ false: '#E0E0E0', true: '#d4af3780' }}
                        thumbColor={isDark ? '#d4af37' : '#FFFFFF'}
                      />
                    ) : item.value ? (
                      <Text variant="bodySmall" color="tertiary">{item.value}</Text>
                    ) : (
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={theme.colors.text.tertiary}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>
          ))}

          {/* Logout Button */}
          <Animated.View
            style={[
              styles.logoutSection,
              {
                opacity: logoutAnim,
                transform: [{
                  translateY: logoutAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                }],
              }
            ]}
          >
            <TouchableOpacity
              style={[styles.logoutButton, { backgroundColor: theme.colors.surface.primary }]}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={22} color="#EF4444" />
              <Text variant="labelLarge" style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* App Version */}
          <Text variant="caption" color="tertiary" style={styles.versionText}>
            INSAF v1.0.0 • Made in Pakistan
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    alignItems: 'center',
  },
  avatarSection: {
    position: 'relative',
    marginBottom: 16,
    alignSelf: 'center',
  },
  avatarGradient: {
    width: 90,
    height: 90,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#d4af37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1a365d',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  userName: {
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userEmail: {
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roleText: {
    color: '#FFFFFF',
    marginLeft: 6,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: '#FFFFFF',
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  menuContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  menuSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  menuCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    marginLeft: 14,
  },
  logoutSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutText: {
    color: '#EF4444',
  },
  versionText: {
    textAlign: 'center',
    marginTop: 8,
  },
});

export default ProfileScreen;
