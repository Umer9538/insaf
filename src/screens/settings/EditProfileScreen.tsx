/**
 * INSAF - Edit Profile Screen
 *
 * Screen for editing user profile information
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useAppTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Text } from '../../components/common/Text';
import { Card } from '../../components/common/Card';
import { getLawyerProfile, updateLawyerProfile, LawyerProfile } from '../../services/lawyer.service';

export const EditProfileScreen: React.FC = () => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user, updateProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lawyerProfile, setLawyerProfile] = useState<LawyerProfile | null>(null);

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [consultationFee, setConsultationFee] = useState('');

  const isLawyer = user?.role === 'LAWYER' || user?.role === 'LAW_FIRM';

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.uid) return;

      try {
        setDisplayName(user.displayName || '');

        if (isLawyer) {
          const profile = await getLawyerProfile(user.uid);
          if (profile) {
            setLawyerProfile(profile);
            setBio(profile.bio || '');
            setExperienceYears(profile.experienceYears?.toString() || '');
            setHourlyRate(profile.hourlyRate?.toString() || '');
            setConsultationFee(profile.consultationFee?.toString() || '');
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user?.uid, isLawyer]);

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photo library to change your profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      // TODO: Upload image to storage and update profile
      Alert.alert('Success', 'Profile picture will be updated');
    }
  };

  const handleSave = async () => {
    if (!user?.uid) return;

    setSaving(true);
    try {
      // Update display name in auth
      if (displayName !== user.displayName) {
        await updateProfile({ displayName });
      }

      // Update lawyer profile if applicable
      if (isLawyer && lawyerProfile) {
        await updateLawyerProfile(user.uid, {
          bio,
          experienceYears: parseInt(experienceYears) || 0,
          hourlyRate: parseInt(hourlyRate) || 0,
          consultationFee: parseInt(consultationFee) || 0,
        });
      }

      Alert.alert('Success', 'Profile updated successfully');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: theme.colors.background.primary }]}>
        <ActivityIndicator size="large" color={theme.colors.brand.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background.primary }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text variant="h3" color="primary">Edit Profile</Text>
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: theme.colors.brand.primary }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text variant="labelMedium" style={{ color: '#FFFFFF' }}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Picture */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handlePickImage}>
            <LinearGradient
              colors={['#d4af37', '#f4d03f']}
              style={styles.avatar}
            >
              <Ionicons name="person" size={40} color="#1a365d" />
            </LinearGradient>
            <View style={[styles.cameraButton, { backgroundColor: theme.colors.brand.primary }]}>
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <Text variant="bodySmall" color="secondary" style={{ marginTop: 8 }}>
            Tap to change photo
          </Text>
        </View>

        {/* Basic Info */}
        <Card variant="elevated" style={styles.section}>
          <Text variant="labelLarge" color="primary" style={styles.sectionTitle}>
            Basic Information
          </Text>

          <View style={styles.inputGroup}>
            <Text variant="labelMedium" color="secondary" style={styles.label}>
              Full Name
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.background.secondary, color: theme.colors.text.primary }]}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Enter your name"
              placeholderTextColor={theme.colors.text.tertiary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text variant="labelMedium" color="secondary" style={styles.label}>
              Email
            </Text>
            <TextInput
              style={[styles.input, styles.inputDisabled, { backgroundColor: theme.colors.background.secondary, color: theme.colors.text.tertiary }]}
              value={user?.email || ''}
              editable={false}
            />
            <Text variant="caption" color="tertiary" style={styles.hint}>
              Email cannot be changed
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text variant="labelMedium" color="secondary" style={styles.label}>
              Phone Number
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.background.secondary, color: theme.colors.text.primary }]}
              value={phone}
              onChangeText={setPhone}
              placeholder="+92 300 1234567"
              placeholderTextColor={theme.colors.text.tertiary}
              keyboardType="phone-pad"
            />
          </View>
        </Card>

        {/* Professional Info (Lawyers only) */}
        {isLawyer && (
          <Card variant="elevated" style={styles.section}>
            <Text variant="labelLarge" color="primary" style={styles.sectionTitle}>
              Professional Information
            </Text>

            <View style={styles.inputGroup}>
              <Text variant="labelMedium" color="secondary" style={styles.label}>
                Bio / About
              </Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: theme.colors.background.secondary, color: theme.colors.text.primary }]}
                value={bio}
                onChangeText={setBio}
                placeholder="Tell clients about yourself..."
                placeholderTextColor={theme.colors.text.tertiary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text variant="labelMedium" color="secondary" style={styles.label}>
                Years of Experience
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.background.secondary, color: theme.colors.text.primary }]}
                value={experienceYears}
                onChangeText={setExperienceYears}
                placeholder="e.g., 10"
                placeholderTextColor={theme.colors.text.tertiary}
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text variant="labelMedium" color="secondary" style={styles.label}>
                  Hourly Rate (PKR)
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.background.secondary, color: theme.colors.text.primary }]}
                  value={hourlyRate}
                  onChangeText={setHourlyRate}
                  placeholder="5000"
                  placeholderTextColor={theme.colors.text.tertiary}
                  keyboardType="number-pad"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text variant="labelMedium" color="secondary" style={styles.label}>
                  Consultation Fee
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.background.secondary, color: theme.colors.text.primary }]}
                  value={consultationFee}
                  onChangeText={setConsultationFee}
                  placeholder="2000"
                  placeholderTextColor={theme.colors.text.tertiary}
                  keyboardType="number-pad"
                />
              </View>
            </View>
          </Card>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 70,
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  section: {
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  inputDisabled: {
    opacity: 0.6,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  hint: {
    marginTop: 4,
    marginLeft: 4,
  },
  row: {
    flexDirection: 'row',
  },
});

export default EditProfileScreen;
