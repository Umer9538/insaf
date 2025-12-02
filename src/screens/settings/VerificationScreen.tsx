/**
 * INSAF - Verification Screen
 *
 * Shows verification status and allows document upload for verification
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import { useAppTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Text } from '../../components/common/Text';
import { Card } from '../../components/common/Card';
import { getLawyerProfile, submitForVerification, LawyerProfile, VerificationStatus } from '../../services/lawyer.service';

interface VerificationStep {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  documentKey: keyof LawyerProfile['documents'];
  required: boolean;
}

const VERIFICATION_STEPS: VerificationStep[] = [
  {
    id: 'barIdFront',
    title: 'Bar Council ID (Front)',
    description: 'Upload the front side of your Bar Council ID',
    icon: 'card-outline',
    documentKey: 'barIdFront',
    required: true,
  },
  {
    id: 'barIdBack',
    title: 'Bar Council ID (Back)',
    description: 'Upload the back side of your Bar Council ID',
    icon: 'card-outline',
    documentKey: 'barIdBack',
    required: true,
  },
  {
    id: 'license',
    title: 'Law License',
    description: 'Upload your valid law license certificate',
    icon: 'document-text-outline',
    documentKey: 'license',
    required: true,
  },
  {
    id: 'cnicFront',
    title: 'CNIC (Front)',
    description: 'Upload the front side of your CNIC',
    icon: 'id-card-outline',
    documentKey: 'cnicFront',
    required: true,
  },
  {
    id: 'cnicBack',
    title: 'CNIC (Back)',
    description: 'Upload the back side of your CNIC',
    icon: 'id-card-outline',
    documentKey: 'cnicBack',
    required: true,
  },
  {
    id: 'photo',
    title: 'Professional Photo',
    description: 'Upload a professional headshot photo',
    icon: 'person-circle-outline',
    documentKey: 'photo',
    required: false,
  },
];

export const VerificationScreen: React.FC = () => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profile, setProfile] = useState<LawyerProfile | null>(null);
  const [documents, setDocuments] = useState<Partial<LawyerProfile['documents']>>({});

  const isLawyer = user?.role === 'LAWYER' || user?.role === 'LAW_FIRM';

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.uid || !isLawyer) {
        setLoading(false);
        return;
      }

      try {
        const lawyerProfile = await getLawyerProfile(user.uid);
        if (lawyerProfile) {
          setProfile(lawyerProfile);
          setDocuments(lawyerProfile.documents || {});
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user?.uid, isLawyer]);

  const getStatusColor = (status: VerificationStatus): string => {
    switch (status) {
      case 'VERIFIED':
        return '#4CAF50';
      case 'UNDER_REVIEW':
        return '#FF9800';
      case 'REJECTED':
        return '#EF4444';
      default:
        return theme.colors.text.tertiary;
    }
  };

  const getStatusIcon = (status: VerificationStatus): keyof typeof Ionicons.glyphMap => {
    switch (status) {
      case 'VERIFIED':
        return 'checkmark-circle';
      case 'UNDER_REVIEW':
        return 'time';
      case 'REJECTED':
        return 'close-circle';
      default:
        return 'ellipse-outline';
    }
  };

  const getStatusText = (status: VerificationStatus): string => {
    switch (status) {
      case 'VERIFIED':
        return 'Verified';
      case 'UNDER_REVIEW':
        return 'Under Review';
      case 'REJECTED':
        return 'Rejected';
      default:
        return 'Pending';
    }
  };

  const handlePickDocument = async (step: VerificationStep) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      // TODO: Upload to storage and get URL
      setDocuments(prev => ({
        ...prev,
        [step.documentKey]: file.uri,
      }));

      Alert.alert('Success', `${step.title} uploaded successfully`);
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleSubmitForVerification = async () => {
    if (!user?.uid) return;

    // Check if all required documents are uploaded
    const missingDocs = VERIFICATION_STEPS.filter(
      step => step.required && !documents[step.documentKey]
    );

    if (missingDocs.length > 0) {
      Alert.alert(
        'Missing Documents',
        `Please upload the following documents:\n${missingDocs.map(d => d.title).join('\n')}`
      );
      return;
    }

    setSubmitting(true);
    try {
      await submitForVerification(user.uid, documents as LawyerProfile['documents']);
      Alert.alert('Success', 'Documents submitted for verification. We will review them within 24-48 hours.');
      // Refresh profile
      const updatedProfile = await getLawyerProfile(user.uid);
      if (updatedProfile) {
        setProfile(updatedProfile);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit documents. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: theme.colors.background.primary }]}>
        <ActivityIndicator size="large" color={theme.colors.brand.primary} />
      </View>
    );
  }

  if (!isLawyer) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text variant="h3" color="primary">Verification</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.clientMessage}>
          <Ionicons name="shield-checkmark" size={64} color={theme.colors.brand.primary} />
          <Text variant="h4" color="primary" style={{ marginTop: 16, textAlign: 'center' }}>
            Account Verified
          </Text>
          <Text variant="bodyMedium" color="secondary" style={{ marginTop: 8, textAlign: 'center' }}>
            Your client account is automatically verified. No additional verification is required.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text variant="h3" color="primary">Verification</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <Card variant="elevated" style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={[styles.statusIcon, { backgroundColor: `${getStatusColor(profile?.verificationStatus || 'PENDING')}20` }]}>
              <Ionicons
                name={getStatusIcon(profile?.verificationStatus || 'PENDING')}
                size={32}
                color={getStatusColor(profile?.verificationStatus || 'PENDING')}
              />
            </View>
            <View style={styles.statusInfo}>
              <Text variant="labelMedium" color="secondary">Verification Status</Text>
              <Text variant="h4" style={{ color: getStatusColor(profile?.verificationStatus || 'PENDING') }}>
                {getStatusText(profile?.verificationStatus || 'PENDING')}
              </Text>
            </View>
          </View>

          {profile?.verificationStatus === 'VERIFIED' && profile.verifiedAt && (
            <Text variant="caption" color="tertiary" style={styles.verifiedDate}>
              Verified on {new Date(profile.verifiedAt.toDate()).toLocaleDateString()}
            </Text>
          )}

          {profile?.verificationStatus === 'REJECTED' && (
            <View style={styles.rejectionInfo}>
              <Ionicons name="warning" size={16} color="#EF4444" />
              <Text variant="bodySmall" color="error" style={{ marginLeft: 8, flex: 1 }}>
                Your verification was rejected. Please re-upload your documents with correct information.
              </Text>
            </View>
          )}
        </Card>

        {/* Document Upload Steps */}
        {profile?.verificationStatus !== 'VERIFIED' && (
          <>
            <Text variant="h4" color="primary" style={styles.sectionTitle}>
              Required Documents
            </Text>

            {VERIFICATION_STEPS.map((step, index) => (
              <Card key={step.id} variant="elevated" style={styles.stepCard}>
                <TouchableOpacity
                  style={styles.stepContent}
                  onPress={() => handlePickDocument(step)}
                  disabled={profile?.verificationStatus === 'UNDER_REVIEW'}
                >
                  <View style={[styles.stepNumber, { backgroundColor: documents[step.documentKey] ? '#4CAF50' : theme.colors.brand.primary }]}>
                    {documents[step.documentKey] ? (
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    ) : (
                      <Text variant="labelMedium" style={{ color: '#FFFFFF' }}>{index + 1}</Text>
                    )}
                  </View>

                  <View style={styles.stepInfo}>
                    <View style={styles.stepTitleRow}>
                      <Text variant="labelLarge" color="primary">{step.title}</Text>
                      {step.required && (
                        <Text variant="caption" color="error" style={{ marginLeft: 4 }}>*</Text>
                      )}
                    </View>
                    <Text variant="bodySmall" color="secondary">{step.description}</Text>
                    {documents[step.documentKey] && (
                      <Text variant="caption" color="success" style={{ marginTop: 4 }}>
                        Document uploaded
                      </Text>
                    )}
                  </View>

                  <Ionicons
                    name={documents[step.documentKey] ? 'checkmark-circle' : 'cloud-upload-outline'}
                    size={24}
                    color={documents[step.documentKey] ? '#4CAF50' : theme.colors.text.tertiary}
                  />
                </TouchableOpacity>
              </Card>
            ))}

            {/* Submit Button */}
            {profile?.verificationStatus !== 'UNDER_REVIEW' && (
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmitForVerification}
                disabled={submitting}
              >
                <LinearGradient
                  colors={['#1a365d', '#2d4a7c']}
                  style={styles.submitGradient}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="shield-checkmark" size={20} color="#FFFFFF" />
                      <Text variant="labelLarge" style={styles.submitText}>
                        Submit for Verification
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}

            {profile?.verificationStatus === 'UNDER_REVIEW' && (
              <View style={styles.underReviewMessage}>
                <Ionicons name="time" size={20} color="#FF9800" />
                <Text variant="bodyMedium" color="secondary" style={{ marginLeft: 8, flex: 1 }}>
                  Your documents are being reviewed. This usually takes 24-48 hours.
                </Text>
              </View>
            )}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statusCard: {
    padding: 20,
    marginBottom: 24,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusInfo: {
    marginLeft: 16,
    flex: 1,
  },
  verifiedDate: {
    marginTop: 12,
    textAlign: 'center',
  },
  rejectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  stepCard: {
    marginBottom: 12,
  },
  stepContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepInfo: {
    flex: 1,
    marginHorizontal: 16,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitButton: {
    marginTop: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  submitText: {
    color: '#FFFFFF',
  },
  underReviewMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    marginTop: 24,
  },
  clientMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
});

export default VerificationScreen;
