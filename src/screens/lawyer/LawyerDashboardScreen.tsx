/**
 * INSAF - Lawyer Dashboard Screen
 *
 * Main dashboard for lawyers with stats, quick actions, and recent activity
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  Animated,
  Switch,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Text } from '../../components/common/Text';
import { Card } from '../../components/common/Card';

// Import real backend services
import {
  getLawyerDashboardStats,
  getActivityFeed,
} from '../../services/analytics.service';
import {
  getLawyerProfile,
  updateAvailability,
  AvailabilityStatus,
} from '../../services/lawyer.service';

// Analytics interface with verification status
export interface LawyerDashboardStats {
  activeCases: number;
  pendingBids: number;
  totalEarnings: number;
  averageRating: number;
  totalReviews: number;
  upcomingConsultations: number;
  verificationStatus?: 'VERIFIED' | 'PENDING' | 'UNVERIFIED';
}

const { width } = Dimensions.get('window');

// TypeScript Interfaces
interface RecentActivity {
  type: 'case' | 'bid' | 'payment' | 'review' | 'consultation';
  title: string;
  description: string;
  timestamp: Date;
  data?: any;
}

interface QuickAction {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  color: string;
  route: string;
}

// Quick Actions Data
const QUICK_ACTIONS: QuickAction[] = [
  { id: '1', icon: 'briefcase-outline', title: 'Available Cases', color: '#4CAF50', route: 'CasesTab' },
  { id: '2', icon: 'hand-left-outline', title: 'My Bids', color: '#2196F3', route: 'BidsTab' },
  { id: '3', icon: 'people-outline', title: 'Find Lawyers', color: '#9C27B0', route: 'Lawyers' },
  { id: '4', icon: 'wallet-outline', title: 'Earnings', color: '#FF9800', route: 'LawyerEarnings' },
];

export const LawyerDashboardScreen: React.FC = () => {
  const theme = useAppTheme();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);
  const [specialization, setSpecialization] = useState('');

  // State for lawyer stats from backend
  const [stats, setStats] = useState<LawyerDashboardStats | null>(null);

  // State for recent activity from backend
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  // Animated values
  const headerAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;
  const quickActionsAnim = useRef(new Animated.Value(0)).current;
  const activityAnim = useRef(new Animated.Value(0)).current;
  const availabilityAnim = useRef(new Animated.Value(0)).current;

  // Fetch data from backend
  const fetchDashboardData = useCallback(async () => {
    if (!user?.uid) return;

    try {
      // Fetch dashboard stats and activity in parallel
      const [dashboardStats, activities, lawyerProfile] = await Promise.all([
        getLawyerDashboardStats(user.uid),
        getActivityFeed(user.uid, 5),
        getLawyerProfile(user.uid),
      ]);

      if (lawyerProfile) {
        // Merge verification status into stats
        setStats({
          ...dashboardStats,
          verificationStatus: lawyerProfile.verificationStatus as 'VERIFIED' | 'PENDING' | 'UNVERIFIED',
        });
        setIsAvailable(lawyerProfile.availabilityStatus === 'AVAILABLE');
        setSpecialization(lawyerProfile.specializations.join(' & ') || 'Legal Services');
      } else {
        setStats(dashboardStats);
      }

      setRecentActivity(activities);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [fetchDashboardData])
  );

  useEffect(() => {
    if (!loading) {
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
        Animated.timing(activityAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(availabilityAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loading]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  }, [fetchDashboardData]);

  const toggleAvailability = async () => {
    if (!user?.uid) return;

    const newStatus: AvailabilityStatus = isAvailable ? 'UNAVAILABLE' : 'AVAILABLE';
    setIsAvailable(!isAvailable);

    try {
      await updateAvailability(user.uid, newStatus);
    } catch (error) {
      // Revert on error
      setIsAvailable(isAvailable);
      console.error('Error updating availability:', error);
    }
  };

  const formatCurrency = (amount: number): string => {
    return `PKR ${amount.toLocaleString()}`;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getActivityIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'case': return 'briefcase';
      case 'bid': return 'hand-left';
      case 'payment': return 'cash';
      case 'review': return 'star';
      case 'consultation': return 'videocam';
      default: return 'ellipse';
    }
  };

  const getActivityColor = (type: string): string => {
    switch (type) {
      case 'case': return '#4CAF50';
      case 'bid': return '#2196F3';
      case 'payment': return '#FF9800';
      case 'review': return '#9C27B0';
      case 'consultation': return '#00BCD4';
      default: return '#607D8B';
    }
  };

  const formatTimestamp = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.brand.primary} />
          <Text variant="bodyMedium" color="secondary" style={{ marginTop: 16 }}>
            Loading dashboard...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={theme.colors.gradient.primary as [string, string]}
        style={styles.header}
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
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <Text variant="bodySmall" style={styles.greeting}>
                {getGreeting()}
              </Text>
              <View style={styles.nameContainer}>
                <Text variant="h2" style={styles.userName}>
                  {user?.displayName || 'Lawyer'}
                </Text>
                {/* Real Verified Badge */}
                {stats?.verificationStatus === 'VERIFIED' && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={20} color="#d4af37" />
                  </View>
                )}
              </View>
              <Text variant="caption" style={styles.specialization}>
                {specialization || 'Legal Services'}
              </Text>

              {/* Not Verified Warning */}
              {stats?.verificationStatus !== 'VERIFIED' && (
                <TouchableOpacity
                  style={styles.notVerifiedContainer}
                  onPress={() => navigation.navigate('LawyerVerification')}
                >
                  <Ionicons name="alert-circle-outline" size={14} color="#EF4444" />
                  <Text variant="caption" style={{ color: '#EF4444', marginLeft: 4, fontWeight: 'bold' }}>
                    Get Verified
                  </Text>
                  <Ionicons name="chevron-forward" size={12} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                style={styles.notificationButton}
                onPress={() => navigation.navigate('AIChatList', {
                  chatType: 'LAW_ASSISTANT',
                  targetScreen: 'LawAssistant'
                })}
              >
                <Ionicons name="chatbubbles-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.notificationButton}
                onPress={() => navigation.navigate('Notifications')}
              >
                <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
                <View style={styles.notificationBadge}>
                  <Text variant="caption" style={styles.badgeText}>
                    {stats?.upcomingConsultations || 0}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
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
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Ionicons name="briefcase" size={20} color="#d4af37" />
              <Text variant="h3" style={styles.statValue}>{stats?.activeCases || 0}</Text>
              <Text variant="caption" style={styles.statLabel}>Active Cases</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="hand-left" size={20} color="#d4af37" />
              <Text variant="h3" style={styles.statValue}>{stats?.pendingBids || 0}</Text>
              <Text variant="caption" style={styles.statLabel}>Pending Bids</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Ionicons name="cash" size={20} color="#d4af37" />
              <Text variant="h4" style={styles.statValue}>
                {formatCurrency(stats?.totalEarnings || 0)}
              </Text>
              <Text variant="caption" style={styles.statLabel}>Total Earnings</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="star" size={20} color="#d4af37" />
              <Text variant="h3" style={styles.statValue}>
                {stats?.averageRating?.toFixed(1) || '0.0'}
              </Text>
              <Text variant="caption" style={styles.statLabel}>Rating ({stats?.totalReviews || 0})</Text>
            </View>
          </View>
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
        {/* Availability Toggle */}
        <Animated.View
          style={{
            opacity: availabilityAnim,
            transform: [{
              translateY: availabilityAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            }],
          }}
        >
          <Card variant="elevated" style={styles.availabilityCard}>
            <View style={styles.availabilityContent}>
              <View style={styles.availabilityLeft}>
                <Ionicons
                  name={isAvailable ? "checkmark-circle" : "close-circle"}
                  size={24}
                  color={isAvailable ? '#4CAF50' : '#EF4444'}
                />
                <View style={styles.availabilityText}>
                  <Text variant="labelLarge" color="primary">
                    {isAvailable ? 'Available for Cases' : 'Not Available'}
                  </Text>
                  <Text variant="caption" color="secondary">
                    {isAvailable ? 'Accepting new cases' : 'Not accepting new cases'}
                  </Text>
                </View>
              </View>
              <Switch
                value={isAvailable}
                onValueChange={toggleAvailability}
                trackColor={{ false: '#CBD5E1', true: '#4CAF50' }}
                thumbColor={isAvailable ? '#fff' : '#f4f3f4'}
              />
            </View>
          </Card>
        </Animated.View>

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
            {QUICK_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={[
                  styles.quickActionCard,
                  { backgroundColor: theme.colors.surface.primary },
                ]}
                onPress={() => navigation.navigate(action.route)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={[`${action.color}20`, `${action.color}10`]}
                  style={styles.quickActionIcon}
                >
                  <Ionicons name={action.icon} size={24} color={action.color} />
                </LinearGradient>
                <Text variant="labelMedium" color="primary" style={styles.quickActionText}>
                  {action.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Recent Activity */}
        <Animated.View
          style={{
            opacity: activityAnim,
            transform: [{
              translateY: activityAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            }],
          }}
        >
          <View style={styles.sectionHeader}>
            <Text variant="h4" color="primary">Recent Activity</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AllActivity')}>
              <Text variant="labelMedium" color="link">View All</Text>
            </TouchableOpacity>
          </View>

          {recentActivity.length > 0 ? (
            recentActivity.map((activity, index) => (
              <Card
                key={index}
                variant="elevated"
                style={[
                  styles.activityCard,
                  index === recentActivity.length - 1 ? styles.lastActivityCard : {}
                ]}
              >
                <View style={styles.activityContent}>
                  <View style={[
                    styles.activityIcon,
                    { backgroundColor: `${getActivityColor(activity.type)}20` }
                  ]}>
                    <Ionicons
                      name={getActivityIcon(activity.type)}
                      size={20}
                      color={getActivityColor(activity.type)}
                    />
                  </View>
                  <View style={styles.activityDetails}>
                    <Text variant="labelLarge" color="primary">
                      {activity.title}
                    </Text>
                    <Text variant="bodySmall" color="secondary" numberOfLines={1}>
                      {activity.description}
                    </Text>
                    <Text variant="caption" color="secondary" style={styles.activityTime}>
                      {formatTimestamp(activity.timestamp)}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.activityArrow}>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={theme.colors.text.tertiary}
                    />
                  </TouchableOpacity>
                </View>
              </Card>
            ))
          ) : (
            <Card variant="elevated" style={styles.emptyCard}>
              <View style={styles.emptyContent}>
                <Ionicons name="time-outline" size={48} color={theme.colors.text.tertiary} />
                <Text variant="bodyMedium" color="secondary" style={{ marginTop: 12 }}>
                  No recent activity
                </Text>
              </View>
            </Card>
          )}
        </Animated.View>

        {/* Premium Feature Banner */}
        <TouchableOpacity activeOpacity={0.9} style={styles.premiumBanner}>
          <LinearGradient
            colors={['#d4af37', '#f4d03f']}
            style={styles.premiumCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.premiumContent}>
              <View style={styles.premiumBadge}>
                <Ionicons name="star" size={16} color="#1a365d" />
                <Text variant="labelSmall" style={styles.premiumBadgeText}>
                  PREMIUM
                </Text>
              </View>
              <Text variant="h4" style={styles.premiumTitle}>
                Boost Your Visibility
              </Text>
              <Text variant="bodySmall" style={styles.premiumText}>
                Get featured in top lawyer listings and reach more clients
              </Text>
              <View style={styles.premiumButton}>
                <Text variant="labelMedium" style={styles.premiumButtonText}>
                  Upgrade Now
                </Text>
                <Ionicons name="arrow-forward" size={16} color="#1a365d" />
              </View>
            </View>
            <View style={styles.premiumIcon}>
              <Ionicons name="trending-up" size={80} color="rgba(26, 54, 93, 0.15)" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    marginBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    color: '#FFFFFF',
    marginRight: 8,
  },
  verifiedBadge: {
    marginTop: 4,
  },
  specialization: {
    color: 'rgba(255, 255, 255, 0.6)',
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
    gap: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
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
    marginTop: -80,
  },
  contentContainer: {
    paddingHorizontal: 20,
  },
  availabilityCard: {
    padding: 16,
    marginBottom: 24,
  },
  availabilityContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  availabilityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  availabilityText: {
    marginLeft: 12,
    flex: 1,
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
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickActionText: {
    textAlign: 'center',
  },
  activityCard: {
    padding: 16,
    marginBottom: 12,
  },
  lastActivityCard: {
    marginBottom: 0,
  },
  activityContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityDetails: {
    flex: 1,
    marginLeft: 12,
  },
  activityTime: {
    marginTop: 4,
  },
  activityArrow: {
    marginLeft: 8,
  },
  emptyCard: {
    padding: 32,
  },
  emptyContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumBanner: {
    marginTop: 24,
  },
  premiumCard: {
    borderRadius: 20,
    padding: 20,
    overflow: 'hidden',
    minHeight: 160,
  },
  premiumContent: {
    flex: 1,
    zIndex: 1,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 54, 93, 0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
    gap: 4,
  },
  premiumBadgeText: {
    color: '#1a365d',
    fontWeight: '700',
  },
  premiumTitle: {
    color: '#1a365d',
    marginBottom: 8,
  },
  premiumText: {
    color: 'rgba(26, 54, 93, 0.8)',
    marginBottom: 16,
    maxWidth: '70%',
  },
  premiumButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a365d',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  premiumButtonText: {
    color: '#FFFFFF',
  },
  premiumIcon: {
    position: 'absolute',
    right: -10,
    bottom: -10,
  },
  notVerifiedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
});

export default LawyerDashboardScreen;
