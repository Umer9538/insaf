/**
 * INSAF - Splash Screen
 *
 * Beautiful splash screen with logo and tagline
 */

import React from 'react';
import { View, StyleSheet, Dimensions, Text as RNText } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export const SplashScreen: React.FC = () => {
  return (
    <LinearGradient
      colors={['#1a365d', '#0d1f3c', '#0a1628']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Logo */}
      <View style={styles.logoContainer}>
        <LinearGradient
          colors={['#d4af37', '#f4d03f', '#d4af37']}
          style={styles.logoGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="shield-checkmark" size={60} color="#1a365d" />
        </LinearGradient>
      </View>

      {/* App Name */}
      <RNText style={styles.appName}>INSAF</RNText>

      {/* Tagline */}
      <RNText style={styles.tagline}>Justice at Your Fingertips</RNText>

      {/* Bottom decoration */}
      <View style={styles.bottomDecoration}>
        <View style={styles.decorLine} />
        <Ionicons name="scale-outline" size={20} color="rgba(212, 175, 55, 0.5)" />
        <View style={styles.decorLine} />
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoGradient: {
    width: 120,
    height: 120,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#d4af37',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  appName: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 8,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(212, 175, 55, 0.9)',
    letterSpacing: 2,
    fontWeight: '500',
  },
  bottomDecoration: {
    position: 'absolute',
    bottom: 60,
    flexDirection: 'row',
    alignItems: 'center',
  },
  decorLine: {
    width: 40,
    height: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.3)',
    marginHorizontal: 12,
  },
});

export default SplashScreen;
