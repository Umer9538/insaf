/**
 * INSAF - Available Cases Screen for Lawyers
 *
 * Shows cases available for lawyers to bid on
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Dimensions,
  RefreshControl,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { Text } from '../../components/common/Text';
import { Card } from '../../components/common/Card';
import {
  getAvailableCases,
  Case,
  AreaOfLaw,
} from '../../services/case.service';
import { getBidCountForCase } from '../../services/bid.service';

const { width } = Dimensions.get('window');

// Area of Law filter options
const AREA_OF_LAW_FILTERS = [
  { id: 'ALL', label: 'All', value: undefined },
  { id: 'FAMILY_LAW', label: 'Family Law', value: 'FAMILY_LAW' as AreaOfLaw },
  { id: 'CRIMINAL_LAW', label: 'Criminal', value: 'CRIMINAL_LAW' as AreaOfLaw },
  { id: 'CIVIL_LAW', label: 'Civil', value: 'CIVIL_LAW' as AreaOfLaw },
  { id: 'CORPORATE_LAW', label: 'Corporate', value: 'CORPORATE_LAW' as AreaOfLaw },
  { id: 'PROPERTY_LAW', label: 'Property', value: 'PROPERTY_LAW' as AreaOfLaw },
  { id: 'LABOR_LAW', label: 'Labor', value: 'LABOR_LAW' as AreaOfLaw },
  { id: 'TAX_LAW', label: 'Tax', value: 'TAX_LAW' as AreaOfLaw },
  { id: 'BANKING_LAW', label: 'Banking', value: 'BANKING_LAW' as AreaOfLaw },
  { id: 'CYBER_LAW', label: 'Cyber', value: 'CYBER_LAW' as AreaOfLaw },
];

// Format area of law for display
const formatAreaOfLaw = (areaOfLaw: AreaOfLaw): string => {
  const mapping: Record<AreaOfLaw, string> = {
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
  return mapping[areaOfLaw] || areaOfLaw;
};

// Format budget range
const formatBudget = (min: number, max: number): string => {
  return `PKR ${min.toLocaleString()} - ${max.toLocaleString()}`;
};

// Case with bid count
interface CaseWithBidCount extends Case {
  bidCount: number;
}

export const AvailableCasesScreen: React.FC = () => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  // State
  const [cases, setCases] = useState<CaseWithBidCount[]>([]);
  const [filteredCases, setFilteredCases] = useState<CaseWithBidCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');

  // Animations
  const headerAnim = useRef(new Animated.Value(0)).current;
  const searchAnim = useRef(new Animated.Value(0)).current;
  const filterAnim = useRef(new Animated.Value(0)).current;

  // Load cases
  const loadCases = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);

      // Get selected area of law filter
      const filter = AREA_OF_LAW_FILTERS.find((f) => f.id === selectedFilter);
      const areaOfLawFilter = filter?.value;

      // Fetch cases
      const fetchedCases = await getAvailableCases(areaOfLawFilter);

      // Fetch bid counts for each case
      const casesWithBidCounts = await Promise.all(
        fetchedCases.map(async (caseItem) => {
          const bidCount = await getBidCountForCase(caseItem.id!);
          return {
            ...caseItem,
            bidCount,
          };
        })
      );

      setCases(casesWithBidCounts);
      setFilteredCases(casesWithBidCounts);
    } catch (error) {
      console.error('Error loading cases:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadCases();
  }, [selectedFilter]);

  // Entrance animations
  useEffect(() => {
    Animated.stagger(100, [
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(searchAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(filterAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Search filter
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCases(cases);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = cases.filter(
        (caseItem) =>
          caseItem.title.toLowerCase().includes(query) ||
          caseItem.description.toLowerCase().includes(query) ||
          caseItem.location.toLowerCase().includes(query) ||
          formatAreaOfLaw(caseItem.areaOfLaw).toLowerCase().includes(query)
      );
      setFilteredCases(filtered);
    }
  }, [searchQuery, cases]);

  // Refresh handler
  const onRefresh = () => {
    setRefreshing(true);
    loadCases(false);
  };

  // Handle filter selection
  const handleFilterSelect = (filterId: string) => {
    setSelectedFilter(filterId);
  };

  // Handle view case details
  const handleViewCase = (caseItem: CaseWithBidCount) => {
    navigation.navigate('CaseDetail', { caseId: caseItem.id });
  };

  // Render filter chip
  const renderFilterChip = ({ item }: { item: typeof AREA_OF_LAW_FILTERS[0] }) => {
    const isSelected = selectedFilter === item.id;

    return (
      <TouchableOpacity
        style={[
          styles.filterChip,
          {
            backgroundColor: isSelected
              ? theme.colors.brand.primary
              : theme.colors.surface.primary,
            borderColor: isSelected
              ? theme.colors.brand.primary
              : theme.colors.border.default,
          },
        ]}
        onPress={() => handleFilterSelect(item.id)}
        activeOpacity={0.7}
      >
        <Text
          variant="labelSmall"
          style={{
            color: isSelected ? '#FFFFFF' : theme.colors.text.secondary,
          }}
        >
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  // Render case card
  const renderCaseCard = ({
    item,
    index,
  }: {
    item: CaseWithBidCount;
    index: number;
  }) => {
    const isUrgent = item.urgency === 'URGENT';

    return (
      <Card
        variant="elevated"
        animation="fadeInUp"
        animationDelay={index * 50}
        style={styles.caseCard}
      >
        {/* Header */}
        <View style={styles.caseHeader}>
          <View style={styles.caseHeaderLeft}>
            <View
              style={[
                styles.areaOfLawBadge,
                { backgroundColor: `${theme.colors.brand.primary}15` },
              ]}
            >
              <Text
                variant="caption"
                style={{ color: theme.colors.brand.primary }}
              >
                {formatAreaOfLaw(item.areaOfLaw)}
              </Text>
            </View>
            {isUrgent && (
              <View
                style={[
                  styles.urgencyBadge,
                  { backgroundColor: `${theme.colors.status.error}15` },
                ]}
              >
                <Ionicons
                  name="flash"
                  size={12}
                  color={theme.colors.status.error}
                />
                <Text
                  variant="caption"
                  style={{ color: theme.colors.status.error, marginLeft: 4 }}
                >
                  Urgent
                </Text>
              </View>
            )}
          </View>
          <Text variant="caption" color="secondary">
            {item.caseNumber}
          </Text>
        </View>

        {/* Title */}
        <Text
          variant="h4"
          color="primary"
          style={styles.caseTitle}
          numberOfLines={2}
        >
          {item.title}
        </Text>

        {/* Description */}
        <Text
          variant="bodySmall"
          color="secondary"
          numberOfLines={2}
          style={styles.caseDescription}
        >
          {item.description}
        </Text>

        {/* Info Row */}
        <View style={styles.caseInfoRow}>
          {/* Location */}
          <View style={styles.infoItem}>
            <Ionicons
              name="location-outline"
              size={14}
              color={theme.colors.text.secondary}
            />
            <Text variant="caption" color="secondary" style={styles.infoText}>
              {item.location}
            </Text>
          </View>

          {/* Budget */}
          <View style={styles.infoItem}>
            <Ionicons
              name="cash-outline"
              size={14}
              color={theme.colors.text.secondary}
            />
            <Text variant="caption" color="secondary" style={styles.infoText}>
              {formatBudget(item.budgetMin, item.budgetMax)}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.caseFooter}>
          {/* Bid Count */}
          <View style={styles.bidCountContainer}>
            <Ionicons
              name="hand-left-outline"
              size={16}
              color={theme.colors.brand.primary}
            />
            <Text
              variant="labelSmall"
              style={{ color: theme.colors.brand.primary, marginLeft: 6 }}
            >
              {item.bidCount} {item.bidCount === 1 ? 'bid' : 'bids'}
            </Text>
          </View>

          {/* View & Bid Button */}
          <TouchableOpacity
            style={[
              styles.viewBidButton,
              { backgroundColor: theme.colors.brand.primary },
            ]}
            onPress={() => handleViewCase(item)}
            activeOpacity={0.8}
          >
            <Text
              variant="labelMedium"
              style={{ color: '#FFFFFF', marginRight: 4 }}
            >
              View & Bid
            </Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  // Empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="briefcase-outline"
        size={64}
        color={theme.colors.text.disabled}
      />
      <Text variant="h4" color="secondary" style={styles.emptyTitle}>
        No Cases Available
      </Text>
      <Text variant="bodySmall" color="secondary" align="center">
        {searchQuery
          ? 'No cases match your search criteria'
          : 'Check back later for new case opportunities'}
      </Text>
    </View>
  );

  // List header
  const renderListHeader = () => (
    <View style={styles.listHeader}>
      <Text variant="labelMedium" color="secondary">
        {filteredCases.length} {filteredCases.length === 1 ? 'case' : 'cases'}{' '}
        available
      </Text>
    </View>
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background.primary },
      ]}
    >
      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 16,
            backgroundColor: theme.colors.surface.primary,
            opacity: headerAnim,
            transform: [
              {
                translateY: headerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.headerContent}>
          <View>
            <Text variant="h2" color="primary">
              Available Cases
            </Text>
            <Text variant="bodySmall" color="secondary">
              Find cases to bid on
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Search Bar */}
      <Animated.View
        style={[
          styles.searchContainer,
          {
            backgroundColor: theme.colors.background.primary,
            opacity: searchAnim,
            transform: [
              {
                translateY: searchAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: theme.colors.surface.primary,
              borderColor: theme.colors.border.default,
            },
          ]}
        >
          <Ionicons
            name="search"
            size={20}
            color={theme.colors.text.secondary}
          />
          <TextInput
            style={[
              styles.searchInput,
              { color: theme.colors.text.primary },
            ]}
            placeholder="Search cases..."
            placeholderTextColor={theme.colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons
                name="close-circle"
                size={20}
                color={theme.colors.text.secondary}
              />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      {/* Filter Chips */}
      <Animated.View
        style={[
          {
            opacity: filterAnim,
            transform: [
              {
                translateY: filterAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <FlatList
          horizontal
          data={AREA_OF_LAW_FILTERS}
          keyExtractor={(item) => item.id}
          renderItem={renderFilterChip}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          style={[
            styles.filterContainer,
            { backgroundColor: theme.colors.background.primary },
          ]}
        />
      </Animated.View>

      {/* Cases List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={theme.colors.brand.primary}
          />
          <Text variant="bodySmall" color="secondary" style={styles.loadingText}>
            Loading cases...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredCases}
          keyExtractor={(item) => item.id!}
          renderItem={renderCaseCard}
          ListHeaderComponent={renderListHeader}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={[
            styles.listContent,
            filteredCases.length === 0 && styles.listContentEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.brand.primary}
            />
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
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
  },
  filterContainer: {
    paddingBottom: 12,
  },
  filterList: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  listHeader: {
    paddingVertical: 8,
    marginBottom: 8,
  },
  caseCard: {
    marginBottom: 16,
    padding: 16,
  },
  caseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  caseHeaderLeft: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  areaOfLawBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  caseTitle: {
    marginBottom: 8,
  },
  caseDescription: {
    marginBottom: 12,
    lineHeight: 20,
  },
  caseInfoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    marginLeft: 6,
  },
  caseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  bidCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewBidButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
});

export default AvailableCasesScreen;
