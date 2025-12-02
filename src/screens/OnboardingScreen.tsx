/**
 * INSAF - Onboarding Screen
 *
 * Onboarding with multiple slides
 */

import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  ViewToken,
  Text as RNText,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  gradient: [string, string];
}

const SLIDES: OnboardingSlide[] = [
  {
    id: '1',
    icon: 'shield-checkmark',
    title: 'Verified Lawyers',
    description: 'Connect with Pakistan Bar Council verified lawyers. Every attorney is authenticated for your peace of mind.',
    gradient: ['#1a365d', '#2d4a7c'],
  },
  {
    id: '2',
    icon: 'briefcase',
    title: 'Manage Your Cases',
    description: 'Create, track, and manage all your legal cases in one place. Get real-time updates and notifications.',
    gradient: ['#2d4a7c', '#1a365d'],
  },
  {
    id: '3',
    icon: 'cash',
    title: 'Transparent Bidding',
    description: 'Receive competitive bids from qualified lawyers. Choose the best representation for your budget.',
    gradient: ['#1a365d', '#0d2847'],
  },
  {
    id: '4',
    icon: 'lock-closed',
    title: 'Secure Escrow',
    description: 'Your payments are protected. Funds are released only when milestones are completed to your satisfaction.',
    gradient: ['#0d2847', '#1a365d'],
  },
];

interface OnboardingScreenProps {
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const renderSlide = ({ item }: { item: OnboardingSlide }) => (
    <LinearGradient colors={item.gradient} style={styles.slide}>
      <View style={styles.slideContent}>
        {/* Icon Container */}
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={['rgba(212, 175, 55, 0.2)', 'rgba(212, 175, 55, 0.1)']}
            style={styles.iconBackground}
          >
            <Ionicons name={item.icon} size={80} color="#d4af37" />
          </LinearGradient>
        </View>

        {/* Text Content */}
        <View style={styles.textContainer}>
          <RNText style={styles.slideTitle}>{item.title}</RNText>
          <RNText style={styles.slideDescription}>{item.description}</RNText>
        </View>
      </View>
    </LinearGradient>
  );

  const renderPagination = () => (
    <View style={styles.pagination}>
      {SLIDES.map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            {
              width: currentIndex === index ? 24 : 8,
              opacity: currentIndex === index ? 1 : 0.4,
            },
          ]}
        />
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Skip Button */}
      <TouchableOpacity
        style={[styles.skipButton, { top: insets.top + 16 }]}
        onPress={handleSkip}
      >
        <RNText style={styles.skipText}>Skip</RNText>
      </TouchableOpacity>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />

      {/* Bottom Section */}
      <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 24 }]}>
        {renderPagination()}

        <TouchableOpacity onPress={handleNext} activeOpacity={0.8}>
          <LinearGradient
            colors={['#d4af37', '#f4d03f']}
            style={styles.nextButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {currentIndex === SLIDES.length - 1 ? (
              <RNText style={styles.nextButtonText}>Get Started</RNText>
            ) : (
              <Ionicons name="arrow-forward" size={24} color="#1a365d" />
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a365d',
  },
  skipButton: {
    position: 'absolute',
    right: 24,
    zIndex: 10,
    padding: 8,
  },
  skipText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    fontWeight: '600',
  },
  slide: {
    width,
    height,
  },
  slideContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    marginBottom: 48,
  },
  iconBackground: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  textContainer: {
    alignItems: 'center',
  },
  slideTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  slideDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d4af37',
    marginHorizontal: 4,
  },
  nextButton: {
    width: 180,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#d4af37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a365d',
  },
});

export default OnboardingScreen;
