/**
 * INSAF - Submit Bid Screen
 *
 * Allows lawyers to submit a bid on a case
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { Text } from '../../components/common/Text';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { createBid } from '../../services/bid.service';
import { getCaseById, Case, AreaOfLaw } from '../../services/case.service';
import { useAuth } from '../../context/AuthContext';

// Navigation types
type SubmitBidScreenRouteProp = RouteProp<
  { SubmitBid: { caseId: string } },
  'SubmitBid'
>;

// Fee Type options
type FeeType = 'FIXED' | 'HOURLY';

// Timeline options
const TIMELINE_OPTIONS = [
  '1-2 weeks',
  '2-4 weeks',
  '1-2 months',
  '2-3 months',
  '3-6 months',
  '6+ months',
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

export const SubmitBidScreen: React.FC = () => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<SubmitBidScreenRouteProp>();
  const { currentUser } = useAuth();

  const { caseId } = route.params;

  // State
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [proposedFee, setProposedFee] = useState('');
  const [feeType, setFeeType] = useState<FeeType>('FIXED');
  const [estimatedTimeline, setEstimatedTimeline] = useState('');
  const [proposalText, setProposalText] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTimelinePicker, setShowTimelinePicker] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Load case data
  useEffect(() => {
    loadCaseData();
  }, [caseId]);

  // Entrance animations
  useEffect(() => {
    if (caseData) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [caseData]);

  const loadCaseData = async () => {
    try {
      setLoading(true);
      const fetchedCase = await getCaseById(caseId);
      if (fetchedCase) {
        setCaseData(fetchedCase);
      } else {
        Alert.alert('Error', 'Case not found');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading case:', error);
      Alert.alert('Error', 'Failed to load case details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate proposed fee
    if (!proposedFee.trim()) {
      newErrors.proposedFee = 'Proposed fee is required';
    } else {
      const feeValue = parseFloat(proposedFee);
      if (isNaN(feeValue) || feeValue <= 0) {
        newErrors.proposedFee = 'Please enter a valid fee amount';
      } else if (caseData && (feeValue < caseData.budgetMin || feeValue > caseData.budgetMax)) {
        newErrors.proposedFee = `Fee must be within budget range (${formatBudget(caseData.budgetMin, caseData.budgetMax)})`;
      }
    }

    // Validate timeline
    if (!estimatedTimeline) {
      newErrors.estimatedTimeline = 'Please select an estimated timeline';
    }

    // Validate proposal text
    if (!proposalText.trim()) {
      newErrors.proposalText = 'Proposal text is required';
    } else if (proposalText.trim().length < 100) {
      newErrors.proposalText = `Proposal must be at least 100 characters (currently ${proposalText.trim().length})`;
    }

    // Validate terms
    if (!termsAccepted) {
      newErrors.terms = 'You must accept the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit bid
  const handleSubmitBid = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill all required fields correctly.');
      return;
    }

    if (!currentUser?.uid) {
      Alert.alert('Error', 'You must be logged in to submit a bid');
      return;
    }

    try {
      setSubmitting(true);

      await createBid(currentUser.uid, {
        caseId,
        proposedFee: parseFloat(proposedFee),
        feeType,
        estimatedTimeline,
        proposalText: proposalText.trim(),
      });

      Alert.alert(
        'Success',
        'Your bid has been submitted successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error submitting bid:', error);
      Alert.alert('Error', error.message || 'Failed to submit bid');
    } finally {
      setSubmitting(false);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: theme.colors.background.primary },
        ]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={theme.colors.brand.primary}
          />
          <Text variant="bodySmall" color="secondary" style={styles.loadingText}>
            Loading case details...
          </Text>
        </View>
      </View>
    );
  }

  if (!caseData) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background.primary },
      ]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 16,
            backgroundColor: theme.colors.surface.primary,
            borderBottomColor: theme.colors.border.default,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={theme.colors.text.primary}
          />
        </TouchableOpacity>
        <Text variant="h3" color="primary" style={styles.headerTitle}>
          Submit Bid
        </Text>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            {/* Case Summary Card */}
            <Card variant="elevated" style={styles.caseSummaryCard}>
              <View style={styles.caseSummaryHeader}>
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
                    {formatAreaOfLaw(caseData.areaOfLaw)}
                  </Text>
                </View>
                <Text variant="caption" color="secondary">
                  {caseData.caseNumber}
                </Text>
              </View>

              <Text variant="h3" color="primary" style={styles.caseTitle}>
                {caseData.title}
              </Text>

              <View style={styles.caseInfoRow}>
                <View style={styles.caseInfoItem}>
                  <Ionicons
                    name="cash-outline"
                    size={16}
                    color={theme.colors.brand.primary}
                  />
                  <Text variant="bodySmall" color="secondary" style={styles.caseInfoText}>
                    {formatBudget(caseData.budgetMin, caseData.budgetMax)}
                  </Text>
                </View>
                <View style={styles.caseInfoItem}>
                  <Ionicons
                    name="location-outline"
                    size={16}
                    color={theme.colors.text.secondary}
                  />
                  <Text variant="bodySmall" color="secondary" style={styles.caseInfoText}>
                    {caseData.location}
                  </Text>
                </View>
              </View>
            </Card>

            {/* Bid Form */}
            <Card variant="elevated" style={styles.formCard}>
              <Text variant="h4" color="primary" style={styles.sectionTitle}>
                Your Bid Details
              </Text>

              {/* Proposed Fee */}
              <View style={styles.inputGroup}>
                <Text variant="labelMedium" color="primary" style={styles.inputLabel}>
                  Proposed Fee *
                </Text>
                <View
                  style={[
                    styles.feeInputContainer,
                    {
                      backgroundColor: theme.colors.input.background,
                      borderColor: errors.proposedFee
                        ? theme.colors.status.error
                        : theme.colors.border.default,
                    },
                  ]}
                >
                  <Text
                    variant="bodyLarge"
                    style={[
                      styles.currencyPrefix,
                      { color: theme.colors.text.secondary },
                    ]}
                  >
                    PKR
                  </Text>
                  <TextInput
                    style={[
                      styles.feeInput,
                      { color: theme.colors.text.primary },
                    ]}
                    value={proposedFee}
                    onChangeText={setProposedFee}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={theme.colors.text.tertiary}
                  />
                </View>
                {errors.proposedFee && (
                  <Text variant="caption" style={styles.errorText}>
                    {errors.proposedFee}
                  </Text>
                )}
              </View>

              {/* Fee Type Selector */}
              <View style={styles.inputGroup}>
                <Text variant="labelMedium" color="primary" style={styles.inputLabel}>
                  Fee Type *
                </Text>
                <View style={styles.feeTypeContainer}>
                  <TouchableOpacity
                    style={[
                      styles.feeTypeOption,
                      {
                        backgroundColor:
                          feeType === 'FIXED'
                            ? theme.colors.brand.primary
                            : theme.colors.surface.secondary,
                        borderColor:
                          feeType === 'FIXED'
                            ? theme.colors.brand.primary
                            : theme.colors.border.default,
                      },
                    ]}
                    onPress={() => setFeeType('FIXED')}
                  >
                    <Ionicons
                      name={feeType === 'FIXED' ? 'checkmark-circle' : 'ellipse-outline'}
                      size={20}
                      color={feeType === 'FIXED' ? '#FFFFFF' : theme.colors.text.secondary}
                    />
                    <Text
                      variant="labelMedium"
                      style={{
                        color: feeType === 'FIXED' ? '#FFFFFF' : theme.colors.text.primary,
                        marginLeft: 8,
                      }}
                    >
                      Fixed Fee
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.feeTypeOption,
                      {
                        backgroundColor:
                          feeType === 'HOURLY'
                            ? theme.colors.brand.primary
                            : theme.colors.surface.secondary,
                        borderColor:
                          feeType === 'HOURLY'
                            ? theme.colors.brand.primary
                            : theme.colors.border.default,
                      },
                    ]}
                    onPress={() => setFeeType('HOURLY')}
                  >
                    <Ionicons
                      name={feeType === 'HOURLY' ? 'checkmark-circle' : 'ellipse-outline'}
                      size={20}
                      color={feeType === 'HOURLY' ? '#FFFFFF' : theme.colors.text.secondary}
                    />
                    <Text
                      variant="labelMedium"
                      style={{
                        color: feeType === 'HOURLY' ? '#FFFFFF' : theme.colors.text.primary,
                        marginLeft: 8,
                      }}
                    >
                      Hourly Rate
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Estimated Timeline */}
              <View style={styles.inputGroup}>
                <Text variant="labelMedium" color="primary" style={styles.inputLabel}>
                  Estimated Timeline *
                </Text>
                <TouchableOpacity
                  style={[
                    styles.timelineSelector,
                    {
                      backgroundColor: theme.colors.input.background,
                      borderColor: errors.estimatedTimeline
                        ? theme.colors.status.error
                        : theme.colors.border.default,
                    },
                  ]}
                  onPress={() => setShowTimelinePicker(!showTimelinePicker)}
                >
                  <Text
                    variant="bodyMedium"
                    style={{
                      color: estimatedTimeline
                        ? theme.colors.text.primary
                        : theme.colors.text.tertiary,
                    }}
                  >
                    {estimatedTimeline || 'Select timeline'}
                  </Text>
                  <Ionicons
                    name={showTimelinePicker ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={theme.colors.text.secondary}
                  />
                </TouchableOpacity>
                {errors.estimatedTimeline && (
                  <Text variant="caption" style={styles.errorText}>
                    {errors.estimatedTimeline}
                  </Text>
                )}

                {/* Timeline Picker */}
                {showTimelinePicker && (
                  <View
                    style={[
                      styles.timelinePicker,
                      {
                        backgroundColor: theme.colors.surface.primary,
                        borderColor: theme.colors.border.default,
                      },
                    ]}
                  >
                    {TIMELINE_OPTIONS.map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={[
                          styles.timelineOption,
                          {
                            backgroundColor:
                              estimatedTimeline === option
                                ? `${theme.colors.brand.primary}15`
                                : 'transparent',
                          },
                        ]}
                        onPress={() => {
                          setEstimatedTimeline(option);
                          setShowTimelinePicker(false);
                        }}
                      >
                        <Text
                          variant="bodyMedium"
                          style={{
                            color:
                              estimatedTimeline === option
                                ? theme.colors.brand.primary
                                : theme.colors.text.primary,
                          }}
                        >
                          {option}
                        </Text>
                        {estimatedTimeline === option && (
                          <Ionicons
                            name="checkmark"
                            size={20}
                            color={theme.colors.brand.primary}
                          />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Proposal Text */}
              <View style={styles.inputGroup}>
                <View style={styles.proposalHeader}>
                  <Text variant="labelMedium" color="primary" style={styles.inputLabel}>
                    Your Proposal *
                  </Text>
                  <Text
                    variant="caption"
                    style={{
                      color:
                        proposalText.length < 100
                          ? theme.colors.status.error
                          : theme.colors.status.success,
                    }}
                  >
                    {proposalText.length}/100 min
                  </Text>
                </View>
                <TextInput
                  style={[
                    styles.proposalInput,
                    {
                      backgroundColor: theme.colors.input.background,
                      borderColor: errors.proposalText
                        ? theme.colors.status.error
                        : theme.colors.border.default,
                      color: theme.colors.text.primary,
                    },
                  ]}
                  value={proposalText}
                  onChangeText={setProposalText}
                  multiline
                  numberOfLines={8}
                  textAlignVertical="top"
                  placeholder="Explain why you're the best fit for this case. Include your relevant experience, approach, and what makes your bid competitive..."
                  placeholderTextColor={theme.colors.text.tertiary}
                />
                {errors.proposalText && (
                  <Text variant="caption" style={styles.errorText}>
                    {errors.proposalText}
                  </Text>
                )}
              </View>
            </Card>

            {/* Terms Checkbox */}
            <Card variant="outlined" style={styles.termsCard}>
              <TouchableOpacity
                style={styles.termsRow}
                onPress={() => setTermsAccepted(!termsAccepted)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      backgroundColor: termsAccepted
                        ? theme.colors.brand.primary
                        : theme.colors.surface.primary,
                      borderColor: errors.terms
                        ? theme.colors.status.error
                        : termsAccepted
                        ? theme.colors.brand.primary
                        : theme.colors.border.default,
                    },
                  ]}
                >
                  {termsAccepted && (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  )}
                </View>
                <Text variant="bodySmall" color="secondary" style={styles.termsText}>
                  I agree to the{' '}
                  <Text variant="bodySmall" style={{ color: theme.colors.brand.primary }}>
                    Terms & Conditions
                  </Text>{' '}
                  and understand that my bid is binding once accepted by the client.
                </Text>
              </TouchableOpacity>
              {errors.terms && (
                <Text variant="caption" style={[styles.errorText, { marginLeft: 32 }]}>
                  {errors.terms}
                </Text>
              )}
            </Card>

            {/* Submit Button */}
            <Button
              title={submitting ? 'Submitting...' : 'Submit Bid'}
              onPress={handleSubmitBid}
              variant="primary"
              size="lg"
              fullWidth
              disabled={submitting}
              loading={submitting}
              style={styles.submitButton}
            />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
  },
  caseSummaryCard: {
    padding: 16,
    marginBottom: 20,
  },
  caseSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  areaOfLawBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  caseTitle: {
    marginBottom: 12,
  },
  caseInfoRow: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  caseInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  caseInfoText: {
    marginLeft: 2,
  },
  formCard: {
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    marginBottom: 8,
  },
  feeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 2,
    paddingHorizontal: 16,
    height: 56,
  },
  currencyPrefix: {
    marginRight: 8,
  },
  feeInput: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  feeTypeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  feeTypeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  timelineSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
  },
  timelinePicker: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  timelineOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  proposalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  proposalInput: {
    borderRadius: 12,
    borderWidth: 2,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 150,
  },
  termsCard: {
    padding: 16,
    marginBottom: 20,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  termsText: {
    flex: 1,
    marginLeft: 12,
    lineHeight: 20,
  },
  submitButton: {
    marginBottom: 20,
  },
  errorText: {
    color: '#EF4444',
    marginTop: 4,
  },
});

export default SubmitBidScreen;
