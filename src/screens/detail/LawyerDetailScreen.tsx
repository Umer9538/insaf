/**
 * INSAF - Lawyer Detail Screen
 *
 * Detailed view of a lawyer's profile with booking option
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { Text } from '../../components/common/Text';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';

const { width } = Dimensions.get('window');

// Sample Lawyer Data
const LAWYER_DATA = {
  id: '1',
  name: 'Adv. Ahmad Khan',
  title: 'Senior Criminal Lawyer',
  specialty: 'Criminal Law',
  experience: '15 years',
  rating: 4.9,
  reviews: 128,
  cases: 450,
  successRate: 92,
  location: 'Lahore, Punjab',
  languages: ['Urdu', 'English', 'Punjabi'],
  verified: true,
  hourlyRate: 5000,
  about: 'Experienced criminal defense attorney with over 15 years of practice. Specialized in handling complex criminal cases including fraud, theft, and assault. Graduate from Punjab University Law College with distinction.',
  education: [
    { degree: 'LLB', institution: 'Punjab University Law College', year: '2005' },
    { degree: 'LLM (Criminal Law)', institution: 'University of London', year: '2008' },
  ],
  expertise: ['Criminal Defense', 'Fraud Cases', 'Bail Applications', 'Appeals', 'White Collar Crimes'],
  availability: {
    monday: '9:00 AM - 5:00 PM',
    tuesday: '9:00 AM - 5:00 PM',
    wednesday: '9:00 AM - 5:00 PM',
    thursday: '9:00 AM - 5:00 PM',
    friday: '9:00 AM - 1:00 PM',
  },
};

const REVIEWS = [
  {
    id: '1',
    name: 'Ali Hassan',
    rating: 5,
    date: '2 weeks ago',
    comment: 'Excellent lawyer! Very professional and knowledgeable. Won my case with his expertise.',
  },
  {
    id: '2',
    name: 'Fatima Malik',
    rating: 5,
    date: '1 month ago',
    comment: 'Very thorough and responsive. Kept me informed at every step of the legal process.',
  },
  {
    id: '3',
    name: 'Usman Iqbal',
    rating: 4,
    date: '2 months ago',
    comment: 'Good experience overall. Handled my case professionally.',
  },
];

export const LawyerDetailScreen: React.FC = () => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const [activeTab, setActiveTab] = useState('about');

  const lawyer = LAWYER_DATA;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={theme.colors.gradient.primary as [string, string]}
          style={[styles.header, { paddingTop: insets.top }]}
        >
          {/* Navigation */}
          <View style={styles.navRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.navActions}>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="heart-outline" size={22} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="share-outline" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Profile */}
          <View style={styles.profileSection}>
            <LinearGradient
              colors={['#d4af37', '#f4d03f']}
              style={styles.avatarGradient}
            >
              <Ionicons name="person" size={50} color="#1a365d" />
            </LinearGradient>

            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            </View>
          </View>

          <View style={styles.nameSection}>
            <Text variant="h2" style={styles.name}>{lawyer.name}</Text>
            <Text variant="bodyMedium" style={styles.title}>{lawyer.title}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={14} color="rgba(255,255,255,0.7)" />
              <Text variant="bodySmall" style={styles.location}>{lawyer.location}</Text>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text variant="h3" style={styles.statValue}>{lawyer.rating}</Text>
              <View style={styles.ratingStars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name={star <= Math.floor(lawyer.rating) ? 'star' : 'star-outline'}
                    size={12}
                    color="#d4af37"
                  />
                ))}
              </View>
              <Text variant="caption" style={styles.statLabel}>{lawyer.reviews} reviews</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text variant="h3" style={styles.statValue}>{lawyer.cases}</Text>
              <Text variant="caption" style={styles.statLabel}>Total Cases</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text variant="h3" style={styles.statValue}>{lawyer.successRate}%</Text>
              <Text variant="caption" style={styles.statLabel}>Success Rate</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {['about', 'reviews', 'availability'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                activeTab === tab && { borderBottomColor: theme.colors.brand.primary, borderBottomWidth: 2 },
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                variant="labelMedium"
                style={{ color: activeTab === tab ? theme.colors.brand.primary : theme.colors.text.secondary }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {activeTab === 'about' && (
            <>
              <View>
                <Text variant="h4" color="primary" style={styles.sectionTitle}>About</Text>
                <Text variant="bodyMedium" color="secondary" style={styles.aboutText}>
                  {lawyer.about}
                </Text>
              </View>

              <View>
                <Text variant="h4" color="primary" style={styles.sectionTitle}>Expertise</Text>
                <View style={styles.tagsContainer}>
                  {lawyer.expertise.map((skill, index) => (
                    <View
                      key={index}
                      style={[styles.tag, { backgroundColor: theme.colors.surface.secondary }]}
                    >
                      <Text variant="labelSmall" color="secondary">{skill}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View>
                <Text variant="h4" color="primary" style={styles.sectionTitle}>Education</Text>
                {lawyer.education.map((edu, index) => (
                  <View key={index} style={styles.educationItem}>
                    <View style={[styles.eduIcon, { backgroundColor: `${theme.colors.brand.primary}15` }]}>
                      <Ionicons name="school" size={18} color={theme.colors.brand.primary} />
                    </View>
                    <View style={styles.eduInfo}>
                      <Text variant="labelMedium" color="primary">{edu.degree}</Text>
                      <Text variant="bodySmall" color="secondary">{edu.institution}, {edu.year}</Text>
                    </View>
                  </View>
                ))}
              </View>

              <View>
                <Text variant="h4" color="primary" style={styles.sectionTitle}>Languages</Text>
                <View style={styles.tagsContainer}>
                  {lawyer.languages.map((lang, index) => (
                    <View
                      key={index}
                      style={[styles.tag, { backgroundColor: theme.colors.surface.secondary }]}
                    >
                      <Ionicons name="globe-outline" size={12} color={theme.colors.text.secondary} />
                      <Text variant="labelSmall" color="secondary" style={{ marginLeft: 4 }}>{lang}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </>
          )}

          {activeTab === 'reviews' && (
            <View>
              {REVIEWS.map((review, index) => (
                <Card key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewerAvatar}>
                      <Text variant="labelMedium" style={{ color: '#fff' }}>
                        {review.name.charAt(0)}
                      </Text>
                    </View>
                    <View style={styles.reviewerInfo}>
                      <Text variant="labelMedium" color="primary">{review.name}</Text>
                      <Text variant="caption" color="tertiary">{review.date}</Text>
                    </View>
                    <View style={styles.reviewRating}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Ionicons
                          key={star}
                          name={star <= review.rating ? 'star' : 'star-outline'}
                          size={12}
                          color="#d4af37"
                        />
                      ))}
                    </View>
                  </View>
                  <Text variant="bodySmall" color="secondary" style={styles.reviewComment}>
                    {review.comment}
                  </Text>
                </Card>
              ))}
            </View>
          )}

          {activeTab === 'availability' && (
            <View>
              <Card style={styles.availabilityCard}>
                {Object.entries(lawyer.availability).map(([day, time]) => (
                  <View key={day} style={styles.availabilityRow}>
                    <Text variant="labelMedium" color="primary" style={styles.dayLabel}>
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                    </Text>
                    <Text variant="bodySmall" color="secondary">{time}</Text>
                  </View>
                ))}
              </Card>
            </View>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16, backgroundColor: theme.colors.surface.primary }]}>
        <View style={styles.priceSection}>
          <Text variant="caption" color="secondary">Consultation Fee</Text>
          <Text variant="h3" color="brand">Rs. {lawyer.hourlyRate.toLocaleString()}/hr</Text>
        </View>
        <Button
          title="Book Consultation"
          variant="gradient"
          size="lg"
          onPress={() => {}}
          style={styles.bookButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileSection: {
    alignItems: 'center',
    marginTop: 8,
  },
  avatarGradient: {
    width: 100,
    height: 100,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: width / 2 - 60,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 2,
  },
  nameSection: {
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  name: {
    color: '#FFFFFF',
    textAlign: 'center',
  },
  title: {
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  location: {
    color: 'rgba(255,255,255,0.7)',
    marginLeft: 4,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 20,
    marginHorizontal: 20,
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
  ratingStars: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 2,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    marginBottom: 12,
    marginTop: 16,
  },
  aboutText: {
    lineHeight: 22,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  educationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  eduIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eduInfo: {
    marginLeft: 12,
    flex: 1,
  },
  reviewCard: {
    marginBottom: 12,
    padding: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#1a365d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  reviewRating: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewComment: {
    lineHeight: 20,
  },
  availabilityCard: {
    padding: 16,
  },
  availabilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  dayLabel: {
    textTransform: 'capitalize',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  priceSection: {
    flex: 1,
  },
  bookButton: {
    flex: 1,
    marginLeft: 16,
  },
});

export default LawyerDetailScreen;
