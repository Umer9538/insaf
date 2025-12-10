/**
 * INSAF - Create Case Screen
 *
 * Form to create a new legal case
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useAppTheme } from '../../context/ThemeContext';
import { Text } from '../../components/common/Text';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { useAuth } from '../../context/AuthContext';
import { createCase, postCase, AreaOfLaw } from '../../services/case.service';
import { uploadCaseDocument } from '../../services/storage.service';

// Document interface
interface UploadedDocument {
  name: string;
  size: number;
  uri: string;
  mimeType: string;
  uploading?: boolean;
  uploadProgress?: number;
  downloadUrl?: string;
}

// Case Categories mapped to AreaOfLaw
const CATEGORIES: { id: AreaOfLaw; name: string; icon: string }[] = [
  { id: 'CRIMINAL_LAW', name: 'Criminal', icon: 'shield' },
  { id: 'FAMILY_LAW', name: 'Family', icon: 'people' },
  { id: 'CORPORATE_LAW', name: 'Corporate', icon: 'business' },
  { id: 'PROPERTY_LAW', name: 'Property', icon: 'home' },
  { id: 'CIVIL_LAW', name: 'Civil', icon: 'document-text' },
  { id: 'TAX_LAW', name: 'Tax', icon: 'cash' },
  { id: 'LABOR_LAW', name: 'Labor', icon: 'briefcase' },
  { id: 'OTHER', name: 'Other', icon: 'ellipsis-horizontal' },
];

// Urgency Levels
const URGENCY_LEVELS: { id: 'NORMAL' | 'URGENT'; name: string; description: string; color: string }[] = [
  { id: 'NORMAL', name: 'Normal', description: 'Standard timeline, can wait', color: '#4CAF50' },
  { id: 'URGENT', name: 'Urgent', description: 'Need immediate attention', color: '#EF4444' },
];

export const CreateCaseScreen: React.FC = () => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user } = useAuth();

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<AreaOfLaw | null>(null);
  const [urgency, setUrgency] = useState<'NORMAL' | 'URGENT'>('NORMAL');
  const [budget, setBudget] = useState('');
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Case title is required';
    } else if (title.length < 10) {
      newErrors.title = 'Title must be at least 10 characters';
    }

    if (!description.trim()) {
      newErrors.description = 'Description is required';
    } else if (description.length < 50) {
      newErrors.description = 'Description must be at least 50 characters';
    }

    if (!category) {
      newErrors.category = 'Please select a category';
    }

    if (!budget.trim()) {
      newErrors.budget = 'Budget is required';
    } else if (isNaN(Number(budget)) || Number(budget) < 1000) {
      newErrors.budget = 'Minimum budget is Rs. 1,000';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill all required fields correctly.');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to create a case.');
      return;
    }

    setIsLoading(true);
    try {
      // Create case in Firebase
      const budgetAmount = Number(budget);
      const caseId = await createCase(user.uid, {
        title: title.trim(),
        description: description.trim(),
        areaOfLaw: category!,
        serviceType: 'FULL_CASE_HANDLING',
        budgetMin: budgetAmount,
        budgetMax: budgetAmount * 1.5, // Allow bids up to 50% above budget
        urgency: urgency,
        location: 'Pakistan', // Default location
      });

      // Upload documents if any
      if (documents.length > 0) {
        const uploadPromises = documents.map(async (doc) => {
          try {
            const response = await fetch(doc.uri);
            const blob = await response.blob();
            const downloadUrl = await uploadCaseDocument(caseId, blob, doc.name);
            return { name: doc.name, url: downloadUrl, size: doc.size };
          } catch (uploadError) {
            console.error(`Error uploading ${doc.name}:`, uploadError);
            return null;
          }
        });

        const uploadedDocs = await Promise.all(uploadPromises);
        const successfulUploads = uploadedDocs.filter((d) => d !== null);
        console.log(`Uploaded ${successfulUploads.length} of ${documents.length} documents`);
      }

      // Post the case immediately (make it visible for bidding)
      await postCase(caseId);

      Alert.alert(
        'Case Created!',
        documents.length > 0
          ? `Your case has been submitted with ${documents.length} document(s). Lawyers will start bidding soon.`
          : 'Your case has been submitted successfully. Lawyers will start bidding soon.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error creating case:', error);
      Alert.alert('Error', 'Failed to create case. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (result.canceled) return;

      // Add new documents to the list
      const newDocs: UploadedDocument[] = result.assets.map((asset) => ({
        name: asset.name,
        size: asset.size || 0,
        uri: asset.uri,
        mimeType: asset.mimeType || 'application/octet-stream',
        uploading: false,
      }));

      // Check file size (max 10MB)
      const oversizedDocs = newDocs.filter((doc) => doc.size > 10 * 1024 * 1024);
      if (oversizedDocs.length > 0) {
        Alert.alert('File Too Large', 'Some files exceed the 10MB limit and were not added.');
        const validDocs = newDocs.filter((doc) => doc.size <= 10 * 1024 * 1024);
        setDocuments([...documents, ...validDocs]);
      } else {
        setDocuments([...documents, ...newDocs]);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    }
  };

  const handleRemoveDocument = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return 'document-text';
    if (mimeType.includes('image')) return 'image';
    if (mimeType.includes('word')) return 'document';
    return 'document-outline';
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      {/* Header */}
      <LinearGradient
        colors={theme.colors.gradient.primary as [string, string]}
        style={[styles.header, { paddingTop: insets.top }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text variant="h3" style={styles.headerTitle}>Create New Case</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title */}
          <View>
            <Input
              label="Case Title"
              value={title}
              onChangeText={(text) => {
                setTitle(text);
                if (errors.title) setErrors({ ...errors, title: '' });
              }}
              error={errors.title}
              placeholder="Brief title describing your legal matter"
              maxLength={100}
            />
          </View>

          {/* Category */}
          <View>
            <Text variant="labelMedium" color="primary" style={styles.label}>
              Category *
            </Text>
            {errors.category && (
              <Text variant="caption" style={styles.errorText}>{errors.category}</Text>
            )}
            <View style={styles.categoriesGrid}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor: category === cat.id
                        ? theme.colors.brand.primary
                        : theme.colors.surface.secondary,
                    },
                  ]}
                  onPress={() => {
                    setCategory(cat.id);
                    if (errors.category) setErrors({ ...errors, category: '' });
                  }}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={18}
                    color={category === cat.id ? '#FFFFFF' : theme.colors.text.secondary}
                  />
                  <Text
                    variant="labelSmall"
                    style={{
                      color: category === cat.id ? '#FFFFFF' : theme.colors.text.secondary,
                      marginLeft: 6,
                    }}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Description */}
          <View>
            <Input
              label="Description"
              value={description}
              onChangeText={(text) => {
                setDescription(text);
                if (errors.description) setErrors({ ...errors, description: '' });
              }}
              error={errors.description}
              placeholder="Describe your legal issue in detail. Include relevant dates, parties involved, and desired outcome."
              multiline
              numberOfLines={5}
              maxLength={1000}
            />
            <Text variant="caption" color="tertiary" style={styles.charCount}>
              {description.length}/1000
            </Text>
          </View>

          {/* Urgency */}
          <View>
            <Text variant="labelMedium" color="primary" style={styles.label}>
              Urgency Level
            </Text>
            <View style={styles.urgencyContainer}>
              {URGENCY_LEVELS.map((level) => (
                <TouchableOpacity
                  key={level.id}
                  style={[
                    styles.urgencyOption,
                    {
                      backgroundColor: theme.colors.surface.primary,
                      borderColor: urgency === level.id ? level.color : theme.colors.border.light,
                      borderWidth: urgency === level.id ? 2 : 1,
                    },
                  ]}
                  onPress={() => setUrgency(level.id)}
                >
                  <View style={[styles.urgencyDot, { backgroundColor: level.color }]} />
                  <View style={styles.urgencyInfo}>
                    <Text variant="labelMedium" color="primary">{level.name}</Text>
                    <Text variant="caption" color="tertiary">{level.description}</Text>
                  </View>
                  {urgency === level.id && (
                    <Ionicons name="checkmark-circle" size={20} color={level.color} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Budget */}
          <View>
            <Input
              label="Budget (Rs.)"
              value={budget}
              onChangeText={(text) => {
                setBudget(text.replace(/[^0-9]/g, ''));
                if (errors.budget) setErrors({ ...errors, budget: '' });
              }}
              error={errors.budget}
              placeholder="Your estimated budget"
              keyboardType="numeric"
              leftIcon="cash-outline"
            />
            <Text variant="caption" color="tertiary" style={styles.budgetHint}>
              This is your estimated budget. Lawyers will bid based on this amount.
            </Text>
          </View>

          {/* Documents */}
          <View>
            <Text variant="labelMedium" color="primary" style={styles.label}>
              Supporting Documents (Optional)
            </Text>

            {/* Display selected documents */}
            {documents.length > 0 && (
              <View style={styles.documentsList}>
                {documents.map((doc, index) => (
                  <View
                    key={`${doc.name}-${index}`}
                    style={[styles.documentItem, { backgroundColor: theme.colors.surface.primary }]}
                  >
                    <View style={[styles.docIconContainer, { backgroundColor: `${theme.colors.brand.primary}15` }]}>
                      <Ionicons
                        name={getFileIcon(doc.mimeType) as any}
                        size={24}
                        color={theme.colors.brand.primary}
                      />
                    </View>
                    <View style={styles.docDetails}>
                      <Text variant="labelSmall" color="primary" numberOfLines={1}>
                        {doc.name}
                      </Text>
                      <Text variant="caption" color="tertiary">
                        {formatFileSize(doc.size)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.removeDocButton}
                      onPress={() => handleRemoveDocument(index)}
                    >
                      <Ionicons name="close-circle" size={22} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <Card style={styles.documentsCard}>
              <TouchableOpacity style={styles.uploadArea} onPress={handleAddDocument}>
                <Ionicons name="cloud-upload-outline" size={40} color={theme.colors.text.tertiary} />
                <Text variant="labelMedium" color="secondary" style={{ marginTop: 12 }}>
                  {documents.length > 0 ? 'Add more documents' : 'Tap to upload documents'}
                </Text>
                <Text variant="caption" color="tertiary" style={{ marginTop: 4 }}>
                  PDF, DOC, JPG up to 10MB
                </Text>
              </TouchableOpacity>
            </Card>
          </View>

          {/* Submit Button */}
          <View style={styles.submitContainer}>
            <Button
              title="Submit Case"
              variant="gradient"
              size="lg"
              fullWidth
              loading={isLoading}
              onPress={handleSubmit}
            />
            <Text variant="caption" color="tertiary" style={styles.termsText}>
              By submitting, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>

          <View style={{ height: 40 }} />
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
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
  },
  content: {
    padding: 20,
  },
  label: {
    marginBottom: 12,
    marginTop: 16,
  },
  errorText: {
    color: '#EF4444',
    marginBottom: 8,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  charCount: {
    textAlign: 'right',
    marginTop: 4,
  },
  urgencyContainer: {
    gap: 10,
  },
  urgencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  urgencyDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  urgencyInfo: {
    flex: 1,
    marginLeft: 12,
  },
  budgetHint: {
    marginTop: 8,
  },
  documentsCard: {
    padding: 0,
    overflow: 'hidden',
  },
  uploadArea: {
    alignItems: 'center',
    padding: 32,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 12,
    margin: 4,
  },
  submitContainer: {
    marginTop: 32,
  },
  termsText: {
    textAlign: 'center',
    marginTop: 16,
  },
  documentsList: {
    gap: 10,
    marginBottom: 16,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  docIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docDetails: {
    flex: 1,
    marginLeft: 12,
  },
  removeDocButton: {
    padding: 4,
  },
});

export default CreateCaseScreen;
