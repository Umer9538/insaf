/**
 * INSAF - Cases Screen
 *
 * Manage and view all legal cases
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Animated,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { Text } from '../../components/common/Text';
import { useAuth } from '../../context/AuthContext';
import { getClientCases, Case, CaseStatus } from '../../services/case.service';
import { formatDistanceToNow } from 'date-fns';

const { width } = Dimensions.get('window');

// Display case interface
interface DisplayCase {
  id: string;
  caseNumber: string;
  title: string;
  description: string;
  status: string;
  category: string;
  lawyer: string | null;
  createdAt: string;
  updatedAt: string;
  bidsCount: number;
  budget: number;
}

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'bidding', label: 'Bidding' },
  { id: 'completed', label: 'Completed' },
];

const getStatusColor = (status: CaseStatus) => {
  switch (status) {
    case 'active': return '#4CAF50';
    case 'pending': return '#FF9800';
    case 'bidding': return '#2196F3';
    case 'completed': return '#9C27B0';
    case 'closed': return '#757575';
    default: return '#757575';
  }
};

const getStatusLabel = (status: CaseStatus) => {
  switch (status) {
    case 'active': return 'Active';
    case 'pending': return 'Pending';
    case 'bidding': return 'Accepting Bids';
    case 'completed': return 'Completed';
    case 'closed': return 'Closed';
    default: return status;
  }
};

export const CasesScreen: React.FC = () => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [cases, setCases] = useState<DisplayCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Animated values
  const headerAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;
  const tabsAnim = useRef(new Animated.Value(0)).current;

  // Fetch cases from Firebase
  const fetchCases = useCallback(async (showLoader = true) => {
    if (!user) return;

    if (showLoader) setIsLoading(true);
    try {
      const fetchedCases = await getClientCases(user.uid);

      // Transform to DisplayCase format
      const displayCases: DisplayCase[] = fetchedCases.map((c: Case) => ({
        id: c.id,
        caseNumber: c.caseNumber || `CASE-${c.id.slice(0, 6).toUpperCase()}`,
        title: c.title,
        description: c.description,
        status: c.status,
        category: c.areaOfLaw.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
        lawyer: c.assignedLawyerId || null,
        createdAt: c.createdAt?.toDate ? formatDistanceToNow(c.createdAt.toDate(), { addSuffix: true }) : 'Recently',
        updatedAt: c.updatedAt?.toDate ? formatDistanceToNow(c.updatedAt.toDate(), { addSuffix: true }) : 'Recently',
        bidsCount: c.bidCount || 0,
        budget: c.budgetMin || 0,
      }));

      setCases(displayCases);
    } catch (error) {
      console.error('Error fetching cases:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  // Fetch on focus
  useFocusEffect(
    useCallback(() => {
      fetchCases();
    }, [fetchCases])
  );

  // Handle refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCases(false);
  }, [fetchCases]);

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
      Animated.timing(tabsAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const filteredCases = activeTab === 'all'
    ? cases
    : cases.filter(c => c.status === activeTab);

  const renderCaseCard = ({ item, index }: { item: DisplayCase; index: number }) => {
    const statusColor = getStatusColor(item.status as CaseStatus);

    return (
      <View>
        <TouchableOpacity
          style={[styles.caseCard, { backgroundColor: theme.colors.surface.primary }]}
          onPress={() => navigation.navigate('CaseDetail', { caseId: item.id })}
          activeOpacity={0.7}
        >
          {/* Header */}
          <View style={styles.caseHeader}>
            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text variant="caption" style={{ color: statusColor }}>
                {getStatusLabel(item.status)}
              </Text>
            </View>
            <Text variant="caption" color="tertiary">{item.caseNumber}</Text>
          </View>

          {/* Title & Description */}
          <Text variant="h4" color="primary" style={styles.caseTitle}>
            {item.title}
          </Text>
          <Text variant="bodySmall" color="secondary" numberOfLines={2}>
            {item.description}
          </Text>

          {/* Category & Budget */}
          <View style={styles.metaRow}>
            <View style={styles.categoryBadge}>
              <Ionicons name="briefcase-outline" size={14} color={theme.colors.text.secondary} />
              <Text variant="caption" color="secondary"> {item.category}</Text>
            </View>
            <Text variant="labelMedium" color="brand">
              Rs. {item.budget.toLocaleString()}
            </Text>
          </View>

          {/* Footer */}
          <View style={styles.caseFooter}>
            {item.lawyer ? (
              <View style={styles.lawyerInfo}>
                <View style={styles.lawyerAvatar}>
                  <Ionicons name="person" size={14} color="#fff" />
                </View>
                <Text variant="labelSmall" color="secondary">{item.lawyer}</Text>
              </View>
            ) : item.bidsCount > 0 ? (
              <View style={styles.bidsInfo}>
                <Ionicons name="hand-left" size={14} color={theme.colors.brand.primary} />
                <Text variant="labelSmall" color="brand"> {item.bidsCount} bids received</Text>
              </View>
            ) : (
              <Text variant="caption" color="tertiary">No bids yet</Text>
            )}
            <Text variant="caption" color="tertiary">{item.updatedAt}</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
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
          <View>
            <Text variant="h2" style={styles.headerTitle}>My Cases</Text>
            <Text variant="bodySmall" style={styles.headerSubtitle}>
              Manage your legal matters
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('CreateCase')}
          >
            <Ionicons name="add" size={24} color="#1a365d" />
          </TouchableOpacity>
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
          <View style={styles.statItem}>
            <Text variant="h3" style={styles.statValue}>{cases.filter(c => c.status === 'active').length}</Text>
            <Text variant="caption" style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text variant="h3" style={styles.statValue}>{cases.filter(c => c.status === 'bidding').length}</Text>
            <Text variant="caption" style={styles.statLabel}>Bidding</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text variant="h3" style={styles.statValue}>{cases.filter(c => c.status === 'completed').length}</Text>
            <Text variant="caption" style={styles.statLabel}>Completed</Text>
          </View>
        </Animated.View>
      </LinearGradient>

      {/* Tabs */}
      <Animated.View
        style={[
          styles.tabsContainer,
          {
            opacity: tabsAnim,
            transform: [{
              translateY: tabsAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            }],
          }
        ]}
      >
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTab === tab.id && { backgroundColor: theme.colors.brand.primary },
            ]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text
              variant="labelMedium"
              style={{ color: activeTab === tab.id ? '#FFFFFF' : theme.colors.text.secondary }}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </Animated.View>

      {/* Cases List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.brand.primary} />
          <Text variant="bodySmall" color="secondary" style={{ marginTop: 12 }}>
            Loading your cases...
          </Text>
        </View>
      ) : (
      <FlatList
        data={filteredCases}
        keyExtractor={(item) => item.id}
        renderItem={renderCaseCard}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.brand.primary}
            colors={[theme.colors.brand.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={64} color={theme.colors.text.tertiary} />
            <Text variant="h4" color="secondary" style={styles.emptyTitle}>
              No cases found
            </Text>
            <Text variant="bodySmall" color="tertiary" style={styles.emptyText}>
              Create a new case to get started with your legal matter
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate('CreateCase')}
            >
              <LinearGradient
                colors={['#d4af37', '#f4d03f']}
                style={styles.createButtonGradient}
              >
                <Ionicons name="add" size={20} color="#1a365d" />
                <Text variant="labelMedium" style={{ color: '#1a365d', marginLeft: 8 }}>
                  Create New Case
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        }
      />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#d4af37',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: '#FFFFFF',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 10,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  caseCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  caseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  caseTitle: {
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
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
  bidsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    marginTop: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 8,
  },
  createButton: {
    marginTop: 24,
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
  },
});

export default CasesScreen;
