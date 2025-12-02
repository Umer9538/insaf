/**
 * INSAF - Lawyer Profile Edit Screen
 *
 * Allows lawyers to edit their profile information including personal details,
 * professional info, practice areas, fees, and more.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput as RNTextInput,
  Image,
  Animated,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Text } from '../../components/common/Text';
import { updateLawyerProfile } from '../../services/lawyer.service';
import { AreaOfLaw } from '../../services/case.service';

// TypeScript Interfaces
interface FormData {
  fullName: string;
  phone: string;
  bio: string;
  barId: string;
  licenseNumber: string;
  experienceYears: string;
  practiceAreas: AreaOfLaw[];
  serviceAreas: string[];
  consultationFee: string;
  hourlyRate: string;
  languages: ('EN' | 'UR')[];
  profileImage?: string;
}

interface CheckboxItemProps {
  label: string;
  value: string;
  isSelected: boolean;
  onToggle: () => void;
}

const CheckboxItem: React.FC<CheckboxItemProps> = ({ label, value, isSelected, onToggle }) => {
  const theme = useAppTheme();

  return (
    <TouchableOpacity
      style={[
        styles.checkboxItem,
        {
          backgroundColor: isSelected
            ? `${theme.colors.brand.primary}15`
            : theme.colors.surface.secondary,
          borderColor: isSelected
            ? theme.colors.brand.primary
            : theme.colors.border.primary,
        },
      ]}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.checkbox,
          {
            backgroundColor: isSelected
              ? theme.colors.brand.primary
              : 'transparent',
            borderColor: isSelected
              ? theme.colors.brand.primary
              : theme.colors.border.primary,
          },
        ]}
      >
        {isSelected && (
          <Ionicons name="checkmark" size={16} color="#FFFFFF" />
        )}
      </View>
      <Text variant="bodyMedium" color="primary" style={styles.checkboxLabel}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

// Practice Areas
const PRACTICE_AREAS: { label: string; value: AreaOfLaw }[] = [
  { label: 'Criminal Law', value: 'CRIMINAL' },
  { label: 'Civil Law', value: 'CIVIL' },
  { label: 'Corporate Law', value: 'CORPORATE' },
  { label: 'Family Law', value: 'FAMILY' },
  { label: 'Property Law', value: 'PROPERTY' },
  { label: 'Tax Law', value: 'TAX' },
  { label: 'Labor Law', value: 'LABOR' },
  { label: 'Immigration', value: 'IMMIGRATION' },
  { label: 'Intellectual Property', value: 'IP' },
  { label: 'Environmental', value: 'ENVIRONMENTAL' },
];

// Service Areas (Cities)
const SERVICE_AREAS: { label: string; value: string }[] = [
  { label: 'Karachi', value: 'karachi' },
  { label: 'Lahore', value: 'lahore' },
  { label: 'Islamabad', value: 'islamabad' },
  { label: 'Rawalpindi', value: 'rawalpindi' },
  { label: 'Faisalabad', value: 'faisalabad' },
  { label: 'Multan', value: 'multan' },
  { label: 'Peshawar', value: 'peshawar' },
  { label: 'Quetta', value: 'quetta' },
  { label: 'Sialkot', value: 'sialkot' },
  { label: 'Gujranwala', value: 'gujranwala' },
];

// Languages
const LANGUAGES: { label: string; value: 'EN' | 'UR' }[] = [
  { label: 'English', value: 'EN' },
  { label: 'Urdu', value: 'UR' },
];

export const LawyerProfileEditScreen: React.FC = () => {
  const theme = useAppTheme();
  const navigation = useNavigation();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    phone: '',
    bio: '',
    barId: '',
    licenseNumber: '',
    experienceYears: '',
    practiceAreas: [],
    serviceAreas: [],
    consultationFee: '',
    hourlyRate: '',
    languages: ['EN'],
    profileImage: undefined,
  });

  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // TODO: Load existing profile data
    // const loadProfile = async () => {
    //   const profile = await getLawyerProfile(user?.uid);
    //   if (profile) {
    //     setFormData({...});
    //   }
    // };
    // loadProfile();
  }, []);

  // Update form field
  const updateField = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Toggle practice area
  const togglePracticeArea = (area: AreaOfLaw) => {
    setFormData((prev) => {
      const practiceAreas = prev.practiceAreas.includes(area)
        ? prev.practiceAreas.filter((a) => a !== area)
        : [...prev.practiceAreas, area];
      return { ...prev, practiceAreas };
    });
  };

  // Toggle service area
  const toggleServiceArea = (city: string) => {
    setFormData((prev) => {
      const serviceAreas = prev.serviceAreas.includes(city)
        ? prev.serviceAreas.filter((c) => c !== city)
        : [...prev.serviceAreas, city];
      return { ...prev, serviceAreas };
    });
  };

  // Toggle language
  const toggleLanguage = (lang: 'EN' | 'UR') => {
    setFormData((prev) => {
      const languages = prev.languages.includes(lang)
        ? prev.languages.filter((l) => l !== lang)
        : [...prev.languages, lang];
      return { ...prev, languages };
    });
  };

  // Handle profile image edit
  const handleEditImage = () => {
    // TODO: Implement image picker
    Alert.alert(
      'Change Profile Picture',
      'This feature will allow you to upload a new profile picture.',
      [{ text: 'OK' }]
    );
  };

  // Validate form
  const validateForm = (): boolean => {
    if (!formData.fullName.trim()) {
      Alert.alert('Validation Error', 'Please enter your full name');
      return false;
    }
    if (!formData.phone.trim()) {
      Alert.alert('Validation Error', 'Please enter your phone number');
      return false;
    }
    if (!formData.barId.trim()) {
      Alert.alert('Validation Error', 'Please enter your Bar ID');
      return false;
    }
    if (!formData.licenseNumber.trim()) {
      Alert.alert('Validation Error', 'Please enter your license number');
      return false;
    }
    if (!formData.experienceYears || parseInt(formData.experienceYears) < 0) {
      Alert.alert('Validation Error', 'Please enter valid years of experience');
      return false;
    }
    if (formData.practiceAreas.length === 0) {
      Alert.alert('Validation Error', 'Please select at least one practice area');
      return false;
    }
    if (formData.serviceAreas.length === 0) {
      Alert.alert('Validation Error', 'Please select at least one service area');
      return false;
    }
    if (formData.languages.length === 0) {
      Alert.alert('Validation Error', 'Please select at least one language');
      return false;
    }
    return true;
  };

  // Handle save
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    try {
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }

      // Prepare update data
      const updateData = {
        fullName: formData.fullName,
        bio: formData.bio,
        barId: formData.barId,
        licenseNumber: formData.licenseNumber,
        experienceYears: parseInt(formData.experienceYears),
        specializations: formData.practiceAreas,
        serviceAreas: formData.serviceAreas,
        consultationFee: formData.consultationFee ? parseFloat(formData.consultationFee) : undefined,
        hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : undefined,
        languages: formData.languages,
        updatedAt: new Date(),
      };

      // Update profile
      await updateLawyerProfile(user.uid, updateData);

      Alert.alert(
        'Success',
        'Your profile has been updated successfully',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert(
        'Error',
        'Failed to update profile. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.colors.surface.primary }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text variant="h3" color="primary">
            Edit Profile
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Content */}
        <Animated.ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          opacity={fadeAnim}
        >
          <Animated.View
            style={{
              transform: [{ translateY: slideAnim }],
            }}
          >
            {/* Profile Image Section */}
            <View style={styles.section}>
              <View style={styles.imageContainer}>
                <View style={styles.imageWrapper}>
                  {formData.profileImage ? (
                    <Image
                      source={{ uri: formData.profileImage }}
                      style={styles.profileImage}
                    />
                  ) : (
                    <View
                      style={[
                        styles.profileImagePlaceholder,
                        { backgroundColor: theme.colors.brand.primary },
                      ]}
                    >
                      <Ionicons name="person" size={48} color="#FFFFFF" />
                    </View>
                  )}
                  <TouchableOpacity
                    style={[
                      styles.editImageButton,
                      { backgroundColor: theme.colors.brand.primary },
                    ]}
                    onPress={handleEditImage}
                  >
                    <Ionicons name="camera" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Personal Info Section */}
            <View style={styles.section}>
              <Text variant="h4" color="primary" style={styles.sectionTitle}>
                Personal Information
              </Text>

              <View style={styles.inputGroup}>
                <Text variant="labelMedium" color="secondary" style={styles.label}>
                  Full Name
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    { backgroundColor: theme.colors.surface.secondary },
                  ]}
                >
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={theme.colors.text.tertiary}
                    style={styles.inputIcon}
                  />
                  <RNTextInput
                    style={[styles.input, { color: theme.colors.text.primary }]}
                    placeholder="Enter your full name"
                    placeholderTextColor={theme.colors.text.tertiary}
                    value={formData.fullName}
                    onChangeText={(text) => updateField('fullName', text)}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text variant="labelMedium" color="secondary" style={styles.label}>
                  Phone Number
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    { backgroundColor: theme.colors.surface.secondary },
                  ]}
                >
                  <Ionicons
                    name="call-outline"
                    size={20}
                    color={theme.colors.text.tertiary}
                    style={styles.inputIcon}
                  />
                  <RNTextInput
                    style={[styles.input, { color: theme.colors.text.primary }]}
                    placeholder="+92 XXX XXXXXXX"
                    placeholderTextColor={theme.colors.text.tertiary}
                    value={formData.phone}
                    onChangeText={(text) => updateField('phone', text)}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text variant="labelMedium" color="secondary" style={styles.label}>
                  Bio
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    styles.textAreaContainer,
                    { backgroundColor: theme.colors.surface.secondary },
                  ]}
                >
                  <RNTextInput
                    style={[
                      styles.input,
                      styles.textArea,
                      { color: theme.colors.text.primary },
                    ]}
                    placeholder="Tell clients about yourself and your expertise..."
                    placeholderTextColor={theme.colors.text.tertiary}
                    value={formData.bio}
                    onChangeText={(text) => updateField('bio', text)}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>
              </View>
            </View>

            {/* Professional Info Section */}
            <View style={styles.section}>
              <Text variant="h4" color="primary" style={styles.sectionTitle}>
                Professional Information
              </Text>

              <View style={styles.inputGroup}>
                <Text variant="labelMedium" color="secondary" style={styles.label}>
                  Bar ID
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    { backgroundColor: theme.colors.surface.secondary },
                  ]}
                >
                  <Ionicons
                    name="card-outline"
                    size={20}
                    color={theme.colors.text.tertiary}
                    style={styles.inputIcon}
                  />
                  <RNTextInput
                    style={[styles.input, { color: theme.colors.text.primary }]}
                    placeholder="Enter your Bar ID"
                    placeholderTextColor={theme.colors.text.tertiary}
                    value={formData.barId}
                    onChangeText={(text) => updateField('barId', text)}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text variant="labelMedium" color="secondary" style={styles.label}>
                  License Number
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    { backgroundColor: theme.colors.surface.secondary },
                  ]}
                >
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={20}
                    color={theme.colors.text.tertiary}
                    style={styles.inputIcon}
                  />
                  <RNTextInput
                    style={[styles.input, { color: theme.colors.text.primary }]}
                    placeholder="Enter your license number"
                    placeholderTextColor={theme.colors.text.tertiary}
                    value={formData.licenseNumber}
                    onChangeText={(text) => updateField('licenseNumber', text)}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text variant="labelMedium" color="secondary" style={styles.label}>
                  Years of Experience
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    { backgroundColor: theme.colors.surface.secondary },
                  ]}
                >
                  <Ionicons
                    name="time-outline"
                    size={20}
                    color={theme.colors.text.tertiary}
                    style={styles.inputIcon}
                  />
                  <RNTextInput
                    style={[styles.input, { color: theme.colors.text.primary }]}
                    placeholder="Enter years of experience"
                    placeholderTextColor={theme.colors.text.tertiary}
                    value={formData.experienceYears}
                    onChangeText={(text) => updateField('experienceYears', text)}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            {/* Practice Areas Section */}
            <View style={styles.section}>
              <Text variant="h4" color="primary" style={styles.sectionTitle}>
                Practice Areas
              </Text>
              <Text variant="caption" color="secondary" style={styles.sectionSubtitle}>
                Select all areas you specialize in
              </Text>

              <View style={styles.checkboxGrid}>
                {PRACTICE_AREAS.map((area) => (
                  <CheckboxItem
                    key={area.value}
                    label={area.label}
                    value={area.value}
                    isSelected={formData.practiceAreas.includes(area.value)}
                    onToggle={() => togglePracticeArea(area.value)}
                  />
                ))}
              </View>
            </View>

            {/* Service Areas Section */}
            <View style={styles.section}>
              <Text variant="h4" color="primary" style={styles.sectionTitle}>
                Service Areas
              </Text>
              <Text variant="caption" color="secondary" style={styles.sectionSubtitle}>
                Select cities where you practice
              </Text>

              <View style={styles.checkboxGrid}>
                {SERVICE_AREAS.map((city) => (
                  <CheckboxItem
                    key={city.value}
                    label={city.label}
                    value={city.value}
                    isSelected={formData.serviceAreas.includes(city.value)}
                    onToggle={() => toggleServiceArea(city.value)}
                  />
                ))}
              </View>
            </View>

            {/* Fees Section */}
            <View style={styles.section}>
              <Text variant="h4" color="primary" style={styles.sectionTitle}>
                Fees
              </Text>

              <View style={styles.inputGroup}>
                <Text variant="labelMedium" color="secondary" style={styles.label}>
                  Consultation Fee (PKR)
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    { backgroundColor: theme.colors.surface.secondary },
                  ]}
                >
                  <Ionicons
                    name="cash-outline"
                    size={20}
                    color={theme.colors.text.tertiary}
                    style={styles.inputIcon}
                  />
                  <RNTextInput
                    style={[styles.input, { color: theme.colors.text.primary }]}
                    placeholder="Enter consultation fee"
                    placeholderTextColor={theme.colors.text.tertiary}
                    value={formData.consultationFee}
                    onChangeText={(text) => updateField('consultationFee', text)}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text variant="labelMedium" color="secondary" style={styles.label}>
                  Hourly Rate (PKR)
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    { backgroundColor: theme.colors.surface.secondary },
                  ]}
                >
                  <Ionicons
                    name="wallet-outline"
                    size={20}
                    color={theme.colors.text.tertiary}
                    style={styles.inputIcon}
                  />
                  <RNTextInput
                    style={[styles.input, { color: theme.colors.text.primary }]}
                    placeholder="Enter hourly rate"
                    placeholderTextColor={theme.colors.text.tertiary}
                    value={formData.hourlyRate}
                    onChangeText={(text) => updateField('hourlyRate', text)}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            {/* Languages Section */}
            <View style={styles.section}>
              <Text variant="h4" color="primary" style={styles.sectionTitle}>
                Languages
              </Text>
              <Text variant="caption" color="secondary" style={styles.sectionSubtitle}>
                Select languages you can communicate in
              </Text>

              <View style={styles.checkboxGrid}>
                {LANGUAGES.map((lang) => (
                  <CheckboxItem
                    key={lang.value}
                    label={lang.label}
                    value={lang.value}
                    isSelected={formData.languages.includes(lang.value)}
                    onToggle={() => toggleLanguage(lang.value)}
                  />
                ))}
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[
                styles.saveButton,
                { backgroundColor: theme.colors.brand.primary },
                isSaving && styles.saveButtonDisabled,
              ]}
              onPress={handleSave}
              disabled={isSaving}
              activeOpacity={0.8}
            >
              {isSaving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                  <Text variant="labelLarge" style={styles.saveButtonText}>
                    Save Changes
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </Animated.View>
        </Animated.ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  sectionSubtitle: {
    marginBottom: 16,
  },
  imageContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  imageWrapper: {
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editImageButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
  },
  textAreaContainer: {
    height: 'auto',
    minHeight: 100,
    paddingVertical: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  checkboxGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    margin: 6,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxLabel: {
    marginLeft: 8,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 16,
    marginTop: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontWeight: '600',
  },
});

export default LawyerProfileEditScreen;
