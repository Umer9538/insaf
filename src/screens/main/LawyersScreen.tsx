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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { Text } from '../../components/common/Text';

const { width } = Dimensions.get('window');

// Lawyer Categories
const CATEGORIES = [
  { id: 'all', name: 'All', icon: 'grid' },
  { id: 'criminal', name: 'Criminal', icon: 'shield' },
  { id: 'family', name: 'Family', icon: 'people' },
  { id: 'corporate', name: 'Corporate', icon: 'business' },
  { id: 'property', name: 'Property', icon: 'home' },
  { id: 'civil', name: 'Civil', icon: 'document-text' },
];

// Sample Lawyers Data
const LAWYERS = [
  {
    id: '1',
    name: 'Adv. Ahmad Khan',
    specialty: 'Criminal Law',
    experience: '15 years',
    rating: 4.9,
    reviews: 128,
    location: 'Lahore',
    verified: true,
    hourlyRate: 5000,
    image: null,
  },
  {
    id: '2',
    name: 'Adv. Sara Ali',
    specialty: 'Family Law',
    experience: '12 years',
    rating: 4.8,
    reviews: 95,
    location: 'Karachi',
    verified: true,
    hourlyRate: 4500,
    image: null,
  },
  {
    id: '3',
    name: 'Adv. Imran Shah',
    specialty: 'Corporate Law',
    experience: '20 years',
    rating: 4.7,
    reviews: 156,
    location: 'Islamabad',
    verified: true,
    hourlyRate: 8000,
    image: null,
  },
  {
    id: '4',
    name: 'Adv. Fatima Zahra',
    specialty: 'Property Law',
    experience: '10 years',
    rating: 4.6,
    reviews: 72,
    location: 'Lahore',
    verified: true,
    hourlyRate: 4000,
    image: null,
  },
  {
    id: '5',
    name: 'Adv. Bilal Ahmed',
    specialty: 'Civil Law',
    experience: '8 years',
    rating: 4.5,
    reviews: 48,
    location: 'Peshawar',
    verified: true,
    hourlyRate: 3500,
    image: null,
  },
];

export const LawyersScreen: React.FC = () => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Animated values
  const headerAnim = useRef(new Animated.Value(0)).current;
  const searchAnim = useRef(new Animated.Value(0)).current;
  const categoriesAnim = useRef(new Animated.Value(0)).current;

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
      Animated.timing(categoriesAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const filteredLawyers = LAWYERS.filter((lawyer) => {
    const matchesSearch = lawyer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lawyer.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' ||
      lawyer.specialty.toLowerCase().includes(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  const renderLawyerCard = ({ item, index }: { item: typeof LAWYERS[0]; index: number }) => (
    <View>
      <TouchableOpacity
        style={[styles.lawyerCard, { backgroundColor: theme.colors.surface.primary }]}
        onPress={() => navigation.navigate('LawyerDetail', { lawyerId: item.id })}
        activeOpacity={0.7}
      >
        {/* Lawyer Image */}
        <LinearGradient
          colors={['#1a365d', '#2d4a7c']}
          style={styles.lawyerImage}
        >
          <Ionicons name="person" size={32} color="#d4af37" />
        </LinearGradient>

        {/* Lawyer Info */}
        <View style={styles.lawyerInfo}>
          <View style={styles.nameRow}>
            <Text variant="h4" color="primary" numberOfLines={1}>
              {item.name}
            </Text>
            {item.verified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              </View>
            )}
          </View>

          <Text variant="bodySmall" color="secondary" style={styles.specialty}>
            {item.specialty} • {item.experience}
          </Text>

          <View style={styles.locationRow}>
            <Ionicons name="location" size={14} color={theme.colors.text.tertiary} />
            <Text variant="caption" color="tertiary"> {item.location}</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={12} color="#d4af37" />
              <Text variant="labelSmall" color="primary"> {item.rating}</Text>
              <Text variant="caption" color="tertiary"> ({item.reviews})</Text>
            </View>
            <Text variant="labelMedium" color="brand">
              Rs. {item.hourlyRate.toLocaleString()}/hr
            </Text>
          </View>
        </View>

        {/* Arrow */}
        <View style={styles.arrowContainer}>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.text.tertiary} />
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
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
          <Text variant="h2" style={styles.headerTitle}>Find Lawyers</Text>
          <Text variant="bodySmall" style={styles.headerSubtitle}>
            Connect with verified legal professionals
          </Text>
        </Animated.View>

        {/* Search Bar */}
        <Animated.View
          style={[
            styles.searchContainer,
            {
              opacity: searchAnim,
              transform: [{
                translateY: searchAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              }],
            }
          ]}
        >
          <View style={[styles.searchBar, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
            <Ionicons name="search" size={20} color="rgba(255,255,255,0.7)" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or specialty..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="options" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>

      {/* Categories */}
      <Animated.View
        style={{
          opacity: categoriesAnim,
          transform: [{
            translateY: categoriesAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            }),
          }],
        }}
      >
        <FlatList
          horizontal
          data={CATEGORIES}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryChip,
                {
                  backgroundColor: selectedCategory === item.id
                    ? theme.colors.brand.primary
                    : theme.colors.surface.secondary,
                },
              ]}
              onPress={() => setSelectedCategory(item.id)}
            >
              <Ionicons
                name={item.icon as any}
                size={16}
                color={selectedCategory === item.id ? '#FFFFFF' : theme.colors.text.secondary}
              />
              <Text
                variant="labelSmall"
                style={{
                  color: selectedCategory === item.id ? '#FFFFFF' : theme.colors.text.secondary,
                  marginLeft: 6,
                }}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />
      </Animated.View>

      {/* Lawyers List */}
      <FlatList
        data={filteredLawyers}
        keyExtractor={(item) => item.id}
        renderItem={renderLawyerCard}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search" size={48} color={theme.colors.text.tertiary} />
            <Text variant="bodyMedium" color="secondary" style={styles.emptyText}>
              No lawyers found matching your search
            </Text>
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
  headerTitle: {
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 12,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#FFFFFF',
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  lawyerCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lawyerImage: {
    width: 70,
    height: 70,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lawyerInfo: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedBadge: {
    marginLeft: 6,
  },
  specialty: {
    marginTop: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrowContainer: {
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    marginTop: 16,
    textAlign: 'center',
  },
});

export default LawyersScreen;
