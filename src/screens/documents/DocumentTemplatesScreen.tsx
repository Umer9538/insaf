/**
 * INSAF - Document Templates Screen
 *
 * Displays available legal document templates with category filtering
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { Text } from '../../components/common/Text';
import { Card } from '../../components/common/Card';
import {
  getDocumentTemplates,
  DocumentTemplate,
  TemplateCategory,
  Language,
  getLocalizedText,
} from '../../services/documentGeneration.service';

const { width } = Dimensions.get('window');

// Category filter options
const CATEGORIES: { id: TemplateCategory | 'ALL'; name: { en: string; ur: string }; icon: string }[] = [
  { id: 'ALL', name: { en: 'All', ur: 'سب' }, icon: 'apps' },
  { id: 'POWER_OF_ATTORNEY', name: { en: 'Power of Attorney', ur: 'وکالت نامہ' }, icon: 'document-text' },
  { id: 'SWORN_STATEMENT', name: { en: 'Affidavits', ur: 'حلف نامے' }, icon: 'shield-checkmark' },
  { id: 'NOTICE', name: { en: 'Notices', ur: 'نوٹس' }, icon: 'alert-circle' },
  { id: 'AGREEMENT', name: { en: 'Agreements', ur: 'معاہدے' }, icon: 'home' },
];

export const DocumentTemplatesScreen: React.FC = () => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { caseId } = route.params || {};

  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<DocumentTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'ALL'>('ALL');
  const [language, setLanguage] = useState<Language>('en');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch templates
  const fetchTemplates = useCallback(async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    try {
      const fetchedTemplates = await getDocumentTemplates();
      setTemplates(fetchedTemplates);
      setFilteredTemplates(fetchedTemplates);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Filter templates by category
  useEffect(() => {
    if (selectedCategory === 'ALL') {
      setFilteredTemplates(templates);
    } else {
      setFilteredTemplates(templates.filter((t) => t.category === selectedCategory));
    }
  }, [selectedCategory, templates]);

  // Handle refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTemplates(false);
  }, [fetchTemplates]);

  // Toggle language
  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'ur' : 'en'));
  };

  // Navigate to generator
  const handleTemplateSelect = (template: DocumentTemplate) => {
    navigation.navigate('DocumentGenerator', {
      templateId: template.id,
      language,
      caseId,
    });
  };

  // Navigate to my documents
  const handleMyDocuments = () => {
    navigation.navigate('MyDocuments');
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background.primary }]}>
        <ActivityIndicator size="large" color={theme.colors.brand.primary} />
        <Text variant="bodySmall" color="secondary" style={{ marginTop: 12 }}>
          Loading templates...
        </Text>
      </View>
    );
  }

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
            <Text variant="h3" style={styles.headerTitle}>
              {language === 'en' ? 'Legal Documents' : 'قانونی دستاویزات'}
            </Text>
            <Text variant="caption" style={styles.headerSubtitle}>
              {language === 'en' ? 'Generate official documents' : 'سرکاری دستاویزات بنائیں'}
            </Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.langButton} onPress={toggleLanguage}>
              <Text variant="labelSmall" style={styles.langText}>
                {language === 'en' ? 'اردو' : 'EN'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleMyDocuments}>
              <Ionicons name="folder-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.brand.primary}
          />
        }
      >
        {/* Category Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryChip,
                {
                  backgroundColor:
                    selectedCategory === cat.id
                      ? theme.colors.brand.primary
                      : theme.colors.surface.secondary,
                },
              ]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Ionicons
                name={cat.icon as any}
                size={16}
                color={selectedCategory === cat.id ? '#FFFFFF' : theme.colors.text.secondary}
              />
              <Text
                variant="labelSmall"
                style={{
                  color: selectedCategory === cat.id ? '#FFFFFF' : theme.colors.text.secondary,
                  marginLeft: 6,
                }}
              >
                {getLocalizedText(cat.name, language)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Templates Grid */}
        <View style={styles.content}>
          <Text variant="h4" color="primary" style={styles.sectionTitle}>
            {language === 'en' ? 'Available Templates' : 'دستیاب ٹیمپلیٹس'}
            <Text variant="bodySmall" color="secondary">
              {' '}
              ({filteredTemplates.length})
            </Text>
          </Text>

          <View style={styles.templatesGrid}>
            {filteredTemplates.map((template) => (
              <TouchableOpacity
                key={template.id}
                style={styles.templateCardWrapper}
                onPress={() => handleTemplateSelect(template)}
                activeOpacity={0.7}
              >
                <Card style={styles.templateCard}>
                  <View
                    style={[
                      styles.templateIcon,
                      { backgroundColor: `${theme.colors.brand.primary}15` },
                    ]}
                  >
                    <Ionicons
                      name={template.icon as any}
                      size={32}
                      color={theme.colors.brand.primary}
                    />
                  </View>
                  <Text
                    variant="labelLarge"
                    color="primary"
                    style={styles.templateName}
                    numberOfLines={2}
                  >
                    {getLocalizedText(template.name, language)}
                  </Text>
                  <Text
                    variant="caption"
                    color="secondary"
                    style={styles.templateDesc}
                    numberOfLines={2}
                  >
                    {getLocalizedText(template.description, language)}
                  </Text>
                  {template.price === 0 ? (
                    <View
                      style={[
                        styles.priceBadge,
                        { backgroundColor: `${theme.colors.status.success}15` },
                      ]}
                    >
                      <Text
                        variant="caption"
                        style={{ color: theme.colors.status.success }}
                      >
                        {language === 'en' ? 'Free' : 'مفت'}
                      </Text>
                    </View>
                  ) : (
                    <View
                      style={[
                        styles.priceBadge,
                        { backgroundColor: `${theme.colors.brand.primary}15` },
                      ]}
                    >
                      <Text
                        variant="caption"
                        style={{ color: theme.colors.brand.primary }}
                      >
                        Rs. {template.price}
                      </Text>
                    </View>
                  )}
                </Card>
              </TouchableOpacity>
            ))}
          </View>

          {filteredTemplates.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons
                name="document-outline"
                size={48}
                color={theme.colors.text.tertiary}
              />
              <Text variant="bodyMedium" color="secondary" style={{ marginTop: 12 }}>
                {language === 'en'
                  ? 'No templates in this category'
                  : 'اس زمرے میں کوئی ٹیمپلیٹ نہیں'}
              </Text>
            </View>
          )}
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Card style={{ ...styles.infoCard, backgroundColor: `${theme.colors.brand.primary}08` }}>
            <Ionicons name="information-circle" size={24} color={theme.colors.brand.primary} />
            <View style={styles.infoContent}>
              <Text variant="labelMedium" color="primary">
                {language === 'en' ? 'How it works' : 'یہ کیسے کام کرتا ہے'}
              </Text>
              <Text variant="caption" color="secondary" style={{ marginTop: 4 }}>
                {language === 'en'
                  ? 'Select a template, fill in the required details, preview your document, and download as PDF.'
                  : 'ایک ٹیمپلیٹ منتخب کریں، مطلوبہ تفصیلات بھریں، پیش نظارہ کریں، اور پی ڈی ایف ڈاؤن لوڈ کریں۔'}
              </Text>
            </View>
          </Card>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  headerActions: {
    flexDirection: 'row',
    gap: 8,
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
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
  },
  content: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  templatesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  templateCardWrapper: {
    width: (width - 52) / 2,
    marginHorizontal: 6,
    marginBottom: 12,
  },
  templateCard: {
    padding: 16,
    alignItems: 'center',
  },
  templateIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  templateName: {
    textAlign: 'center',
    marginBottom: 6,
  },
  templateDesc: {
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 8,
  },
  priceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  infoSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  infoCard: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'flex-start',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
});

export default DocumentTemplatesScreen;
