/**
 * INSAF - Documents Screen
 *
 * Displays and manages user's uploaded documents
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useAppTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Text } from '../../components/common/Text';
import { Card } from '../../components/common/Card';
import { getLawyerProfile, LawyerProfile } from '../../services/lawyer.service';

interface Document {
  id: string;
  name: string;
  type: 'image' | 'pdf' | 'document';
  category: string;
  uploadedAt: Date;
  size: string;
  url?: string;
}

const DOCUMENT_CATEGORIES = [
  { id: 'all', label: 'All Documents' },
  { id: 'verification', label: 'Verification' },
  { id: 'cases', label: 'Case Documents' },
  { id: 'contracts', label: 'Contracts' },
  { id: 'other', label: 'Other' },
];

export const DocumentsScreen: React.FC = () => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [profile, setProfile] = useState<LawyerProfile | null>(null);

  const isLawyer = user?.role === 'LAWYER' || user?.role === 'LAW_FIRM';

  useEffect(() => {
    fetchDocuments();
  }, [user?.uid]);

  const fetchDocuments = async () => {
    if (!user?.uid) return;

    try {
      if (isLawyer) {
        const lawyerProfile = await getLawyerProfile(user.uid);
        if (lawyerProfile) {
          setProfile(lawyerProfile);
          // Convert profile documents to document list
          const docs: Document[] = [];
          if (lawyerProfile.documents) {
            const docTypes = [
              { key: 'barIdFront', name: 'Bar Council ID (Front)', category: 'verification' },
              { key: 'barIdBack', name: 'Bar Council ID (Back)', category: 'verification' },
              { key: 'license', name: 'Law License', category: 'verification' },
              { key: 'cnicFront', name: 'CNIC (Front)', category: 'verification' },
              { key: 'cnicBack', name: 'CNIC (Back)', category: 'verification' },
              { key: 'photo', name: 'Professional Photo', category: 'verification' },
            ];

            docTypes.forEach((docType, index) => {
              const url = lawyerProfile.documents[docType.key as keyof typeof lawyerProfile.documents];
              if (url) {
                docs.push({
                  id: docType.key,
                  name: docType.name,
                  type: docType.key === 'photo' ? 'image' : 'document',
                  category: docType.category,
                  uploadedAt: lawyerProfile.updatedAt?.toDate() || new Date(),
                  size: 'N/A',
                  url: url,
                });
              }
            });
          }
          setDocuments(docs);
        }
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDocuments();
  };

  const handleUploadDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      // TODO: Upload to storage and save document reference
      Alert.alert('Success', `Document "${file.name}" uploaded successfully`);
      fetchDocuments();
    } catch (error) {
      Alert.alert('Error', 'Failed to upload document');
    }
  };

  const handleDeleteDocument = (doc: Document) => {
    Alert.alert(
      'Delete Document',
      `Are you sure you want to delete "${doc.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // TODO: Delete from storage
            Alert.alert('Success', 'Document deleted');
            fetchDocuments();
          },
        },
      ]
    );
  };

  const getDocumentIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'image':
        return 'image-outline';
      case 'pdf':
        return 'document-text-outline';
      default:
        return 'document-outline';
    }
  };

  const filteredDocuments = selectedCategory === 'all'
    ? documents
    : documents.filter(doc => doc.category === selectedCategory);

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: theme.colors.background.primary }]}>
        <ActivityIndicator size="large" color={theme.colors.brand.primary} />
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
        <Text variant="h3" color="primary">My Documents</Text>
        <TouchableOpacity style={styles.uploadButton} onPress={handleUploadDocument}>
          <Ionicons name="add" size={24} color={theme.colors.brand.primary} />
        </TouchableOpacity>
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryContainer}
        contentContainerStyle={styles.categoryContent}
      >
        {DOCUMENT_CATEGORIES.map(category => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryChip,
              {
                backgroundColor: selectedCategory === category.id
                  ? theme.colors.brand.primary
                  : theme.colors.background.secondary,
              },
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Text
              variant="labelMedium"
              style={{
                color: selectedCategory === category.id
                  ? '#FFFFFF'
                  : theme.colors.text.secondary,
              }}
            >
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {filteredDocuments.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="folder-open-outline" size={64} color={theme.colors.text.tertiary} />
            <Text variant="h4" color="secondary" style={{ marginTop: 16, textAlign: 'center' }}>
              No Documents
            </Text>
            <Text variant="bodyMedium" color="tertiary" style={{ marginTop: 8, textAlign: 'center' }}>
              {selectedCategory === 'all'
                ? 'Upload your first document to get started'
                : `No documents in this category`}
            </Text>
            <TouchableOpacity
              style={[styles.emptyUploadButton, { backgroundColor: theme.colors.brand.primary }]}
              onPress={handleUploadDocument}
            >
              <Ionicons name="cloud-upload-outline" size={20} color="#FFFFFF" />
              <Text variant="labelMedium" style={{ color: '#FFFFFF', marginLeft: 8 }}>
                Upload Document
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text variant="labelMedium" color="tertiary" style={styles.countText}>
              {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''}
            </Text>

            {filteredDocuments.map(doc => (
              <Card key={doc.id} variant="elevated" style={styles.documentCard}>
                <TouchableOpacity style={styles.documentContent}>
                  <View style={[styles.documentIcon, { backgroundColor: theme.colors.background.secondary }]}>
                    <Ionicons
                      name={getDocumentIcon(doc.type)}
                      size={24}
                      color={theme.colors.brand.primary}
                    />
                  </View>

                  <View style={styles.documentInfo}>
                    <Text variant="labelLarge" color="primary" numberOfLines={1}>
                      {doc.name}
                    </Text>
                    <Text variant="caption" color="tertiary">
                      {doc.uploadedAt.toLocaleDateString()} • {doc.size}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.moreButton}
                    onPress={() => handleDeleteDocument(doc)}
                  >
                    <Ionicons name="trash-outline" size={20} color={theme.colors.text.tertiary} />
                  </TouchableOpacity>
                </TouchableOpacity>
              </Card>
            ))}
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
  uploadButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  categoryContainer: {
    maxHeight: 50,
  },
  categoryContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 16,
  },
  countText: {
    marginBottom: 16,
  },
  documentCard: {
    marginBottom: 12,
  },
  documentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
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
    marginHorizontal: 16,
  },
  moreButton: {
    padding: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 24,
  },
});

export default DocumentsScreen;
