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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { Text } from '../../components/common/Text';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';

// Case Categories
const CATEGORIES = [
  { id: 'criminal', name: 'Criminal', icon: 'shield' },
  { id: 'family', name: 'Family', icon: 'people' },
  { id: 'corporate', name: 'Corporate', icon: 'business' },
  { id: 'property', name: 'Property', icon: 'home' },
  { id: 'civil', name: 'Civil', icon: 'document-text' },
  { id: 'tax', name: 'Tax', icon: 'cash' },
  { id: 'labor', name: 'Labor', icon: 'briefcase' },
  { id: 'other', name: 'Other', icon: 'ellipsis-horizontal' },
];

// Urgency Levels
const URGENCY_LEVELS = [
  { id: 'low', name: 'Low', description: 'Can wait a few weeks', color: '#4CAF50' },
  { id: 'medium', name: 'Medium', description: 'Need within 1-2 weeks', color: '#FF9800' },
  { id: 'high', name: 'High', description: 'Urgent - need ASAP', color: '#EF4444' },
];

export const CreateCaseScreen: React.FC = () => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [urgency, setUrgency] = useState<string>('medium');
  const [budget, setBudget] = useState('');
  const [documents, setDocuments] = useState<string[]>([]);
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

    setIsLoading(true);
    try {
      // TODO: Submit case to Firebase
      await new Promise((resolve) => setTimeout(resolve, 1500));
      Alert.alert(
        'Case Created!',
        'Your case has been submitted successfully. Lawyers will start bidding soon.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to create case. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDocument = () => {
    // TODO: Implement document picker
    Alert.alert('Coming Soon', 'Document upload will be available soon.');
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
              style={{ minHeight: 120, textAlignVertical: 'top' }}
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
            <Card style={styles.documentsCard}>
              <TouchableOpacity style={styles.uploadArea} onPress={handleAddDocument}>
                <Ionicons name="cloud-upload-outline" size={40} color={theme.colors.text.tertiary} />
                <Text variant="labelMedium" color="secondary" style={{ marginTop: 12 }}>
                  Tap to upload documents
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
});

export default CreateCaseScreen;
