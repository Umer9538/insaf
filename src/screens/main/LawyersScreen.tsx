/**
 * INSAF - Lawyers Screen
 * 
 * Browse and search for verified lawyers
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Animated,
  ActivityIndicator,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { Text } from '../../components/common/Text';
import { getVerifiedLawyers, LawyerProfile, searchLawyersBySpecialization } from '../../services/lawyer.service';

const { width } = Dimensions.get('window');

// Lawyer Categories
const CATEGORIES = [
  { id: 'all', name: 'All', icon: 'grid-outline' },
  { id: 'CRIMINAL', name: 'Criminal', icon: 'shield-checkmark-outline' },
  { id: 'FAMILY_LAW', name: 'Family', icon: 'people-outline' },
  { id: 'CORPORATE', name: 'Corporate', icon: 'business-outline' },
  { id: 'REAL_ESTATE', name: 'Property', icon: 'home-outline' },
  { id: 'CIVIL_LITIGATION', name: 'Civil', icon: 'document-text-outline' },
];

export const LawyersScreen: React.FC = () => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [lawyers, setLawyers] = useState<LawyerProfile[]>([]);
  const [filteredLawyers, setFilteredLawyers] = useState<LawyerProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchLawyers();
  }, [activeCategory]);

  const fetchLawyers = async () => {
    setLoading(true);
    try {
      console.log('Fetching lawyers for category:', activeCategory);
      let data: LawyerProfile[] = [];
      if (activeCategory === 'all') {
        data = await getVerifiedLawyers();
      } else {
        data = await searchLawyersBySpecialization(activeCategory as any);
      }
      console.log('Fetched lawyers count:', data.length);
      console.log('Sample lawyer data:', data[0]); // Log first item to check fields
      setLawyers(data);
      setFilteredLawyers(data);
    } catch (error) {
      console.error('Error fetching lawyers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredLawyers(lawyers);
    } else {
      const filtered = lawyers.filter(lawyer =>
        lawyer.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lawyer.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredLawyers(filtered);
    }
  }, [searchQuery, lawyers]);

  const renderLawyerCard = ({ item, index }: { item: LawyerProfile; index: number }) => {
    const inputRange = [
      -1,
      0,
      (120 + 16) * index,
      (120 + 16) * (index + 2),
    ];

    const opacity = scrollY.interpolate({
      inputRange,
      outputRange: [1, 1, 1, 0],
    });

    const scale = scrollY.interpolate({
      inputRange,
      outputRange: [1, 1, 1, 0.9],
    });

    return (
      <Animated.View style={{ opacity, transform: [{ scale }] }}>
        <TouchableOpacity
          style={[styles.card, { backgroundColor: theme.colors.surface.primary }]}
          onPress={() => navigation.navigate('LawyerDetail', { lawyerId: item.userId })}
          activeOpacity={0.9}
        >
          <View style={styles.cardContent}>
            {/* Image */}
            <View style={styles.imageContainer}>
              {item.profileImage ? (
                <Image source={{ uri: item.profileImage }} style={styles.image} />
              ) : (
                <View style={[styles.placeholderImage, { backgroundColor: theme.colors.surface.secondary }]}>
                  <Ionicons name="person" size={24} color={theme.colors.text.secondary} />
                </View>
              )}
              {item.verificationStatus === 'VERIFIED' && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                </View>
              )}
            </View>

            {/* Info */}
            <View style={styles.infoContainer}>
              <View style={styles.headerRow}>
                <Text variant="h4" color="primary" numberOfLines={1} style={styles.name}>
                  {item.fullName}
                </Text>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={14} color="#F4B400" />
                  <Text variant="labelMedium" color="primary" style={styles.ratingText}>
                    {item.ratingAverage?.toFixed(1) || 'N/A'}
                  </Text>
                  <Text variant="caption" color="secondary" style={styles.reviewsText}>
                    ({item.totalReviews})
                  </Text>
                </View>
              </View>

              <Text variant="bodySmall" color="brand" style={styles.specialty}>
                {typeof item.specializations?.[0] === 'string'
                  ? item.specializations[0].replace(/_/g, ' ')
                  : 'General Practice'}
              </Text>

              <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                  <Ionicons name="briefcase-outline" size={14} color={theme.colors.text.secondary} />
                  <Text variant="caption" color="secondary" style={styles.detailText}>
                    {item.experienceYears}+ Years
                  </Text>
                </View>
                <View style={styles.dotSeparator} />
                <View style={styles.detailItem}>
                  <Ionicons name="people-outline" size={14} color={theme.colors.text.secondary} />
                  <Text variant="caption" color="secondary" style={styles.detailText}>
                    {item.followerCount || 0} Followers
                  </Text>
                </View>
              </View>

              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={14} color={theme.colors.text.tertiary} />
                <Text variant="caption" color="tertiary" numberOfLines={1} style={styles.locationText}>
                  {item.serviceAreas?.[0] || 'Pakistan'}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <LinearGradient
        colors={[theme.colors.background.primary, theme.colors.surface.secondary]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.3 }}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text variant="h3" color="primary">Find Lawyers</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface.primary }]}>
          <Ionicons name="search" size={20} color={theme.colors.text.tertiary} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text.primary }]}
            placeholder="Search by name, specialty, or email..."
            placeholderTextColor={theme.colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Categories */}
        <FlatList
          data={CATEGORIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryItem,
                {
                  backgroundColor: activeCategory === item.id
                    ? theme.colors.brand.primary
                    : theme.colors.surface.primary,
                  borderColor: activeCategory === item.id
                    ? theme.colors.brand.primary
                    : theme.colors.border.light
                }
              ]}
              onPress={() => setActiveCategory(item.id)}
            >
              <Ionicons
                name={item.icon as any}
                size={20}
                color={activeCategory === item.id ? '#FFFFFF' : theme.colors.text.secondary}
              />
              <Text
                variant="labelMedium"
                style={{
                  color: activeCategory === item.id ? '#FFFFFF' : theme.colors.text.secondary,
                  marginLeft: 8
                }}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.brand.primary} />
        </View>
      ) : (
        <Animated.FlatList
          data={filteredLawyers}
          keyExtractor={item => item.userId}
          renderItem={renderLawyerCard}
          contentContainerStyle={styles.listContent}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={64} color={theme.colors.text.tertiary} />
              <Text variant="h4" color="secondary" style={{ marginTop: 16 }}>No Lawyers Found</Text>
              <Text variant="bodyMedium" color="tertiary" style={{ textAlign: 'center', marginTop: 8 }}>
                Try adjusting your filters or search query
              </Text>
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
    paddingBottom: 16,
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  card: {
    borderRadius: 16,
    marginBottom: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
  },
  imageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  placeholderImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    backgroundColor: '#4CAF50',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  name: {
    flex: 1,
    marginRight: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 180, 0, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  ratingText: {
    marginLeft: 4,
    fontWeight: '600',
  },
  reviewsText: {
    marginLeft: 2,
    fontSize: 10,
  },
  specialty: {
    marginBottom: 8,
    fontWeight: '500',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    marginLeft: 4,
  },
  dotSeparator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#CCC',
    marginHorizontal: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
});
