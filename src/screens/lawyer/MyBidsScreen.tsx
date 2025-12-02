/**
 * INSAF - My Bids Screen (Lawyer)
 *
 * Shows all bids submitted by the lawyer with filtering by status
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Animated,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Text } from '../../components/common/Text';
import { Card } from '../../components/common/Card';
import { getBidsByLawyer, withdrawBid, Bid, BidStatus } from '../../services/bid.service';
import { getCaseById, Case, AreaOfLaw } from '../../services/case.service';

const { width } = Dimensions.get('window');

// Tab filter types
type TabFilter = 'All' | 'Pending' | 'Accepted' | 'Rejected';

// Bid with case details
interface BidWithCase extends Bid {
  caseData?: Case;
}

// Area of law labels
const AREA_OF_LAW_LABELS: Record<AreaOfLaw, string> = {
  FAMILY_LAW: 'Family Law',
  CRIMINAL_LAW: 'Criminal Law',
  CIVIL_LAW: 'Civil Law',
  CORPORATE_LAW: 'Corporate Law',
  PROPERTY_LAW: 'Property Law',
  LABOR_LAW: 'Labor Law',
  TAX_LAW: 'Tax Law',
  CONSTITUTIONAL_LAW: 'Constitutional Law',
  BANKING_LAW: 'Banking Law',
  CYBER_LAW: 'Cyber Law',
  OTHER: 'Other',
};

export const MyBidsScreen: React.FC = () => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  // State
  const [activeTab, setActiveTab] = useState<TabFilter>('All');
  const [bids, setBids] = useState<BidWithCase[]>([]);
  const [filteredBids, setFilteredBids] = useState<BidWithCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Load bids
  const loadBids = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const lawyerBids = await getBidsByLawyer(user.uid);

      // Fetch case details for each bid
      const bidsWithCases = await Promise.all(
        lawyerBids.map(async (bid) => {
          try {
            const caseData = await getCaseById(bid.caseId);
            return { ...bid, caseData: caseData || undefined };
          } catch (error) {
            console.error(`Error fetching case ${bid.caseId}:`, error);
            return { ...bid };
          }
        })
      );

      setBids(bidsWithCases);
    } catch (error) {
      console.error('Error loading bids:', error);
      Alert.alert('Error', 'Failed to load bids. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.uid]);

  // Initial load
  useEffect(() => {
    loadBids();
  }, [loadBids]);

  // Animate on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Filter bids by active tab
  useEffect(() => {
    let filtered = bids;

    if (activeTab !== 'All') {
      const statusMap: Record<Exclude<TabFilter, 'All'>, BidStatus[]> = {
        Pending: ['PENDING'],
        Accepted: ['ACCEPTED'],
        Rejected: ['REJECTED', 'WITHDRAWN'],
      };

      filtered = bids.filter((bid) =>
        statusMap[activeTab as Exclude<TabFilter, 'All'>].includes(bid.status)
      );
    }

    setFilteredBids(filtered);
  }, [bids, activeTab]);

  // Refresh handler
  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadBids();
  }, [loadBids]);

  // Withdraw bid handler
  const handleWithdrawBid = useCallback((bidId: string) => {
    Alert.alert(
      'Withdraw Bid',
      'Are you sure you want to withdraw this bid? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!user?.uid) return;
              await withdrawBid(bidId, user.uid);
              Alert.alert('Success', 'Bid withdrawn successfully');
              loadBids();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to withdraw bid');
            }
          },
        },
      ]
    );
  }, [user?.uid, loadBids]);

  // Navigate to case detail
  const handleViewCase = useCallback((caseId: string) => {
    navigation.navigate('CaseDetail', { caseId });
  }, [navigation]);

  // Get status badge config
  const getStatusBadge = (status: BidStatus) => {
    const configs = {
      PENDING: { label: 'Pending', color: '#FF9800', bgColor: '#FF980020' },
      ACCEPTED: { label: 'Accepted', color: '#4CAF50', bgColor: '#4CAF5020' },
      REJECTED: { label: 'Rejected', color: '#F44336', bgColor: '#F4433620' },
      WITHDRAWN: { label: 'Withdrawn', color: '#9E9E9E', bgColor: '#9E9E9E20' },
    };
    return configs[status];
  };

  // Format date
  const formatDate = (date: any): string => {
    if (!date) return 'N/A';

    let dateObj: Date;
    if (date.toDate) {
      dateObj = date.toDate();
    } else if (date instanceof Date) {
      dateObj = date;
    } else {
      dateObj = new Date(date);
    }

    const now = new Date();
    const diff = now.getTime() - dateObj.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: dateObj.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  // Render bid card
  const renderBidCard = ({ item, index }: { item: BidWithCase; index: number }) => {
    const statusBadge = getStatusBadge(item.status);
    const isPending = item.status === 'PENDING';

    // Animation for list items
    const itemAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.timing(itemAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }).start();
    }, []);

    return (
      <Animated.View
        style={{
          opacity: itemAnim,
          transform: [{
            translateY: itemAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            }),
          }],
        }}
      >
        <Card variant="elevated" style={styles.bidCard}>
          {/* Header */}
          <View style={styles.bidHeader}>
            <View style={[styles.statusBadge, { backgroundColor: statusBadge.bgColor }]}>
              <Text variant="caption" style={{ color: statusBadge.color, fontWeight: '600' }}>
                {statusBadge.label}
              </Text>
            </View>
            <Text variant="caption" color="secondary">
              {formatDate(item.createdAt)}
            </Text>
          </View>

          {/* Case Title */}
          <Text variant="h4" color="primary" style={styles.caseTitle}>
            {item.caseData?.title || 'Case Details Unavailable'}
          </Text>

          {/* Area of Law */}
          {item.caseData?.areaOfLaw && (
            <View style={styles.areaOfLawContainer}>
              <Ionicons
                name="briefcase-outline"
                size={14}
                color={theme.colors.text.secondary}
              />
              <Text variant="bodySmall" color="secondary" style={styles.areaOfLawText}>
                {AREA_OF_LAW_LABELS[item.caseData.areaOfLaw]}
              </Text>
            </View>
          )}

          {/* Bid Details */}
          <View style={styles.bidDetailsRow}>
            <View style={styles.bidDetail}>
              <Ionicons
                name="cash-outline"
                size={16}
                color={theme.colors.brand.primary}
              />
              <Text variant="labelMedium" color="primary" style={styles.bidDetailText}>
                PKR {item.proposedFee.toLocaleString()}
                {item.feeType === 'HOURLY' && '/hr'}
              </Text>
            </View>
            <View style={styles.bidDetail}>
              <Ionicons
                name="time-outline"
                size={16}
                color={theme.colors.brand.primary}
              />
              <Text variant="labelMedium" color="primary" style={styles.bidDetailText}>
                {item.estimatedTimeline}
              </Text>
            </View>
          </View>

          {/* Proposal Preview */}
          {item.proposalText && (
            <Text
              variant="bodySmall"
              color="secondary"
              numberOfLines={2}
              style={styles.proposalPreview}
            >
              {item.proposalText}
            </Text>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.viewButton,
                { backgroundColor: theme.colors.brand.primary },
              ]}
              onPress={() => handleViewCase(item.caseId)}
              activeOpacity={0.7}
            >
              <Ionicons name="eye-outline" size={18} color="#FFFFFF" />
              <Text variant="labelMedium" style={styles.buttonText}>
                View Case
              </Text>
            </TouchableOpacity>

            {isPending && (
              <>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.editButton,
                    { borderColor: theme.colors.brand.primary },
                  ]}
                  onPress={() => {
                    Alert.alert('Edit Bid', 'Edit functionality coming soon');
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="create-outline"
                    size={18}
                    color={theme.colors.brand.primary}
                  />
                  <Text
                    variant="labelMedium"
                    style={[styles.buttonText, { color: theme.colors.brand.primary }]}
                  >
                    Edit
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.withdrawButton,
                    { borderColor: '#F44336' },
                  ]}
                  onPress={() => item.id && handleWithdrawBid(item.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close-circle-outline" size={18} color="#F44336" />
                  <Text
                    variant="labelMedium"
                    style={[styles.buttonText, { color: '#F44336' }]}
                  >
                    Withdraw
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </Card>
      </Animated.View>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconContainer, { backgroundColor: theme.colors.surface.secondary }]}>
        <Ionicons
          name="hand-left-outline"
          size={48}
          color={theme.colors.text.tertiary}
        />
      </View>
      <Text variant="h3" color="primary" style={styles.emptyTitle}>
        No {activeTab !== 'All' ? activeTab : ''} Bids
      </Text>
      <Text variant="bodyMedium" color="secondary" style={styles.emptyMessage}>
        {activeTab === 'All'
          ? "You haven't submitted any bids yet. Browse available cases to get started."
          : `You don't have any ${activeTab.toLowerCase()} bids at the moment.`
        }
      </Text>
      {activeTab === 'All' && (
        <TouchableOpacity
          style={[styles.browseCasesButton, { backgroundColor: theme.colors.brand.primary }]}
          onPress={() => navigation.navigate('CasesTab')}
          activeOpacity={0.8}
        >
          <Ionicons name="search" size={20} color="#FFFFFF" />
          <Text variant="labelLarge" style={styles.browseCasesText}>
            Browse Cases
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Render tab button
  const renderTabButton = (tab: TabFilter) => {
    const isActive = activeTab === tab;
    const count = tab === 'All'
      ? bids.length
      : bids.filter((bid) => {
          if (tab === 'Pending') return bid.status === 'PENDING';
          if (tab === 'Accepted') return bid.status === 'ACCEPTED';
          if (tab === 'Rejected') return bid.status === 'REJECTED' || bid.status === 'WITHDRAWN';
          return false;
        }).length;

    return (
      <TouchableOpacity
        key={tab}
        style={[
          styles.tabButton,
          isActive && [
            styles.tabButtonActive,
            { backgroundColor: theme.colors.brand.primary },
          ],
          !isActive && { backgroundColor: theme.colors.surface.primary },
        ]}
        onPress={() => setActiveTab(tab)}
        activeOpacity={0.7}
      >
        <Text
          variant="labelMedium"
          style={[
            styles.tabButtonText,
            isActive
              ? { color: '#FFFFFF' }
              : { color: theme.colors.text.secondary },
          ]}
        >
          {tab} {count > 0 && `(${count})`}
        </Text>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <Text variant="h2" color="primary">My Bids</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.brand.primary} />
          <Text variant="bodyMedium" color="secondary" style={styles.loadingText}>
            Loading your bids...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text variant="h2" color="primary">My Bids</Text>
        <Text variant="bodySmall" color="secondary" style={styles.subtitle}>
          {bids.length} {bids.length === 1 ? 'bid' : 'bids'} submitted
        </Text>
      </View>

      {/* Tab Filters */}
      <Animated.View
        style={[
          styles.tabContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {(['All', 'Pending', 'Accepted', 'Rejected'] as TabFilter[]).map(renderTabButton)}
      </Animated.View>

      {/* Bid List */}
      <FlatList
        data={filteredBids}
        renderItem={renderBidCard}
        keyExtractor={(item) => item.id || `${item.caseId}-${item.lawyerId}`}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.brand.primary}
            colors={[theme.colors.brand.primary]}
          />
        }
        ListEmptyComponent={renderEmptyState}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  subtitle: {
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabButtonActive: {
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  tabButtonText: {
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  bidCard: {
    marginBottom: 16,
    padding: 16,
  },
  bidHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  caseTitle: {
    marginBottom: 8,
  },
  areaOfLawContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  areaOfLawText: {
    marginLeft: 4,
  },
  bidDetailsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  bidDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bidDetailText: {
    marginLeft: 4,
  },
  proposalPreview: {
    marginBottom: 12,
    lineHeight: 18,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  viewButton: {
    flex: 1.2,
  },
  editButton: {
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  withdrawButton: {
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  buttonText: {
    color: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 80,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  browseCasesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  browseCasesText: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    marginTop: 8,
  },
});

export default MyBidsScreen;
