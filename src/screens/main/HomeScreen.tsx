/**
 * INSAF - Home Screen
 *
 * Main dashboard with quick actions and overview
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
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Text } from '../../components/common/Text';
import { Card } from '../../components/common/Card';
import { getClientCases, Case } from '../../services/case.service';
import { getVerifiedLawyers, LawyerProfile } from '../../services/lawyer.service';
import { subscribeToConversations } from '../../services/chat.service';
import { formatDistanceToNow } from 'date-fns';

const { width } = Dimensions.get('window');

// Quick Action Data
const QUICK_ACTIONS = [
  { id: '1', icon: 'search', title: 'Find Lawyer', color: '#4CAF50', route: 'LawyersTab' },
  { id: '2', icon: 'add-circle', title: 'New Case', color: '#2196F3', route: 'CreateCase' },
  { id: '3', icon: 'chatbubbles', title: 'Messages', color: '#9C27B0', route: 'ChatTab' },
  { id: '4', icon: 'school', title: 'Law Coach', color: '#FF9800', route: 'LawCoach' },
];

// Display case type
interface DisplayCase {
  id: string;
  caseNumber: string;
  title: string;
  description: string;
  status: string;
  lawyerName?: string;
  bidsCount: number;
  updatedAt: string;
}

export const HomeScreen: React.FC = () => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ activeCases: 0, pendingBids: 0, unreadMessages: 0 });
  const [recentCases, setRecentCases] = useState<DisplayCase[]>([]);
  const [topLawyers, setTopLawyers] = useState<LawyerProfile[]>([]);

  // Animated values
  const headerAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;
  const quickActionsAnim = useRef(new Animated.Value(0)).current;
  const recentCasesAnim = useRef(new Animated.Value(0)).current;
  const lawyersAnim = useRef(new Animated.Value(0)).current;
  const promoAnim = useRef(new Animated.Value(0)).current;

  // Fetch dashboard data
  const fetchData = useCallback(async (showLoader = true) => {
    if (!user) return;

    if (showLoader) setIsLoading(true);
    try {
      // Fetch cases
      const cases = await getClientCases(user.uid);

      // Calculate stats
      const activeCases = cases.filter(c =>
        ['ASSIGNED', 'IN_PROGRESS', 'active'].includes(c.status)
      ).length;
      const pendingBids = cases.filter(c =>
        ['POSTED', 'BIDDING', 'bidding'].includes(c.status)
      ).reduce((acc, c) => acc + (c.bidCount || 0), 0);

      setStats(prev => ({ ...prev, activeCases, pendingBids }));

      // Get recent cases (top 3)
      const displayCases: DisplayCase[] = cases.slice(0, 3).map(c => ({
        id: c.id || '',
        caseNumber: c.caseNumber,
        title: c.title,
        description: c.description,
        status: c.status,
        lawyerName: undefined, // Will need to fetch if assigned
        bidsCount: c.bidCount || 0,
        updatedAt: c.updatedAt?.toDate ? formatDistanceToNow(c.updatedAt.toDate(), { addSuffix: true }) : 'Recently',
      }));
      setRecentCases(displayCases);

      // Fetch top lawyers
      const lawyers = await getVerifiedLawyers(true);
      // Sort by rating and take top 5
      const sortedLawyers = lawyers
        .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
        .slice(0, 5);
      setTopLawyers(sortedLawyers);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  // Subscribe to unread messages count
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToConversations(user.uid, (conversations) => {
      const unreadCount = conversations.reduce((acc, conv) => {
        const unread = conv.unreadCount?.[user.uid] || 0;
        return acc + unread;
      }, 0);
      setStats(prev => ({ ...prev, unreadMessages: unreadCount }));
    });

    return () => unsubscribe();
  }, [user]);

  // Fetch on focus
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

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

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData(false);
  }, [fetchData]);

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
          <View style={styles.statCard}>
            <Ionicons name="briefcase" size={20} color="#d4af37" />
            <Text variant="h3" style={styles.statValue}>{stats.activeCases}</Text>
            <Text variant="caption" style={styles.statLabel}>Active Cases</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="hand-left" size={20} color="#d4af37" />
            <Text variant="h3" style={styles.statValue}>{stats.pendingBids}</Text>
            <Text variant="caption" style={styles.statLabel}>Pending Bids</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="mail" size={20} color="#d4af37" />
            <Text variant="h3" style={styles.statValue}>{stats.unreadMessages}</Text>
            <Text variant="caption" style={styles.statLabel}>Messages</Text>
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
            <TouchableOpacity onPress={() => navigation.navigate('CasesTab')}>
              <Text variant="labelMedium" color="link">View All</Text>
            </TouchableOpacity>
          </View>

          {recentCases.length === 0 ? (
            <Card variant="elevated" style={styles.caseCard}>
              <View style={styles.emptyState}>
                <Ionicons name="briefcase-outline" size={40} color={theme.colors.text.tertiary} />
                <Text variant="bodySmall" color="secondary" style={{ marginTop: 8, textAlign: 'center' }}>
                  No cases yet. Create your first case to get started!
                </Text>
                <TouchableOpacity
                  style={[styles.createCaseButton, { backgroundColor: theme.colors.brand.primary }]}
                  onPress={() => navigation.navigate('CreateCase')}
                >
                  <Text variant="labelSmall" style={{ color: '#fff' }}>Create Case</Text>
                </TouchableOpacity>
              </View>
            </Card>
          ) : (
            recentCases.map((caseItem) => {
              const isActive = ['ASSIGNED', 'IN_PROGRESS', 'active'].includes(caseItem.status);
              const isBidding = ['POSTED', 'BIDDING', 'bidding'].includes(caseItem.status);
              const statusColor = isActive ? '#4CAF50' : isBidding ? '#FF9800' : '#757575';
              const statusLabel = isActive ? 'Active' : isBidding ? 'Accepting Bids' : caseItem.status;

              return (
                <TouchableOpacity
                  key={caseItem.id}
                  onPress={() => navigation.navigate('CaseDetail', { caseId: caseItem.id })}
                >
                  <Card variant="elevated" style={styles.caseCard}>
                    <View style={styles.caseHeader}>
                      <View style={[styles.caseStatus, { backgroundColor: `${statusColor}20` }]}>
                        <Text variant="caption" style={{ color: statusColor }}>{statusLabel}</Text>
                      </View>
                      <Text variant="caption" color="secondary">Case #{caseItem.caseNumber}</Text>
                    </View>
                    <Text variant="h4" color="primary" style={styles.caseTitle}>
                      {caseItem.title}
                    </Text>
                    <Text variant="bodySmall" color="secondary" numberOfLines={2}>
                      {caseItem.description}
                    </Text>
                    <View style={styles.caseFooter}>
                      {caseItem.lawyerName ? (
                        <View style={styles.lawyerInfo}>
                          <View style={styles.lawyerAvatar}>
                            <Ionicons name="person" size={16} color="#fff" />
                          </View>
                          <Text variant="labelSmall" color="secondary">{caseItem.lawyerName}</Text>
                        </View>
                      ) : caseItem.bidsCount > 0 ? (
                        <View style={styles.bidInfo}>
                          <Ionicons name="hand-left" size={14} color={theme.colors.brand.primary} />
                          <Text variant="labelSmall" color="brand">{caseItem.bidsCount} bids received</Text>
                        </View>
                      ) : (
                        <Text variant="caption" color="tertiary">No bids yet</Text>
                      )}
                      <Text variant="caption" color="secondary">{caseItem.updatedAt}</Text>
                    </View>
                  </Card>
                </TouchableOpacity>
              );
            })
          )}
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
            <TouchableOpacity onPress={() => navigation.navigate('LawyersTab')}>
              <Text variant="labelMedium" color="link">View All</Text>
            </TouchableOpacity>
          </View>

          {topLawyers.length === 0 ? (
            <View style={styles.emptyLawyers}>
              <Text variant="bodySmall" color="tertiary">Loading lawyers...</Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.lawyersScroll}
            >
              {topLawyers.map((lawyer) => (
                <TouchableOpacity
                  key={lawyer.id}
                  style={[styles.lawyerCard, { backgroundColor: theme.colors.surface.primary }]}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate('LawyerDetail', { lawyerId: lawyer.id })}
                >
                  <LinearGradient
                    colors={['#1a365d', '#2d4a7c']}
                    style={styles.lawyerImage}
                  >
                    <Ionicons name="person" size={32} color="#d4af37" />
                  </LinearGradient>
                  <Text variant="labelLarge" color="primary" style={styles.lawyerName} numberOfLines={1}>
                    {lawyer.fullName}
                  </Text>
                  <Text variant="caption" color="secondary" numberOfLines={1}>
                    {lawyer.primarySpecialization?.replace(/_/g, ' ') || 'General Practice'}
                  </Text>
                  <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={12} color="#d4af37" />
                    <Text variant="caption" color="secondary"> {lawyer.averageRating?.toFixed(1) || '0.0'}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  createCaseButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyLawyers: {
    padding: 20,
    alignItems: 'center',
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
