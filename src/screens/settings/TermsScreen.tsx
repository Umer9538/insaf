/**
 * INSAF - Terms of Service Screen
 *
 * Display terms of service and user agreements
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { Text } from '../../components/common/Text';
import { Card } from '../../components/common/Card';

const TERMS_SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    content: `By accessing and using the INSAF platform ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not access or use the Service.

INSAF provides a marketplace connecting clients seeking legal services with licensed legal professionals in Pakistan. The Service facilitates communication, case management, and payment processing between parties.`,
  },
  {
    title: '2. User Accounts',
    content: `2.1 Registration: You must create an account to use certain features of the Service. You agree to provide accurate, current, and complete information during registration.

2.2 Account Security: You are responsible for maintaining the confidentiality of your account credentials. You must notify us immediately of any unauthorized access to your account.

2.3 Account Types: The Service offers different account types for clients and legal professionals. Legal professionals must complete verification before offering services.`,
  },
  {
    title: '3. Lawyer Verification',
    content: `3.1 Verification Requirements: Legal professionals must submit valid Bar Council ID, law license, CNIC, and professional photo for verification.

3.2 Verification Process: Our team reviews submitted documents within 24-48 hours. We reserve the right to reject or revoke verification at our discretion.

3.3 Accuracy: Legal professionals are responsible for ensuring all submitted information is accurate and current. Misrepresentation may result in account termination.`,
  },
  {
    title: '4. Services and Fees',
    content: `4.1 Platform Fee: INSAF charges a 15% platform fee on completed case payments. This fee is deducted from lawyer earnings.

4.2 Payment Processing: All payments are processed through secure escrow. Funds are released to lawyers upon case completion and client confirmation.

4.3 Withdrawal: Lawyers may withdraw earnings after a 7-day holding period. Minimum withdrawal amount is PKR 1,000.

4.4 Disputes: In case of disputes, funds are held in escrow until resolution. Our dispute resolution team will review all evidence and make a final determination.`,
  },
  {
    title: '5. User Conduct',
    content: `You agree not to:
• Provide false or misleading information
• Impersonate any person or entity
• Harass, abuse, or harm other users
• Use the Service for illegal activities
• Attempt to circumvent platform payments
• Violate any applicable laws or regulations
• Share or solicit confidential client information outside the platform`,
  },
  {
    title: '6. Intellectual Property',
    content: `6.1 Platform Content: All content, features, and functionality of the Service are owned by INSAF and protected by intellectual property laws.

6.2 User Content: You retain ownership of content you submit. By submitting content, you grant INSAF a non-exclusive license to use, display, and distribute such content.`,
  },
  {
    title: '7. Limitation of Liability',
    content: `7.1 INSAF provides the platform on an "as is" basis. We do not guarantee the quality, accuracy, or outcomes of legal services provided through the platform.

7.2 INSAF is not responsible for disputes between users, the quality of legal advice, or the outcome of legal matters.

7.3 Our liability is limited to the amount of fees paid to INSAF in the 12 months preceding the claim.`,
  },
  {
    title: '8. Termination',
    content: `8.1 We may suspend or terminate your account at any time for violations of these Terms or for any other reason at our discretion.

8.2 You may terminate your account at any time by contacting support. Pending transactions must be completed or cancelled before termination.`,
  },
  {
    title: '9. Governing Law',
    content: `These Terms are governed by the laws of Pakistan. Any disputes shall be resolved in the courts of Islamabad, Pakistan.`,
  },
  {
    title: '10. Changes to Terms',
    content: `We may modify these Terms at any time. We will notify users of significant changes via email or in-app notification. Continued use of the Service after changes constitutes acceptance of the new Terms.`,
  },
];

export const TermsScreen: React.FC = () => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text variant="h3" color="primary">Terms of Service</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Card variant="elevated" style={styles.introCard}>
          <View style={styles.introHeader}>
            <View style={[styles.iconContainer, { backgroundColor: `${theme.colors.brand.primary}20` }]}>
              <Ionicons name="document-text" size={24} color={theme.colors.brand.primary} />
            </View>
            <View style={styles.introInfo}>
              <Text variant="labelLarge" color="primary">Terms of Service</Text>
              <Text variant="caption" color="tertiary">Last updated: December 2024</Text>
            </View>
          </View>
        </Card>

        {TERMS_SECTIONS.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text variant="labelLarge" color="primary" style={styles.sectionTitle}>
              {section.title}
            </Text>
            <Text variant="bodyMedium" color="secondary" style={styles.sectionContent}>
              {section.content}
            </Text>
          </View>
        ))}

        {/* Contact */}
        <Card variant="elevated" style={styles.contactCard}>
          <Text variant="labelMedium" color="primary">Questions about our Terms?</Text>
          <Text variant="bodySmall" color="secondary" style={{ marginTop: 4 }}>
            Contact us at legal@insaf.pk
          </Text>
        </Card>

        <View style={{ height: 100 }} />
      </ScrollView>
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
  introCard: {
    marginBottom: 24,
  },
  introHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  introInfo: {
    marginLeft: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  sectionContent: {
    lineHeight: 22,
  },
  contactCard: {
    padding: 16,
    marginTop: 8,
  },
});

export default TermsScreen;
