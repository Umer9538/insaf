/**
 * INSAF - My Documents Screen
 *
 * Displays user's generated documents
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { useAppTheme } from '../../context/ThemeContext';
import { Text } from '../../components/common/Text';
import { Card } from '../../components/common/Card';
import { useAuth } from '../../context/AuthContext';
import {
  getUserDocuments,
  deleteGeneratedDocument,
  GeneratedDocument,
  DocumentStatus,
  Language,
} from '../../services/documentGeneration.service';

// Status configuration
const STATUS_CONFIG: Record<DocumentStatus, { color: string; label: { en: string; ur: string }; icon: string }> = {
  DRAFT: { color: '#757575', label: { en: 'Draft', ur: 'مسودہ' }, icon: 'create-outline' },
  GENERATED: { color: '#2196F3', label: { en: 'Generated', ur: 'بنایا گیا' }, icon: 'document-text-outline' },
  DOWNLOADED: { color: '#4CAF50', label: { en: 'Downloaded', ur: 'ڈاؤن لوڈ شدہ' }, icon: 'download-outline' },
  SHARED: { color: '#9C27B0', label: { en: 'Shared', ur: 'شیئر شدہ' }, icon: 'share-outline' },
};

// Template type icons
const TEMPLATE_ICONS: Record<string, string> = {
  VAKALATNAMA: 'document-text',
  AFFIDAVIT: 'shield-checkmark',
  LEGAL_NOTICE: 'alert-circle',
  RENT_AGREEMENT: 'home',
};

export const MyDocumentsScreen: React.FC = () => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<GeneratedDocument[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<DocumentStatus | 'ALL'>('ALL');
  const [language, setLanguage] = useState<Language>('en');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch documents
  const fetchDocuments = useCallback(async (showLoader = true) => {
    if (!user) return;

    if (showLoader) setIsLoading(true);
    try {
      const fetchedDocuments = await getUserDocuments(user.uid);
      setDocuments(fetchedDocuments);
      setFilteredDocuments(fetchedDocuments);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Filter documents by status
  useEffect(() => {
    if (selectedStatus === 'ALL') {
      setFilteredDocuments(documents);
    } else {
      setFilteredDocuments(documents.filter((d) => d.status === selectedStatus));
    }
  }, [selectedStatus, documents]);

  // Handle refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDocuments(false);
  }, [fetchDocuments]);

  // Handle delete
  const handleDelete = (documentId: string) => {
    Alert.alert(
      language === 'en' ? 'Delete Document' : 'دستاویز حذف کریں',
      language === 'en'
        ? 'Are you sure you want to delete this document?'
        : 'کیا آپ واقعی اس دستاویز کو حذف کرنا چاہتے ہیں؟',
      [
        {
          text: language === 'en' ? 'Cancel' : 'منسوخ',
          style: 'cancel',
        },
        {
          text: language === 'en' ? 'Delete' : 'حذف کریں',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteGeneratedDocument(documentId);
              setDocuments((prev) => prev.filter((d) => d.id !== documentId));
              Alert.alert(
                language === 'en' ? 'Deleted' : 'حذف شدہ',
                language === 'en' ? 'Document deleted successfully' : 'دستاویز کامیابی سے حذف ہو گئی'
              );
            } catch (error) {
              console.error('Error deleting document:', error);
              Alert.alert(
                language === 'en' ? 'Error' : 'خرابی',
                language === 'en' ? 'Failed to delete document' : 'دستاویز حذف کرنے میں ناکامی'
              );
            }
          },
        },
      ]
    );
  };

  // Handle view document
  const handleViewDocument = (document: GeneratedDocument) => {
    navigation.navigate('DocumentPreview', {
      documentId: document.id,
      language: document.language,
    });
  };

  // Format date
  const formatDate = (timestamp: any): string => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background.primary }]}>
        <ActivityIndicator size="large" color={theme.colors.brand.primary} />
        <Text variant="bodySmall" color="secondary" style={{ marginTop: 12 }}>
          {language === 'en' ? 'Loading documents...' : 'دستاویزات لوڈ ہو رہی ہیں...'}
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
              {language === 'en' ? 'My Documents' : 'میری دستاویزات'}
            </Text>
            <Text variant="caption" style={styles.headerSubtitle}>
              {documents.length} {language === 'en' ? 'documents' : 'دستاویزات'}
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
        {/* Status Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          <TouchableOpacity
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  selectedStatus === 'ALL'
                    ? theme.colors.brand.primary
                    : theme.colors.surface.secondary,
              },
            ]}
            onPress={() => setSelectedStatus('ALL')}
          >
            <Text
              variant="labelSmall"
              style={{
                color: selectedStatus === 'ALL' ? '#FFFFFF' : theme.colors.text.secondary,
              }}
            >
              {language === 'en' ? 'All' : 'سب'}
            </Text>
          </TouchableOpacity>

          {(Object.keys(STATUS_CONFIG) as DocumentStatus[]).map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterChip,
                {
                  backgroundColor:
                    selectedStatus === status
                      ? STATUS_CONFIG[status].color
                      : theme.colors.surface.secondary,
                },
              ]}
              onPress={() => setSelectedStatus(status)}
            >
              <Ionicons
                name={STATUS_CONFIG[status].icon as any}
                size={14}
                color={selectedStatus === status ? '#FFFFFF' : theme.colors.text.secondary}
              />
              <Text
                variant="labelSmall"
                style={{
                  color: selectedStatus === status ? '#FFFFFF' : theme.colors.text.secondary,
                  marginLeft: 4,
                }}
              >
                {STATUS_CONFIG[status].label[language]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Documents List */}
        <View style={styles.content}>
          {filteredDocuments.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="folder-open-outline" size={64} color={theme.colors.text.tertiary} />
              <Text variant="bodyMedium" color="secondary" style={{ marginTop: 16 }}>
                {language === 'en' ? 'No documents found' : 'کوئی دستاویز نہیں ملی'}
              </Text>
              <Text variant="caption" color="tertiary" style={{ marginTop: 4 }}>
                {language === 'en'
                  ? 'Generate your first legal document'
                  : 'اپنی پہلی قانونی دستاویز بنائیں'}
              </Text>
              <TouchableOpacity
                style={[styles.createButton, { backgroundColor: theme.colors.brand.primary }]}
                onPress={() => navigation.navigate('DocumentTemplates')}
              >
                <Ionicons name="add" size={20} color="#FFFFFF" />
                <Text variant="labelMedium" style={{ color: '#FFFFFF', marginLeft: 8 }}>
                  {language === 'en' ? 'Create Document' : 'دستاویز بنائیں'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredDocuments.map((doc) => (
              <TouchableOpacity
                key={doc.id}
                activeOpacity={0.7}
                onPress={() => handleViewDocument(doc)}
                onLongPress={() => handleDelete(doc.id!)}
              >
                <Card style={styles.documentCard}>
                  <View style={styles.documentRow}>
                    <View
                      style={[
                        styles.documentIcon,
                        { backgroundColor: `${theme.colors.brand.primary}15` },
                      ]}
                    >
                      <Ionicons
                        name={TEMPLATE_ICONS[doc.templateType] as any || 'document-text'}
                        size={24}
                        color={theme.colors.brand.primary}
                      />
                    </View>

                    <View style={styles.documentInfo}>
                      <Text variant="labelLarge" color="primary" numberOfLines={1}>
                        {doc.title}
                      </Text>
                      <View style={styles.documentMeta}>
                        <View
                          style={[
                            styles.statusBadge,
                            { backgroundColor: `${STATUS_CONFIG[doc.status].color}15` },
                          ]}
                        >
                          <Ionicons
                            name={STATUS_CONFIG[doc.status].icon as any}
                            size={12}
                            color={STATUS_CONFIG[doc.status].color}
                          />
                          <Text
                            variant="caption"
                            style={{ color: STATUS_CONFIG[doc.status].color, marginLeft: 4 }}
                          >
                            {STATUS_CONFIG[doc.status].label[language]}
                          </Text>
                        </View>
                        <Text variant="caption" color="tertiary">
                          {formatDate(doc.createdAt)}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.moreButton}
                      onPress={() => handleDelete(doc.id!)}
                    >
                      <Ionicons name="trash-outline" size={20} color={theme.colors.status.error} />
                    </TouchableOpacity>
                  </View>

                  {doc.language && (
                    <View style={styles.langBadge}>
                      <Text variant="caption" color="secondary">
                        {doc.language === 'en' ? 'English' : 'اردو'}
                      </Text>
                    </View>
                  )}
                </Card>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Floating Action Button */}
      {filteredDocuments.length > 0 && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.colors.brand.primary }]}
          onPress={() => navigation.navigate('DocumentTemplates')}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}
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
  filterContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 10,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  content: {
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
  },
  documentCard: {
    padding: 16,
    marginBottom: 12,
  },
  documentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  documentIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  documentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  langBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  moreButton: {
    padding: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default MyDocumentsScreen;
