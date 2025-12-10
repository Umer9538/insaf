/**
 * INSAF - Document Generator Screen
 *
 * Dynamic form to fill template fields and generate document
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAppTheme } from '../../context/ThemeContext';
import { Text } from '../../components/common/Text';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import {
  getTemplateById,
  generateDocumentContent,
  saveGeneratedDocument,
  DocumentTemplate,
  TemplateField,
  Language,
  getLocalizedText,
  formatCNIC,
  formatDateForDocument,
} from '../../services/documentGeneration.service';

// Group fields by section
const groupFieldsBySection = (fields: TemplateField[]): Map<string, TemplateField[]> => {
  const groups = new Map<string, TemplateField[]>();
  fields
    .sort((a, b) => a.order - b.order)
    .forEach((field) => {
      const section = field.section || 'general';
      if (!groups.has(section)) {
        groups.set(section, []);
      }
      groups.get(section)!.push(field);
    });
  return groups;
};

// Section titles
const SECTION_TITLES: Record<string, { en: string; ur: string }> = {
  client: { en: 'Client Information', ur: 'موکل کی معلومات' },
  lawyer: { en: 'Lawyer Information', ur: 'وکیل کی معلومات' },
  case: { en: 'Case Details', ur: 'مقدمے کی تفصیلات' },
  document: { en: 'Document Details', ur: 'دستاویز کی تفصیلات' },
  declarant: { en: 'Declarant Information', ur: 'حلف دہندہ کی معلومات' },
  declaration: { en: 'Declaration', ur: 'اعلان' },
  sender: { en: 'Sender Information', ur: 'بھیجنے والے کی معلومات' },
  recipient: { en: 'Recipient Information', ur: 'وصول کنندہ کی معلومات' },
  notice: { en: 'Notice Content', ur: 'نوٹس کا مواد' },
  landlord: { en: 'Landlord Information', ur: 'مالک مکان کی معلومات' },
  tenant: { en: 'Tenant Information', ur: 'کرایہ دار کی معلومات' },
  property: { en: 'Property Details', ur: 'جائیداد کی تفصیلات' },
  financial: { en: 'Financial Terms', ur: 'مالی شرائط' },
  period: { en: 'Agreement Period', ur: 'معاہدے کی مدت' },
  additional: { en: 'Additional Terms', ur: 'اضافی شرائط' },
  general: { en: 'General Information', ur: 'عمومی معلومات' },
};

export const DocumentGeneratorScreen: React.FC = () => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();

  const { templateId, language: initialLanguage = 'en', caseId } = route.params || {};

  const [template, setTemplate] = useState<DocumentTemplate | null>(null);
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState<string | null>(null);
  const [showSelectPicker, setShowSelectPicker] = useState<string | null>(null);

  // Fetch template
  const fetchTemplate = useCallback(async () => {
    if (!templateId) return;

    setIsLoading(true);
    try {
      const fetchedTemplate = await getTemplateById(templateId);
      if (fetchedTemplate) {
        setTemplate(fetchedTemplate);
        // Initialize form data with default values
        const initialData: Record<string, any> = {};
        fetchedTemplate.fields.forEach((field) => {
          if (field.defaultValue) {
            initialData[field.name] = field.defaultValue;
          }
        });
        setFormData(initialData);
      } else {
        Alert.alert('Error', 'Template not found');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error fetching template:', error);
      Alert.alert('Error', 'Failed to load template');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  }, [templateId]);

  useEffect(() => {
    fetchTemplate();
  }, [fetchTemplate]);

  // Update field value
  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
    // Clear error when user types
    if (errors[fieldName]) {
      setErrors((prev) => ({ ...prev, [fieldName]: '' }));
    }
  };

  // Format CNIC input
  const handleCNICChange = (fieldName: string, value: string) => {
    const formatted = formatCNIC(value);
    handleFieldChange(fieldName, formatted);
  };

  // Handle date selection
  const handleDateChange = (fieldName: string, _event: unknown, date?: Date) => {
    setShowDatePicker(null);
    if (date) {
      handleFieldChange(fieldName, formatDateForDocument(date, language));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    if (!template) return false;

    const newErrors: Record<string, string> = {};

    template.fields.forEach((field) => {
      const value = formData[field.name];

      // Required validation
      if (field.validation.required && (!value || value.trim() === '')) {
        newErrors[field.name] = language === 'en' ? 'This field is required' : 'یہ فیلڈ ضروری ہے';
        return;
      }

      if (value) {
        // Min length validation
        if (field.validation.minLength && value.length < field.validation.minLength) {
          newErrors[field.name] =
            language === 'en'
              ? `Minimum ${field.validation.minLength} characters required`
              : `کم از کم ${field.validation.minLength} حروف درکار ہیں`;
          return;
        }

        // Max length validation
        if (field.validation.maxLength && value.length > field.validation.maxLength) {
          newErrors[field.name] =
            language === 'en'
              ? `Maximum ${field.validation.maxLength} characters allowed`
              : `زیادہ سے زیادہ ${field.validation.maxLength} حروف کی اجازت ہے`;
          return;
        }

        // Pattern validation
        if (field.validation.pattern) {
          const regex = new RegExp(field.validation.pattern);
          if (!regex.test(value)) {
            newErrors[field.name] = field.validation.patternMessage
              ? getLocalizedText(field.validation.patternMessage, language)
              : language === 'en'
              ? 'Invalid format'
              : 'غلط فارمیٹ';
          }
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Generate document
  const handleGenerate = async () => {
    if (!validateForm() || !template || !user) {
      Alert.alert(
        language === 'en' ? 'Validation Error' : 'توثیق کی خرابی',
        language === 'en'
          ? 'Please fill all required fields correctly'
          : 'براہ کرم تمام ضروری فیلڈز صحیح طریقے سے بھریں'
      );
      return;
    }

    setIsGenerating(true);
    try {
      // Generate document content
      const generatedContent = generateDocumentContent(template, formData, language);

      // Create title
      const title = `${getLocalizedText(template.name, language)} - ${new Date().toLocaleDateString()}`;

      // Save to Firestore
      const documentId = await saveGeneratedDocument(
        user.uid,
        template.id,
        template.templateType,
        title,
        formData,
        generatedContent,
        language,
        caseId
      );

      // Navigate to preview
      navigation.replace('DocumentPreview', {
        documentId,
        language,
      });
    } catch (error) {
      console.error('Error generating document:', error);
      Alert.alert(
        language === 'en' ? 'Error' : 'خرابی',
        language === 'en' ? 'Failed to generate document' : 'دستاویز بنانے میں ناکامی'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Render field based on type
  const renderField = (field: TemplateField) => {
    const value = formData[field.name] || '';
    const error = errors[field.name];

    switch (field.type) {
      case 'textarea':
        return (
          <View key={field.id} style={styles.fieldContainer}>
            <Text variant="labelMedium" color="primary" style={styles.fieldLabel}>
              {getLocalizedText(field.label, language)}
              {field.validation.required && <Text style={{ color: '#EF4444' }}> *</Text>}
            </Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: theme.colors.input.background,
                  borderColor: error ? theme.colors.status.error : theme.colors.border.light,
                  color: theme.colors.text.primary,
                  textAlign: language === 'ur' ? 'right' : 'left',
                },
              ]}
              value={value}
              onChangeText={(text) => handleFieldChange(field.name, text)}
              placeholder={getLocalizedText(field.placeholder, language)}
              placeholderTextColor={theme.colors.text.tertiary}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              maxLength={field.validation.maxLength}
            />
            {error && <Text variant="caption" style={styles.errorText}>{error}</Text>}
            {field.validation.maxLength && (
              <Text variant="caption" color="tertiary" style={styles.charCount}>
                {value.length}/{field.validation.maxLength}
              </Text>
            )}
          </View>
        );

      case 'date':
        return (
          <View key={field.id} style={styles.fieldContainer}>
            <Text variant="labelMedium" color="primary" style={styles.fieldLabel}>
              {getLocalizedText(field.label, language)}
              {field.validation.required && <Text style={{ color: '#EF4444' }}> *</Text>}
            </Text>
            <TouchableOpacity
              style={[
                styles.dateInput,
                {
                  backgroundColor: theme.colors.input.background,
                  borderColor: error ? theme.colors.status.error : theme.colors.border.light,
                },
              ]}
              onPress={() => setShowDatePicker(field.name)}
            >
              <Text
                variant="bodyMedium"
                style={{ color: value ? theme.colors.text.primary : theme.colors.text.tertiary }}
              >
                {value || getLocalizedText(field.placeholder, language)}
              </Text>
              <Ionicons name="calendar-outline" size={20} color={theme.colors.text.secondary} />
            </TouchableOpacity>
            {error && <Text variant="caption" style={styles.errorText}>{error}</Text>}
            {showDatePicker === field.name && (
              <DateTimePicker
                value={new Date()}
                mode="date"
                display="default"
                onChange={(event, date) => handleDateChange(field.name, event, date)}
              />
            )}
          </View>
        );

      case 'select':
        return (
          <View key={field.id} style={styles.fieldContainer}>
            <Text variant="labelMedium" color="primary" style={styles.fieldLabel}>
              {getLocalizedText(field.label, language)}
              {field.validation.required && <Text style={{ color: '#EF4444' }}> *</Text>}
            </Text>
            <TouchableOpacity
              style={[
                styles.selectInput,
                {
                  backgroundColor: theme.colors.input.background,
                  borderColor: error ? theme.colors.status.error : theme.colors.border.light,
                },
              ]}
              onPress={() => setShowSelectPicker(showSelectPicker === field.name ? null : field.name)}
            >
              <Text
                variant="bodyMedium"
                style={{ color: value ? theme.colors.text.primary : theme.colors.text.tertiary }}
              >
                {value
                  ? getLocalizedText(
                      field.options?.find((o) => o.value === value)?.label || { en: value, ur: value },
                      language
                    )
                  : getLocalizedText(field.placeholder, language)}
              </Text>
              <Ionicons
                name={showSelectPicker === field.name ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={theme.colors.text.secondary}
              />
            </TouchableOpacity>
            {showSelectPicker === field.name && (
              <View
                style={[
                  styles.selectOptions,
                  {
                    backgroundColor: theme.colors.surface.primary,
                    borderColor: theme.colors.border.light,
                  },
                ]}
              >
                {field.options?.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.selectOption,
                      {
                        backgroundColor:
                          value === option.value ? `${theme.colors.brand.primary}15` : 'transparent',
                      },
                    ]}
                    onPress={() => {
                      handleFieldChange(field.name, option.value);
                      setShowSelectPicker(null);
                    }}
                  >
                    <Text
                      variant="bodyMedium"
                      style={{
                        color:
                          value === option.value
                            ? theme.colors.brand.primary
                            : theme.colors.text.primary,
                      }}
                    >
                      {getLocalizedText(option.label, language)}
                    </Text>
                    {value === option.value && (
                      <Ionicons name="checkmark" size={20} color={theme.colors.brand.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {error && <Text variant="caption" style={styles.errorText}>{error}</Text>}
          </View>
        );

      case 'cnic':
        return (
          <View key={field.id} style={styles.fieldContainer}>
            <Text variant="labelMedium" color="primary" style={styles.fieldLabel}>
              {getLocalizedText(field.label, language)}
              {field.validation.required && <Text style={{ color: '#EF4444' }}> *</Text>}
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: theme.colors.input.background,
                  borderColor: error ? theme.colors.status.error : theme.colors.border.light,
                  color: theme.colors.text.primary,
                },
              ]}
              value={value}
              onChangeText={(text) => handleCNICChange(field.name, text)}
              placeholder={getLocalizedText(field.placeholder, language)}
              placeholderTextColor={theme.colors.text.tertiary}
              keyboardType="numeric"
              maxLength={15}
            />
            {error && <Text variant="caption" style={styles.errorText}>{error}</Text>}
          </View>
        );

      case 'number':
        return (
          <View key={field.id} style={styles.fieldContainer}>
            <Text variant="labelMedium" color="primary" style={styles.fieldLabel}>
              {getLocalizedText(field.label, language)}
              {field.validation.required && <Text style={{ color: '#EF4444' }}> *</Text>}
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: theme.colors.input.background,
                  borderColor: error ? theme.colors.status.error : theme.colors.border.light,
                  color: theme.colors.text.primary,
                },
              ]}
              value={value}
              onChangeText={(text) => handleFieldChange(field.name, text.replace(/[^0-9]/g, ''))}
              placeholder={getLocalizedText(field.placeholder, language)}
              placeholderTextColor={theme.colors.text.tertiary}
              keyboardType="numeric"
            />
            {error && <Text variant="caption" style={styles.errorText}>{error}</Text>}
          </View>
        );

      case 'phone':
        return (
          <View key={field.id} style={styles.fieldContainer}>
            <Text variant="labelMedium" color="primary" style={styles.fieldLabel}>
              {getLocalizedText(field.label, language)}
              {field.validation.required && <Text style={{ color: '#EF4444' }}> *</Text>}
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: theme.colors.input.background,
                  borderColor: error ? theme.colors.status.error : theme.colors.border.light,
                  color: theme.colors.text.primary,
                },
              ]}
              value={value}
              onChangeText={(text) => handleFieldChange(field.name, text)}
              placeholder={getLocalizedText(field.placeholder, language)}
              placeholderTextColor={theme.colors.text.tertiary}
              keyboardType="phone-pad"
            />
            {error && <Text variant="caption" style={styles.errorText}>{error}</Text>}
          </View>
        );

      default: // text, address
        return (
          <View key={field.id} style={styles.fieldContainer}>
            <Text variant="labelMedium" color="primary" style={styles.fieldLabel}>
              {getLocalizedText(field.label, language)}
              {field.validation.required && <Text style={{ color: '#EF4444' }}> *</Text>}
            </Text>
            <TextInput
              style={[
                styles.textInput,
                field.type === 'address' && styles.addressInput,
                {
                  backgroundColor: theme.colors.input.background,
                  borderColor: error ? theme.colors.status.error : theme.colors.border.light,
                  color: theme.colors.text.primary,
                  textAlign: language === 'ur' ? 'right' : 'left',
                },
              ]}
              value={value}
              onChangeText={(text) => handleFieldChange(field.name, text)}
              placeholder={getLocalizedText(field.placeholder, language)}
              placeholderTextColor={theme.colors.text.tertiary}
              multiline={field.type === 'address'}
              numberOfLines={field.type === 'address' ? 2 : 1}
              maxLength={field.validation.maxLength}
            />
            {error && <Text variant="caption" style={styles.errorText}>{error}</Text>}
          </View>
        );
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background.primary }]}>
        <ActivityIndicator size="large" color={theme.colors.brand.primary} />
        <Text variant="bodySmall" color="secondary" style={{ marginTop: 12 }}>
          Loading template...
        </Text>
      </View>
    );
  }

  if (!template) return null;

  const groupedFields = groupFieldsBySection(template.fields);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      {/* Header */}
      <LinearGradient
        colors={theme.colors.gradient.primary as [string, string]}
        style={[styles.header, { paddingTop: insets.top }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text variant="h3" style={styles.headerTitle} numberOfLines={1}>
              {getLocalizedText(template.name, language)}
            </Text>
            <Text variant="caption" style={styles.headerSubtitle}>
              {language === 'en' ? 'Fill in the details' : 'تفصیلات بھریں'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.langButton}
            onPress={() => setLanguage((prev) => (prev === 'en' ? 'ur' : 'en'))}
          >
            <Text variant="labelSmall" style={styles.langText}>
              {language === 'en' ? 'اردو' : 'EN'}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Form Sections */}
          {Array.from(groupedFields.entries()).map(([section, fields]) => (
            <Card key={section} style={styles.sectionCard}>
              <Text variant="labelLarge" color="primary" style={styles.sectionTitle}>
                {getLocalizedText(SECTION_TITLES[section] || { en: section, ur: section }, language)}
              </Text>
              {fields.map(renderField)}
            </Card>
          ))}

          {/* Generate Button */}
          <View style={styles.buttonContainer}>
            <Button
              title={
                isGenerating
                  ? language === 'en'
                    ? 'Generating...'
                    : 'بنایا جا رہا ہے...'
                  : language === 'en'
                  ? 'Generate Document'
                  : 'دستاویز بنائیں'
              }
              variant="gradient"
              size="lg"
              fullWidth
              onPress={handleGenerate}
              disabled={isGenerating}
              icon={isGenerating ? undefined : 'document-text'}
            />
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    color: '#FFFFFF',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  langButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  langText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  sectionCard: {
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  addressInput: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  textArea: {
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    minHeight: 120,
  },
  dateInput: {
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectInput: {
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectOptions: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  selectOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  errorText: {
    color: '#EF4444',
    marginTop: 4,
  },
  charCount: {
    textAlign: 'right',
    marginTop: 4,
  },
  buttonContainer: {
    marginTop: 8,
  },
});

export default DocumentGeneratorScreen;
