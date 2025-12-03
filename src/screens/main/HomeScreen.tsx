/**
 * INSAF - Home Screen
 *
 * Main dashboard with quick actions and overview
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Text } from '../../components/common/Text';
import { Card } from '../../components/common/Card';

const { width } = Dimensions.get('window');

// Quick Action Data
const QUICK_ACTIONS = [
  { id: '1', icon: 'search', title: 'Find Lawyer', color: '#4CAF50', route: 'Lawyers' },
  { id: '2', icon: 'add-circle', title: 'New Case', color: '#2196F3', route: 'CreateCase' },
  { id: '3', icon: 'chatbubbles', title: 'Messages', color: '#9C27B0', route: 'Chat' },
  { id: '4', icon: 'school', title: 'Law Coach', color: '#FF9800', route: 'LawCoach' },
];

// Stats Data
const STATS = [
  { id: '1', label: 'Active Cases', value: '3', icon: 'briefcase' },
  { id: '2', label: 'Pending Bids', value: '7', icon: 'hand-left' },
  { id: '3', label: 'Messages', value: '12', icon: 'mail' },
];

export const HomeScreen: React.FC = () => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);

  // Animated values
  const headerAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;
  const quickActionsAnim = useRef(new Animated.Value(0)).current;
  const recentCasesAnim = useRef(new Animated.Value(0)).current;
  const lawyersAnim = useRef(new Animated.Value(0)).current;
  const promoAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(100, [
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
      Animated.timing(quickActionsAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(recentCasesAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(lawyersAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(promoAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      {/* Header */}
      <LinearGradient
        colors={theme.colors.gradient.primary as [string, string]}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <Animated.View
          style={[
            styles.headerContent,
            {
              opacity: headerAnim,
              transform: [{
                translateY: headerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              }],
            }
          ]}
        >
          <View style={styles.headerLeft}>
            <Text variant="bodySmall" style={styles.greeting}>
              {getGreeting()}
            </Text>
            <Text variant="h2" style={styles.userName}>
              {user?.displayName || 'User'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => navigation.navigate('AIChatList')}
            >
              <Ionicons name="chatbubbles-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
              <View style={styles.notificationBadge}>
                <Text variant="caption" style={styles.badgeText}>3</Text>
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Stats Cards */}
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
          {STATS.map((stat, index) => (
            <View key={stat.id} style={styles.statCard}>
              <Ionicons name={stat.icon as any} size={20} color="#d4af37" />
              <Text variant="h3" style={styles.statValue}>{stat.value}</Text>
              <Text variant="caption" style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </Animated.View>
      </LinearGradient>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Quick Actions */}
        <Animated.View
          style={{
            opacity: quickActionsAnim,
            transform: [{
              translateY: quickActionsAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            }],
          }}
        >
          <Text variant="h4" color="primary" style={styles.sectionTitle}>
            Quick Actions
          </Text>
          <View style={styles.quickActionsGrid}>
            {QUICK_ACTIONS.map((action, index) => (
              <TouchableOpacity
                key={action.id}
                style={[
                  styles.quickActionCard,
                  { backgroundColor: theme.colors.surface.primary },
                ]}
                onPress={() => navigation.navigate(action.route)}
                activeOpacity={0.7}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}20` }]}>
                  <Ionicons name={action.icon as any} size={24} color={action.color} />
                </View>
                <Text variant="labelMedium" color="primary" style={styles.quickActionText}>
                  {action.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Recent Cases Section */}
        <Animated.View
          style={{
            opacity: recentCasesAnim,
            transform: [{
              translateY: recentCasesAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            }],
          }}
        >
          <View style={styles.sectionHeader}>
            <Text variant="h4" color="primary">Recent Cases</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Cases')}>
              <Text variant="labelMedium" color="link">View All</Text>
            </TouchableOpacity>
          </View>

          <Card variant="elevated" style={styles.caseCard}>
            <View style={styles.caseHeader}>
              <View style={[styles.caseStatus, { backgroundColor: '#4CAF5020' }]}>
                <Text variant="caption" style={{ color: '#4CAF50' }}>Active</Text>
              </View>
              <Text variant="caption" color="secondary">Case #INS-2024-001</Text>
            </View>
            <Text variant="h4" color="primary" style={styles.caseTitle}>
              Property Dispute Resolution
            </Text>
            <Text variant="bodySmall" color="secondary" numberOfLines={2}>
              Land ownership dispute in Lahore. Seeking legal representation for property claim.
            </Text>
            <View style={styles.caseFooter}>
              <View style={styles.lawyerInfo}>
                <View style={styles.lawyerAvatar}>
                  <Ionicons name="person" size={16} color="#fff" />
                </View>
                <Text variant="labelSmall" color="secondary">Adv. Ahmad Khan</Text>
              </View>
              <Text variant="caption" color="secondary">Updated 2h ago</Text>
            </View>
          </Card>

          <Card variant="elevated" style={styles.caseCard}>
            <View style={styles.caseHeader}>
              <View style={[styles.caseStatus, { backgroundColor: '#FF980020' }]}>
                <Text variant="caption" style={{ color: '#FF9800' }}>Pending Bids</Text>
              </View>
              <Text variant="caption" color="secondary">Case #INS-2024-002</Text>
            </View>
            <Text variant="h4" color="primary" style={styles.caseTitle}>
              Corporate Contract Review
            </Text>
            <Text variant="bodySmall" color="secondary" numberOfLines={2}>
              Need lawyer to review and negotiate business partnership agreement terms.
            </Text>
            <View style={styles.caseFooter}>
              <View style={styles.bidInfo}>
                <Ionicons name="hand-left" size={14} color={theme.colors.brand.primary} />
                <Text variant="labelSmall" color="brand">5 bids received</Text>
              </View>
              <Text variant="caption" color="secondary">Posted 1d ago</Text>
            </View>
          </Card>
        </Animated.View>

        {/* Featured Lawyers */}
        <Animated.View
          style={{
            opacity: lawyersAnim,
            transform: [{
              translateY: lawyersAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            }],
          }}
        >
          <View style={styles.sectionHeader}>
            <Text variant="h4" color="primary">Top Lawyers</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Lawyers')}>
              <Text variant="labelMedium" color="link">View All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.lawyersScroll}
          >
            {[1, 2, 3].map((_, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.lawyerCard, { backgroundColor: theme.colors.surface.primary }]}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['#1a365d', '#2d4a7c']}
                  style={styles.lawyerImage}
                >
                  <Ionicons name="person" size={32} color="#d4af37" />
                </LinearGradient>
                <Text variant="labelLarge" color="primary" style={styles.lawyerName}>
                  Adv. {['Ahmad Khan', 'Sara Ali', 'Imran Shah'][index]}
                </Text>
                <Text variant="caption" color="secondary">
                  {['Criminal Law', 'Family Law', 'Corporate Law'][index]}
                </Text>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={12} color="#d4af37" />
                  <Text variant="caption" color="secondary"> {['4.9', '4.8', '4.7'][index]}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Law Coach Promo */}
        <Animated.View
          style={{
            opacity: promoAnim,
            transform: [{
              translateY: promoAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            }],
          }}
        >
          <TouchableOpacity activeOpacity={0.9}>
            <LinearGradient
              colors={['#d4af37', '#f4d03f']}
              style={styles.promoCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.promoContent}>
                <Text variant="h3" style={styles.promoTitle}>
                  AI Law Coach
                </Text>
                <Text variant="bodySmall" style={styles.promoText}>
                  Get instant legal guidance powered by AI. Available 24/7.
                </Text>
                <View style={styles.promoButton}>
                  <Text variant="labelMedium" style={styles.promoButtonText}>Try Now</Text>
                  <Ionicons name="arrow-forward" size={16} color="#1a365d" />
                </View>
              </View>
              <View style={styles.promoIcon}>
                <Ionicons name="school" size={60} color="rgba(26, 54, 93, 0.2)" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

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
    paddingBottom: 80,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerLeft: {},
  greeting: {
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  userName: {
    color: '#FFFFFF',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statValue: {
    color: '#FFFFFF',
    marginTop: 8,
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    marginTop: -40,
  },
  contentContainer: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 24,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: (width - 52) / 2,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickActionText: {
    textAlign: 'center',
  },
  caseCard: {
    marginBottom: 12,
    padding: 16,
  },
  caseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  caseStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  caseTitle: {
    marginBottom: 8,
  },
  caseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  lawyerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lawyerAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1a365d',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  bidInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lawyersScroll: {
    paddingRight: 20,
  },
  lawyerCard: {
    width: 140,
    padding: 16,
    borderRadius: 16,
    marginRight: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lawyerImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  lawyerName: {
    textAlign: 'center',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  promoCard: {
    marginTop: 24,
    borderRadius: 20,
    padding: 20,
    overflow: 'hidden',
  },
  promoContent: {
    flex: 1,
  },
  promoTitle: {
    color: '#1a365d',
    marginBottom: 8,
  },
  promoText: {
    color: 'rgba(26, 54, 93, 0.8)',
    marginBottom: 16,
    maxWidth: '70%',
  },
  promoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a365d',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  promoButtonText: {
    color: '#FFFFFF',
  },
  promoIcon: {
    position: 'absolute',
    right: 10,
    bottom: 10,
  },
});

export default HomeScreen;
