/**
 * INSAF - Lawyer Earnings Screen
 *
 * Shows lawyer's financial information with earnings tracking and transaction history
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
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Text } from '../../components/common/Text';
import { Card } from '../../components/common/Card';

// Import real backend services
import {
  getLawyerWallet,
  getLawyerEarnings,
  getEarningsSummary,
  Earning,
  LawyerWallet,
  subscribeToWallet,
  subscribeToEarnings,
} from '../../services/earnings.service';
import { getEarningsTrend, EarningsTrend } from '../../services/analytics.service';

const { width } = Dimensions.get('window');

// TypeScript Interfaces
interface EarningsStats {
  totalEarned: number;
  pending: number;
  available: number;
  withdrawn: number;
}

type PeriodType = 'week' | 'month' | 'year' | 'all';

interface Period {
  id: PeriodType;
  label: string;
}

// Period selector data
const PERIODS: Period[] = [
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'year', label: 'This Year' },
  { id: 'all', label: 'All Time' },
];

export const LawyerEarningsScreen: React.FC = () => {
  const theme = useAppTheme();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('month');

  // State from backend
  const [wallet, setWallet] = useState<LawyerWallet | null>(null);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [stats, setStats] = useState<EarningsStats>({
    totalEarned: 0,
    pending: 0,
    available: 0,
    withdrawn: 0,
  });
  const [chartData, setChartData] = useState<EarningsTrend[]>([]);

  // Animated values
  const headerAnim = useRef(new Animated.Value(0)).current;
  const periodAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;
  const chartAnim = useRef(new Animated.Value(0)).current;
  const transactionsAnim = useRef(new Animated.Value(0)).current;

  // Fetch data from backend
  const fetchEarningsData = useCallback(async () => {
    if (!user?.uid) return;

    try {
      // Calculate date range based on selected period
      const now = new Date();
      let startDate: Date | undefined;

      switch (selectedPeriod) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        case 'all':
          startDate = undefined;
          break;
      }

      // Fetch data in parallel
      const [walletData, earningsData, summaryData, trendData] = await Promise.all([
        getLawyerWallet(user.uid),
        getLawyerEarnings(user.uid, 20),
        getEarningsSummary(user.uid, startDate),
        getEarningsTrend(user.uid, 6),
      ]);

      setWallet(walletData);
      setEarnings(earningsData);
      setStats({
        totalEarned: summaryData.netEarnings,
        pending: summaryData.pendingEarnings,
        available: summaryData.availableEarnings,
        withdrawn: summaryData.withdrawnAmount,
      });
      setChartData(trendData);
    } catch (error) {
      console.error('Error fetching earnings data:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.uid, selectedPeriod]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribeWallet = subscribeToWallet(user.uid, (newWallet) => {
      if (newWallet) {
        setWallet(newWallet);
      }
    });

    const unsubscribeEarnings = subscribeToEarnings(user.uid, (newEarnings) => {
      setEarnings(newEarnings);
    });

    return () => {
      unsubscribeWallet();
      unsubscribeEarnings();
    };
  }, [user?.uid]);

  useEffect(() => {
    fetchEarningsData();
  }, [fetchEarningsData]);

  useEffect(() => {
    if (!loading) {
      Animated.stagger(100, [
        Animated.timing(headerAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(periodAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(statsAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(chartAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(transactionsAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loading]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchEarningsData();
    setRefreshing(false);
  }, [fetchEarningsData]);

  const formatCurrency = (amount: number): string => {
    return `PKR ${amount.toLocaleString()}`;
  };

  const formatDate = (timestamp: any): string => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'AVAILABLE':
        return theme.colors.status.success;
      case 'PENDING':
        return theme.colors.status.warning;
      case 'WITHDRAWN':
        return theme.colors.status.info;
      case 'ON_HOLD':
        return theme.colors.status.error;
      default:
        return theme.colors.text.secondary;
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'AVAILABLE':
        return 'Available';
      case 'PENDING':
        return 'Pending';
      case 'WITHDRAWN':
        return 'Withdrawn';
      case 'ON_HOLD':
        return 'On Hold';
      default:
        return status;
    }
  };

  const handlePeriodChange = (period: PeriodType) => {
    setSelectedPeriod(period);
  };

  const handleTransactionPress = (earning: Earning) => {
    if (earning.caseId) {
      navigation.navigate('CaseDetail', { caseId: earning.caseId });
    }
  };

  const handleWithdraw = () => {
    navigation.navigate('Wallet');
  };

  // Calculate max amount for chart scaling
  const maxChartAmount = chartData.length > 0
    ? Math.max(...chartData.map(bar => bar.amount), 1)
    : 1;

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.brand.primary} />
          <Text variant="bodyMedium" color="secondary" style={{ marginTop: 16 }}>
            Loading earnings...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      {/* Header with Total Earnings Card */}
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
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text variant="h3" style={styles.headerTitle}>
              Earnings
            </Text>
            <TouchableOpacity
              style={styles.moreButton}
              onPress={() => navigation.navigate('Transactions')}
            >
              <Ionicons name="receipt-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Total Earnings Card */}
          <View style={styles.totalEarningsCard}>
            <View style={styles.totalEarningsIconContainer}>
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)']}
                style={styles.totalEarningsIcon}
              >
                <Ionicons name="wallet" size={32} color="#FFFFFF" />
              </LinearGradient>
            </View>
            <Text variant="bodySmall" style={styles.totalEarningsLabel}>
              Available Balance
            </Text>
            <Text variant="displayMedium" style={styles.totalEarningsValue}>
              {formatCurrency(wallet?.availableBalance || 0)}
            </Text>
            <TouchableOpacity
              style={styles.withdrawButton}
              onPress={handleWithdraw}
            >
              <Ionicons name="arrow-down-circle" size={18} color="#1a365d" />
              <Text variant="labelMedium" style={styles.withdrawButtonText}>
                Withdraw Funds
              </Text>
            </TouchableOpacity>
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
        {/* Period Selector */}
        <Animated.View
          style={{
            opacity: periodAnim,
            transform: [{
              translateY: periodAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            }],
          }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.periodSelector}
            contentContainerStyle={styles.periodSelectorContent}
          >
            {PERIODS.map((period) => (
              <TouchableOpacity
                key={period.id}
                style={[
                  styles.periodButton,
                  selectedPeriod === period.id && {
                    backgroundColor: theme.colors.brand.primary,
                  },
                  selectedPeriod !== period.id && {
                    backgroundColor: theme.colors.surface.primary,
                  },
                ]}
                onPress={() => handlePeriodChange(period.id)}
                activeOpacity={0.7}
              >
                <Text
                  variant="labelMedium"
                  style={[
                    selectedPeriod === period.id
                      ? styles.periodButtonTextActive
                      : { color: theme.colors.text.secondary },
                  ]}
                >
                  {period.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Stats Row */}
        <Animated.View
          style={[
            styles.statsRow,
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
          <Card variant="elevated" style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#4CAF5020' }]}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            </View>
            <Text variant="caption" color="secondary" style={styles.statLabel}>
              Total Earned
            </Text>
            <Text variant="h4" color="primary" style={styles.statValue}>
              {formatCurrency(wallet?.totalEarned || 0)}
            </Text>
          </Card>

          <Card variant="elevated" style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#FF980020' }]}>
              <Ionicons name="time" size={20} color="#FF9800" />
            </View>
            <Text variant="caption" color="secondary" style={styles.statLabel}>
              Pending
            </Text>
            <Text variant="h4" color="primary" style={styles.statValue}>
              {formatCurrency(wallet?.pendingBalance || 0)}
            </Text>
          </Card>

          <Card variant="elevated" style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#2196F320' }]}>
              <Ionicons name="arrow-down-circle" size={20} color="#2196F3" />
            </View>
            <Text variant="caption" color="secondary" style={styles.statLabel}>
              Withdrawn
            </Text>
            <Text variant="h4" color="primary" style={styles.statValue}>
              {formatCurrency(wallet?.totalWithdrawn || 0)}
            </Text>
          </Card>
        </Animated.View>

        {/* Earnings Chart */}
        <Animated.View
          style={{
            opacity: chartAnim,
            transform: [{
              translateY: chartAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            }],
          }}
        >
          <View style={styles.sectionHeader}>
            <Text variant="h4" color="primary">Earnings Overview</Text>
            <TouchableOpacity>
              <Ionicons name="information-circle-outline" size={20} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <Card variant="elevated" style={styles.chartCard}>
            {chartData.length > 0 ? (
              <>
                <View style={styles.chart}>
                  {chartData.map((bar, index) => {
                    const barHeight = (bar.amount / maxChartAmount) * 120;
                    const monthLabel = bar.period.split('-')[1];
                    return (
                      <View key={index} style={styles.chartBarContainer}>
                        <View style={styles.chartBarWrapper}>
                          <View
                            style={[
                              styles.chartBar,
                              {
                                height: Math.max(barHeight, 4),
                                backgroundColor: theme.colors.brand.primary,
                              },
                            ]}
                          />
                        </View>
                        <Text variant="caption" color="secondary" style={styles.chartLabel}>
                          {monthLabel}
                        </Text>
                      </View>
                    );
                  })}
                </View>
                <View style={styles.chartLegend}>
                  <View style={styles.chartLegendItem}>
                    <View style={[styles.chartLegendDot, { backgroundColor: theme.colors.brand.primary }]} />
                    <Text variant="caption" color="secondary">Monthly Earnings</Text>
                  </View>
                  <Text variant="caption" color="secondary">
                    Max: {formatCurrency(maxChartAmount)}
                  </Text>
                </View>
              </>
            ) : (
              <View style={styles.emptyChart}>
                <Ionicons name="bar-chart-outline" size={48} color={theme.colors.text.tertiary} />
                <Text variant="bodyMedium" color="secondary" style={{ marginTop: 12 }}>
                  No earnings data yet
                </Text>
              </View>
            )}
          </Card>
        </Animated.View>

        {/* Recent Transactions */}
        <Animated.View
          style={{
            opacity: transactionsAnim,
            transform: [{
              translateY: transactionsAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            }],
          }}
        >
          <View style={styles.sectionHeader}>
            <Text variant="h4" color="primary">Recent Earnings</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
              <Text variant="labelMedium" color="link">View All</Text>
            </TouchableOpacity>
          </View>

          {earnings.length > 0 ? (
            earnings.map((earning, index) => (
              <Card
                key={earning.id || index}
                variant="elevated"
                style={[
                  styles.transactionCard,
                  index === earnings.length - 1 && styles.lastTransactionCard
                ]}
                onPress={() => handleTransactionPress(earning)}
              >
                <View style={styles.transactionContent}>
                  <View style={styles.transactionLeft}>
                    <View style={[
                      styles.transactionIcon,
                      { backgroundColor: `${getStatusColor(earning.status)}20` }
                    ]}>
                      <Ionicons
                        name={
                          earning.status === 'AVAILABLE'
                            ? 'checkmark-circle'
                            : earning.status === 'PENDING'
                            ? 'time'
                            : 'sync'
                        }
                        size={20}
                        color={getStatusColor(earning.status)}
                      />
                    </View>
                    <View style={styles.transactionDetails}>
                      <Text variant="labelLarge" color="primary">
                        {earning.description}
                      </Text>
                      <Text variant="bodySmall" color="secondary" numberOfLines={1}>
                        {earning.clientName || 'Client'}
                      </Text>
                      <Text variant="caption" color="secondary" style={styles.transactionDate}>
                        {formatDate(earning.createdAt)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.transactionRight}>
                    <Text variant="labelLarge" color="primary" style={styles.transactionAmount}>
                      {formatCurrency(earning.netAmount)}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: `${getStatusColor(earning.status)}20` }
                      ]}
                    >
                      <Text
                        variant="caption"
                        style={[
                          styles.statusBadgeText,
                          { color: getStatusColor(earning.status) }
                        ]}
                      >
                        {getStatusLabel(earning.status)}
                      </Text>
                    </View>
                  </View>
                </View>
              </Card>
            ))
          ) : (
            <Card variant="elevated" style={styles.emptyCard}>
              <View style={styles.emptyContent}>
                <Ionicons name="cash-outline" size={48} color={theme.colors.text.tertiary} />
                <Text variant="bodyMedium" color="secondary" style={{ marginTop: 12 }}>
                  No earnings yet
                </Text>
                <Text variant="caption" color="tertiary" style={{ marginTop: 4, textAlign: 'center' }}>
                  Start accepting cases to earn money
                </Text>
              </View>
            </Card>
          )}
        </Animated.View>

        {/* Bottom Spacing */}
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
    paddingBottom: 140,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    marginBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalEarningsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  totalEarningsIconContainer: {
    marginBottom: 16,
  },
  totalEarningsIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalEarningsLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
  },
  totalEarningsValue: {
    color: '#FFFFFF',
    marginBottom: 16,
  },
  withdrawButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  withdrawButtonText: {
    color: '#1a365d',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    marginTop: -100,
  },
  contentContainer: {
    paddingHorizontal: 20,
  },
  periodSelector: {
    marginBottom: 20,
    marginHorizontal: -20,
  },
  periodSelectorContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  periodButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statLabel: {
    marginBottom: 4,
    textAlign: 'center',
  },
  statValue: {
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartCard: {
    padding: 20,
    marginBottom: 24,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 160,
    marginBottom: 16,
  },
  chartBarContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  chartBarWrapper: {
    width: '100%',
    height: 120,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  chartBar: {
    width: '70%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    minHeight: 4,
  },
  chartLabel: {
    marginTop: 8,
    textAlign: 'center',
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  chartLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chartLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyChart: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  transactionCard: {
    padding: 16,
    marginBottom: 12,
  },
  lastTransactionCard: {
    marginBottom: 0,
  },
  transactionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionDetails: {
    flex: 1,
    marginLeft: 12,
  },
  transactionDate: {
    marginTop: 4,
  },
  transactionRight: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  transactionAmount: {
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  emptyCard: {
    padding: 32,
  },
  emptyContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default LawyerEarningsScreen;
