/**
 * INSAF - Lawyer Detail Screen
 * 
 * Detailed view of a lawyer's profile with booking option
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppTheme } from '../../context/ThemeContext';
import { Text } from '../../components/common/Text';
import { Button } from '../../components/common/Button';
import { FollowButton } from '../../components/common/FollowButton';
import { getFollowStats, FollowStats } from '../../services/follow.service';
import { useAuth } from '../../context/AuthContext';
import { LawyerProfile, getLawyerProfile } from '../../services/lawyer.service';
import { Card } from '../../components/common/Card';
import { createConversation } from '../../services/chat.service';
import { getLawyerReviews, Review } from '../../services/review.service';
import { getLawyerAvailability, LawyerAvailability } from '../../services/consultation.service';
import { formatDistanceToNow } from 'date-fns';

const { width } = Dimensions.get('window');

// Sample lawyer data (Fallback)
const LAWYER_DATA = {
  id: 'l1',
  name: 'Adv. Sarah Ahmed',
  title: 'Senior Corporate Lawyer',
  specialty: 'Corporate Law',
  experience: '12 Years',
  rating: 4.8,
  reviews: 124,
  cases: 85,
  successRate: 98,
  location: 'Lahore, Pakistan',
  languages: ['English', 'Urdu'],
  about: 'Sarah Ahmed is a distinguished corporate lawyer with over 12 years of experience in handling complex corporate litigations and mergers. She has successfully represented numerous multinational corporations.',
  expertise: ['Corporate Law', 'Contract Law', 'Intellectual Property', 'Mergers & Acquisitions'],
  education: [
    { degree: 'LLM Corporate Law', institution: 'Harvard Law School', year: '2015' },
    { degree: 'LLB (Hons)', institution: 'LUMS', year: '2012' }
  ],
  availability: {
    nextAvailable: 'Tomorrow, 10:00 AM',
    days: ['Mon', 'Tue', 'Thu', 'Fri']
  },
  hourlyRate: 5000
};

export const LawyerDetailScreen = () => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('about');
  const [loading, setLoading] = useState(true);
  const [lawyer, setLawyer] = useState<LawyerProfile | null>(null);
  const [followStats, setFollowStats] = useState<FollowStats>({ followerCount: 0, followingCount: 0, isFollowing: false });
  const [startingChat, setStartingChat] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [availability, setAvailability] = useState<LawyerAvailability | null>(null);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  // Use passed lawyerId or fallback to sample ID if testing
  const lawyerId = route.params?.lawyerId || LAWYER_DATA.id;

  const scrollY = new Animated.Value(0);
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [300, 100],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    fetchLawyerDetails();
  }, [lawyerId, user]);

  const fetchLawyerDetails = async () => {
    try {
      // In a real app, you'd fetch data based on lawyerId
      // For now, we'll try to fetch from Firestore, if not found use sample data mapped to LawyerProfile
      const data = await getLawyerProfile(lawyerId);

      if (data) {
        setLawyer(data);
        if (user && user.uid !== lawyerId) {
          const stats = await getFollowStats(user.uid, lawyerId);
          setFollowStats(stats);
        } else {
          setFollowStats({
            followerCount: data.followerCount || 0,
            followingCount: data.followingCount || 0,
            isFollowing: false
          });
        }
      } else {
        // Map sample data to LawyerProfile interface for rendering
        const sampleProfile: any = {
          id: LAWYER_DATA.id,
          userId: LAWYER_DATA.id,
          fullName: LAWYER_DATA.name,
          email: 'test@example.com',
          specializations: LAWYER_DATA.expertise,
          experienceYears: 12, // extracted from '12 Years'
          ratingAverage: LAWYER_DATA.rating,
          totalReviews: LAWYER_DATA.reviews,
          totalCasesCompleted: LAWYER_DATA.cases,
          serviceAreas: [LAWYER_DATA.location],
          languages: LAWYER_DATA.languages,
          bio: LAWYER_DATA.about,
          education: LAWYER_DATA.education,
          consultationFee: LAWYER_DATA.hourlyRate,
          isOnline: true,
          verificationStatus: 'VERIFIED',
          followerCount: 0,
          followingCount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        setLawyer(sampleProfile);
        setFollowStats({ followerCount: 0, followingCount: 0, isFollowing: false });
      }

    } catch (error) {
      console.error('Error fetching lawyer details:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch reviews when tab is clicked
  const fetchReviews = async () => {
    if (reviews.length > 0) return; // Already fetched
    setLoadingReviews(true);
    try {
      const fetchedReviews = await getLawyerReviews(lawyerId);
      setReviews(fetchedReviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoadingReviews(false);
    }
  };

  // Fetch availability when tab is clicked
  const fetchAvailability = async () => {
    if (availability) return; // Already fetched
    setLoadingAvailability(true);
    try {
      const fetchedAvailability = await getLawyerAvailability(lawyerId);
      setAvailability(fetchedAvailability);
    } catch (error) {
      console.error('Error fetching availability:', error);
    } finally {
      setLoadingAvailability(false);
    }
  };

  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'reviews') fetchReviews();
    if (tab === 'availability') fetchAvailability();
  };

  const handleFollowChange = (isFollowing: boolean) => {
    setFollowStats(prev => ({
      ...prev,
      isFollowing,
      followerCount: isFollowing ? prev.followerCount + 1 : prev.followerCount - 1
    }));
  };

  const handleStartChat = async () => {
    if (!user || !lawyer) return;

    setStartingChat(true);
    try {
      // Create or get existing conversation
      const conversationId = await createConversation(
        [
          {
            userId: user.uid,
            userName: user.displayName || 'User',
            userRole: 'client',
          },
          {
            userId: lawyer.userId,
            userName: lawyer.fullName,
            userRole: 'lawyer',
          },
        ],
        undefined, // caseId
        'direct',  // type
        undefined, // title
        user.uid   // createdBy
      );

      // Navigate to chat detail
      navigation.navigate('ChatDetail', { conversationId });
    } catch (error) {
      console.error('Error starting chat:', error);
    } finally {
      setStartingChat(false);
    }
  };

  if (loading || !lawyer) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background.primary }]}>
        <ActivityIndicator size="large" color={theme.colors.brand.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Header */}
        <LinearGradient
          colors={theme.colors.gradient.primary as [string, string]}
          style={styles.header}
        >
          {/* Nav Bar */}
          <View style={[styles.navRow, { paddingTop: insets.top }]}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.iconButton}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.actionIcons}>
              <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="share-social-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="heart-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Profile */}
          <View style={styles.headerContent}>
            <LinearGradient
              colors={['#1a365d', '#2d4a7c']}
              style={styles.imageContainer}
            >
              <Ionicons name="person" size={40} color="#d4af37" />
            </LinearGradient>

            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            </View>
          </View>

          <View style={styles.profileInfo}>
            <Text variant="h2" style={styles.name}>{lawyer.fullName}</Text>
            <Text variant="bodyMedium" style={styles.title}>Advocate High Court</Text>
            <Text variant="bodyMedium" style={styles.specialization}>
              {/* Handle string or object specialization */}
              {typeof lawyer.specializations?.[0] === 'string'
                ? lawyer.specializations[0].replace('_', ' ')
                : (lawyer.specializations?.[0] as any)?.name?.replace('_', ' ') || 'General Practice'}
            </Text>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={14} color="rgba(255,255,255,0.7)" />
              <Text variant="bodySmall" style={styles.location}>{lawyer.serviceAreas?.[0] || 'Pakistan'}</Text>
            </View>
          </View>

          {/* Follow Stats */}
          <View style={styles.followStatsRow}>
            <TouchableOpacity
              style={styles.followStatItem}
              onPress={() => navigation.navigate('FollowList', {
                userId: lawyer.userId,
                initialTab: 'followers',
                userName: lawyer.fullName
              })}
            >
              <Text variant="h4" style={styles.statValue}>{followStats.followerCount}</Text>
              <Text variant="caption" style={styles.statLabel}>Followers</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity
              style={styles.followStatItem}
              onPress={() => navigation.navigate('FollowList', {
                userId: lawyer.userId,
                initialTab: 'following',
                userName: lawyer.fullName
              })}
            >
              <Text variant="h4" style={styles.statValue}>{followStats.followingCount}</Text>
              <Text variant="caption" style={styles.statLabel}>Following</Text>
            </TouchableOpacity>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text variant="h3" style={styles.statValue}>{lawyer.ratingAverage?.toFixed(1) || 'N/A'}</Text>
              <Text variant="caption" style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text variant="h3" style={styles.statValue}>{lawyer.totalReviews || 0}</Text>
              <Text variant="caption" style={styles.statLabel}>Reviews</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text variant="h3" style={styles.statValue}>{lawyer.totalCasesCompleted || 0}</Text>
              <Text variant="caption" style={styles.statLabel}>Cases</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text variant="h3" style={styles.statValue}>{lawyer.experienceYears}+</Text>
              <Text variant="caption" style={styles.statLabel}>Years Exp.</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Tabs */}
        <View style={[styles.tabs, { backgroundColor: theme.colors.background.primary }]}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'about' && styles.activeTab]}
            onPress={() => handleTabChange('about')}
          >
            <Text
              variant="labelLarge"
              style={{ color: activeTab === 'about' ? theme.colors.brand.primary : theme.colors.text.secondary }}
            >
              About
            </Text>
            {activeTab === 'about' && <View style={[styles.activeIndicator, { backgroundColor: theme.colors.brand.primary }]} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'reviews' && styles.activeTab]}
            onPress={() => handleTabChange('reviews')}
          >
            <Text
              variant="labelLarge"
              style={{ color: activeTab === 'reviews' ? theme.colors.brand.primary : theme.colors.text.secondary }}
            >
              Reviews
            </Text>
            {activeTab === 'reviews' && <View style={[styles.activeIndicator, { backgroundColor: theme.colors.brand.primary }]} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'availability' && styles.activeTab]}
            onPress={() => handleTabChange('availability')}
          >
            <Text
              variant="labelLarge"
              style={{ color: activeTab === 'availability' ? theme.colors.brand.primary : theme.colors.text.secondary }}
            >
              Availability
            </Text>
            {activeTab === 'availability' && <View style={[styles.activeIndicator, { backgroundColor: theme.colors.brand.primary }]} />}
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {activeTab === 'about' && (
            <View style={styles.section}>
              <Text variant="h3" style={styles.sectionTitle}>About</Text>
              <Text variant="bodyMedium" style={styles.bio}>
                {lawyer.bio}
              </Text>

              <Text variant="h3" style={[styles.sectionTitle, { marginTop: 24 }]}>
                Education
              </Text>
              {lawyer.education && lawyer.education.map((edu: any, index: number) => (
                <View key={index} style={styles.educationItem}>
                  <Ionicons name="school-outline" size={20} color={theme.colors.brand.primary} />
                  <View style={styles.educationInfo}>
                    <Text variant="bodyLarge" style={styles.degree}>{edu.degree}</Text>
                    <Text variant="bodyMedium" color="secondary">
                      {edu.institution}, {edu.year}
                    </Text>
                  </View>
                </View>
              ))}

              <Text variant="h3" style={[styles.sectionTitle, { marginTop: 24 }]}>
                Languages
              </Text>
              <View style={styles.languagesContainer}>
                {lawyer.languages && lawyer.languages.map((lang: any, index: number) => (
                  <View key={index} style={[styles.languageChip, { backgroundColor: theme.colors.surface.secondary }]}>
                    <Text variant="bodySmall" color="secondary">{lang}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {activeTab === 'reviews' && (
            <View style={styles.section}>
              {loadingReviews ? (
                <ActivityIndicator size="small" color={theme.colors.brand.primary} style={{ marginTop: 20 }} />
              ) : reviews.length === 0 ? (
                <View style={styles.emptyReviews}>
                  <Ionicons name="star-outline" size={48} color={theme.colors.text.tertiary} />
                  <Text variant="bodyMedium" color="secondary" style={{ marginTop: 12, textAlign: 'center' }}>
                    No reviews yet
                  </Text>
                  <Text variant="caption" color="tertiary" style={{ marginTop: 4, textAlign: 'center' }}>
                    Be the first to review after completing a case
                  </Text>
                </View>
              ) : (
                reviews.map((review) => (
                  <Card key={review.id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <View style={styles.reviewerInfo}>
                        <View style={styles.reviewerAvatar}>
                          <Ionicons name="person" size={16} color="#fff" />
                        </View>
                        <View>
                          <Text variant="labelMedium" color="primary">{review.clientName}</Text>
                          <Text variant="caption" color="tertiary">
                            {review.createdAt?.toDate ? formatDistanceToNow(review.createdAt.toDate(), { addSuffix: true }) : 'Recently'}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.ratingBadge}>
                        <Ionicons name="star" size={12} color="#d4af37" />
                        <Text variant="labelSmall" style={{ color: '#d4af37', marginLeft: 4 }}>{review.rating}</Text>
                      </View>
                    </View>
                    {review.title && (
                      <Text variant="labelMedium" color="primary" style={{ marginTop: 8 }}>{review.title}</Text>
                    )}
                    <Text variant="bodySmall" color="secondary" style={{ marginTop: 4 }}>
                      {review.content}
                    </Text>
                    {review.lawyerResponse && (
                      <View style={[styles.lawyerResponse, { backgroundColor: theme.colors.surface.secondary }]}>
                        <Text variant="caption" color="tertiary">Lawyer's Response:</Text>
                        <Text variant="bodySmall" color="secondary" style={{ marginTop: 4 }}>
                          {review.lawyerResponse.content}
                        </Text>
                      </View>
                    )}
                  </Card>
                ))
              )}
            </View>
          )}

          {activeTab === 'availability' && (
            <View style={styles.section}>
              {loadingAvailability ? (
                <ActivityIndicator size="small" color={theme.colors.brand.primary} style={{ marginTop: 20 }} />
              ) : !availability ? (
                <View style={styles.emptyAvailability}>
                  <Ionicons name="calendar-outline" size={48} color={theme.colors.text.tertiary} />
                  <Text variant="bodyMedium" color="secondary" style={{ marginTop: 12, textAlign: 'center' }}>
                    Availability not set
                  </Text>
                  <Text variant="caption" color="tertiary" style={{ marginTop: 4, textAlign: 'center' }}>
                    The lawyer hasn't configured their availability yet
                  </Text>
                </View>
              ) : (
                <View>
                  <Text variant="h4" color="primary" style={{ marginBottom: 16 }}>Weekly Schedule</Text>
                  {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => {
                    const schedule = availability.weeklySchedule?.[index];
                    return (
                      <View key={day} style={styles.scheduleRow}>
                        <Text variant="labelMedium" color={schedule?.enabled ? 'primary' : 'tertiary'} style={{ width: 100 }}>
                          {day}
                        </Text>
                        {schedule?.enabled && schedule.slots?.length > 0 ? (
                          <View style={styles.timeSlotsContainer}>
                            {schedule.slots.map((slot, slotIndex) => (
                              <View key={slotIndex} style={[styles.timeSlot, { backgroundColor: theme.colors.surface.secondary }]}>
                                <Text variant="caption" color="secondary">
                                  {slot.startTime} - {slot.endTime}
                                </Text>
                              </View>
                            ))}
                          </View>
                        ) : (
                          <Text variant="caption" color="tertiary">Unavailable</Text>
                        )}
                      </View>
                    );
                  })}
                  <View style={styles.consultationInfo}>
                    <Text variant="labelMedium" color="primary">Consultation Duration: </Text>
                    <Text variant="bodyMedium" color="secondary">{availability.consultationDuration || 30} minutes</Text>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Spacer for bottom bar */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16, backgroundColor: theme.colors.surface.primary }]}>
        <View style={styles.bottomBarContent}>
          <TouchableOpacity
            style={[styles.messageButton, { backgroundColor: theme.colors.surface.secondary }]}
            onPress={handleStartChat}
            disabled={startingChat}
          >
            {startingChat ? (
              <ActivityIndicator size="small" color={theme.colors.brand.primary} />
            ) : (
              <Ionicons name="chatbubble-outline" size={24} color={theme.colors.brand.primary} />
            )}
          </TouchableOpacity>
          <Button
            label="Book Consultation"
            onPress={() => navigation.navigate('BookConsultation', { lawyerId })}
            style={{ flex: 1, marginLeft: 12 }}
          />
        </View>
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
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconButton: {
    padding: 8,
  },
  actionIcons: {
    flexDirection: 'row',
  },
  headerContent: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: width / 2 - 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 2,
  },
  profileInfo: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  name: {
    color: '#FFFFFF',
    marginBottom: 4,
  },
  title: {
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  specialization: {
    color: '#d4af37',
    fontWeight: '600',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    color: 'rgba(255,255,255,0.7)',
    marginLeft: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  statValue: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
  },
  activeTab: {
    // 
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    width: '60%',
    height: 2,
    borderRadius: 2,
  },
  content: {
    padding: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  bio: {
    lineHeight: 24,
    opacity: 0.8,
  },
  educationItem: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'center',
  },
  educationInfo: {
    marginLeft: 12,
  },
  degree: {
    fontWeight: '600',
    marginBottom: 2,
  },
  languagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  languageChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  followStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  followStatItem: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  bottomBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  messageButton: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyReviews: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  reviewCard: {
    padding: 16,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1a365d',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  lawyerResponse: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
  },
  emptyAvailability: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  timeSlotsContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlot: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  consultationInfo: {
    flexDirection: 'row',
    marginTop: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
});
