/**
 * INSAF - Document Preview Screen
 *
 * Preview generated document with download/share options
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { useAppTheme } from '../../context/ThemeContext';
import { Text } from '../../components/common/Text';
import { Button } from '../../components/common/Button';
import {
  getGeneratedDocumentById,
  generatePDF,
  sharePDF,
  uploadPDFToStorage,
  updateDocumentStatus,
  GeneratedDocument,
  Language,
  getLocalizedText,
} from '../../services/documentGeneration.service';
import { useAuth } from '../../context/AuthContext';

const { width, height } = Dimensions.get('window');

export const DocumentPreviewScreen: React.FC = () => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();
  const webViewRef = useRef<WebView>(null);

  const { documentId, language: initialLanguage = 'en' } = route.params || {};

  const [document, setDocument] = useState<GeneratedDocument | null>(null);
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [pdfUri, setPdfUri] = useState<string | null>(null);

  // Fetch document
  const fetchDocument = useCallback(async () => {
    if (!documentId) return;

    setIsLoading(true);
    try {
      const fetchedDocument = await getGeneratedDocumentById(documentId);
      if (fetchedDocument) {
        setDocument(fetchedDocument);
        setLanguage(fetchedDocument.language);
      } else {
        Alert.alert('Error', 'Document not found');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error fetching document:', error);
      Alert.alert('Error', 'Failed to load document');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    fetchDocument();
  }, [fetchDocument]);

  // Handle download
  const handleDownload = async () => {
    if (!document || !user) return;

    setIsDownloading(true);
    try {
      // Generate PDF
      const uri = await generatePDF(document.generatedContent, document.title);
      setPdfUri(uri);

      // Upload to Firebase Storage
      const downloadUrl = await uploadPDFToStorage(user.uid, document.id!, uri);

      // Update document status
      await updateDocumentStatus(document.id!, 'DOWNLOADED', downloadUrl);

      // Share the PDF
      await sharePDF(uri);

      Alert.alert(
        language === 'en' ? 'Success' : 'کامیابی',
        language === 'en'
          ? 'Document downloaded successfully!'
          : 'دستاویز کامیابی سے ڈاؤن لوڈ ہو گئی!'
      );
    } catch (error) {
      console.error('Error downloading document:', error);
      Alert.alert(
        language === 'en' ? 'Error' : 'خرابی',
        language === 'en' ? 'Failed to download document' : 'دستاویز ڈاؤن لوڈ کرنے میں ناکامی'
      );
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle share (if PDF already exists)
  const handleShare = async () => {
    if (!document) return;

    setIsSharing(true);
    try {
      let uri = pdfUri;

      // Generate PDF if not already done
      if (!uri) {
        uri = await generatePDF(document.generatedContent, document.title);
        setPdfUri(uri);
      }

      await sharePDF(uri);

      // Update status if not already downloaded
      if (document.status !== 'DOWNLOADED' && document.status !== 'SHARED') {
        await updateDocumentStatus(document.id!, 'SHARED');
      }
    } catch (error) {
      console.error('Error sharing document:', error);
      Alert.alert(
        language === 'en' ? 'Error' : 'خرابی',
        language === 'en' ? 'Failed to share document' : 'دستاویز شیئر کرنے میں ناکامی'
      );
    } finally {
      setIsSharing(false);
    }
  };

  // Handle edit
  const handleEdit = () => {
    if (!document) return;

    navigation.replace('DocumentGenerator', {
      templateId: document.templateId,
      language: document.language,
      draftId: document.id,
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background.primary }]}>
        <ActivityIndicator size="large" color={theme.colors.brand.primary} />
        <Text variant="bodySmall" color="secondary" style={{ marginTop: 12 }}>
          {language === 'en' ? 'Loading preview...' : 'پیش نظارہ لوڈ ہو رہا ہے...'}
        </Text>
      </View>
    );
  }

  if (!document) return null;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      {/* Header */}
      <LinearGradient
        colors={theme.colors.gradient.primary as [string, string]}
        style={[styles.header, { paddingTop: insets.top }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text variant="h3" style={styles.headerTitle} numberOfLines={1}>
              {language === 'en' ? 'Preview' : 'پیش نظارہ'}
            </Text>
            <Text variant="caption" style={styles.headerSubtitle} numberOfLines={1}>
              {document.title}
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

      {/* Document Preview */}
      <View style={styles.previewContainer}>
        <WebView
          ref={webViewRef}
          source={{ html: document.generatedContent }}
          style={styles.webView}
          originWhitelist={['*']}
          scalesPageToFit={true}
          showsVerticalScrollIndicator={true}
          javaScriptEnabled={false}
        />
      </View>

      {/* Action Buttons */}
      <View style={[styles.actionBar, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.surface.secondary }]}
            onPress={handleEdit}
          >
            <Ionicons name="create-outline" size={22} color={theme.colors.text.primary} />
            <Text variant="caption" color="primary" style={{ marginTop: 4 }}>
              {language === 'en' ? 'Edit' : 'ترمیم'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.surface.secondary }]}
            onPress={handleShare}
            disabled={isSharing}
          >
            {isSharing ? (
              <ActivityIndicator size="small" color={theme.colors.brand.primary} />
            ) : (
              <>
                <Ionicons name="share-outline" size={22} color={theme.colors.text.primary} />
                <Text variant="caption" color="primary" style={{ marginTop: 4 }}>
                  {language === 'en' ? 'Share' : 'شیئر'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <Button
          title={
            isDownloading
              ? language === 'en'
                ? 'Downloading...'
                : 'ڈاؤن لوڈ ہو رہا ہے...'
              : language === 'en'
              ? 'Download PDF'
              : 'پی ڈی ایف ڈاؤن لوڈ کریں'
          }
          variant="gradient"
          size="lg"
          fullWidth
          onPress={handleDownload}
          disabled={isDownloading || isSharing}
          icon={isDownloading ? undefined : 'download-outline'}
          style={{ marginTop: 12 }}
        />
      </View>

      {/* Success Badge for Downloaded Documents */}
      {document.status === 'DOWNLOADED' && (
        <View style={[styles.statusBadge, { backgroundColor: theme.colors.status.successBg }]}>
          <Ionicons name="checkmark-circle" size={16} color={theme.colors.status.success} />
          <Text variant="caption" style={{ color: theme.colors.status.success, marginLeft: 6 }}>
            {language === 'en' ? 'Downloaded' : 'ڈاؤن لوڈ شدہ'}
          </Text>
        </View>
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
    paddingBottom: 16,
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
  previewContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  webView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  actionBar: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  statusBadge: {
    position: 'absolute',
    top: 120,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
});

export default DocumentPreviewScreen;
