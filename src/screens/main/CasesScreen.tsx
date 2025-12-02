/**
 * INSAF - Cases Screen
 *
 * Manage and view all legal cases
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { Text } from '../../components/common/Text';

const { width } = Dimensions.get('window');

// Case Status Types
type CaseStatus = 'active' | 'pending' | 'bidding' | 'completed' | 'closed';

// Sample Cases Data
const CASES = [
  {
    id: '1',
    caseNumber: 'INS-2024-001',
    title: 'Property Dispute Resolution',
    description: 'Land ownership dispute in Lahore regarding inherited property rights.',
    status: 'active' as CaseStatus,
    category: 'Property Law',
    lawyer: 'Adv. Ahmad Khan',
    createdAt: '2024-01-15',
    updatedAt: '2 hours ago',
    bidsCount: 0,
    budget: 50000,
  },
  {
    id: '2',
    caseNumber: 'INS-2024-002',
    title: 'Corporate Contract Review',
    description: 'Need lawyer to review and negotiate business partnership agreement terms.',
    status: 'bidding' as CaseStatus,
    category: 'Corporate Law',
    lawyer: null,
    createdAt: '2024-01-20',
    updatedAt: '1 day ago',
    bidsCount: 5,
    budget: 30000,
  },
  {
    id: '3',
    caseNumber: 'INS-2024-003',
    title: 'Family Custody Matter',
    description: 'Child custody arrangement after separation. Need experienced family lawyer.',
    status: 'pending' as CaseStatus,
    category: 'Family Law',
    lawyer: null,
    createdAt: '2024-01-22',
    updatedAt: '3 days ago',
    bidsCount: 8,
    budget: 40000,
  },
  {
    id: '4',
    caseNumber: 'INS-2023-089',
    title: 'Criminal Defense Case',
    description: 'Defense representation for fraud allegations.',
    status: 'completed' as CaseStatus,
    category: 'Criminal Law',
    lawyer: 'Adv. Bilal Ahmed',
    createdAt: '2023-11-10',
    updatedAt: '2 weeks ago',
    bidsCount: 0,
    budget: 80000,
  },
];

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
  const [activeTab, setActiveTab] = useState('all');

  // Animated values
  const headerAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;
  const tabsAnim = useRef(new Animated.Value(0)).current;

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
    ? CASES
    : CASES.filter(c => c.status === activeTab);

  const renderCaseCard = ({ item, index }: { item: typeof CASES[0]; index: number }) => {
    const statusColor = getStatusColor(item.status);

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
            <Text variant="h3" style={styles.statValue}>{CASES.filter(c => c.status === 'active').length}</Text>
            <Text variant="caption" style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text variant="h3" style={styles.statValue}>{CASES.filter(c => c.status === 'bidding').length}</Text>
            <Text variant="caption" style={styles.statLabel}>Bidding</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text variant="h3" style={styles.statValue}>{CASES.filter(c => c.status === 'completed').length}</Text>
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
      <FlatList
        data={filteredCases}
        keyExtractor={(item) => item.id}
        renderItem={renderCaseCard}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
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
