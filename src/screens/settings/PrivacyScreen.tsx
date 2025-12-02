/**
 * INSAF - Privacy Policy Screen
 *
 * Display privacy policy and data handling practices
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

const PRIVACY_SECTIONS = [
  {
    title: '1. Information We Collect',
    content: `We collect information you provide directly to us, including:

• Account Information: Name, email address, phone number, and password when you register.

• Profile Information: Professional details, photos, and verification documents for legal professionals.

• Case Information: Details about legal matters, documents, and communications between users.

• Payment Information: Bank account details, mobile wallet numbers for payment processing.

• Usage Data: Information about how you use our platform, including device information and log data.`,
  },
  {
    title: '2. How We Use Your Information',
    content: `We use the information we collect to:

• Provide, maintain, and improve our services
• Process transactions and send related information
• Verify the identity and credentials of legal professionals
• Send notifications about your account and activities
• Respond to your comments, questions, and support requests
• Monitor and analyze trends, usage, and activities
• Detect, investigate, and prevent fraudulent transactions and abuse
• Personalize and improve your experience`,
  },
  {
    title: '3. Information Sharing',
    content: `We may share your information in the following circumstances:

• Between Users: When you engage with other users, relevant profile and case information is shared to facilitate the service.

• Service Providers: We share information with third-party vendors who assist with payment processing, data analysis, and customer support.

• Legal Requirements: We may disclose information if required by law or in response to valid legal requests.

• Business Transfers: In connection with any merger, sale of assets, or acquisition.

• With Your Consent: We may share information with your explicit consent.`,
  },
  {
    title: '4. Data Security',
    content: `We take reasonable measures to protect your information:

• All data is encrypted in transit using TLS/SSL
• Sensitive data is encrypted at rest
• We use secure cloud infrastructure (Firebase/Google Cloud)
• Regular security audits and vulnerability assessments
• Access controls and authentication requirements

However, no method of transmission over the Internet is 100% secure. We cannot guarantee absolute security.`,
  },
  {
    title: '5. Data Retention',
    content: `We retain your information for as long as your account is active or as needed to provide services. We may retain certain information for:

• Legal and regulatory compliance
• Dispute resolution
• Fraud prevention
• Enforcing our agreements

You may request deletion of your account and personal data by contacting support.`,
  },
  {
    title: '6. Your Rights',
    content: `You have the right to:

• Access: Request a copy of your personal data
• Correction: Request correction of inaccurate information
• Deletion: Request deletion of your personal data
• Portability: Request your data in a portable format
• Opt-out: Unsubscribe from marketing communications

To exercise these rights, contact us at privacy@insaf.pk`,
  },
  {
    title: '7. Cookies and Tracking',
    content: `We use cookies and similar technologies to:

• Remember your preferences and settings
• Analyze how our platform is used
• Provide personalized content
• Measure advertising effectiveness

You can control cookie preferences through your browser settings.`,
  },
  {
    title: '8. Children\'s Privacy',
    content: `Our services are not intended for users under 18 years of age. We do not knowingly collect information from children. If you believe we have collected information from a child, please contact us immediately.`,
  },
  {
    title: '9. International Data Transfers',
    content: `Your information may be transferred to and processed in countries other than Pakistan. We ensure appropriate safeguards are in place for such transfers in compliance with applicable data protection laws.`,
  },
  {
    title: '10. Changes to Privacy Policy',
    content: `We may update this Privacy Policy from time to time. We will notify you of significant changes via email or in-app notification. Your continued use of the platform after changes constitutes acceptance of the updated policy.`,
  },
];

export const PrivacyScreen: React.FC = () => {
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
        <Text variant="h3" color="primary">Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Card variant="elevated" style={styles.introCard}>
          <View style={styles.introHeader}>
            <View style={[styles.iconContainer, { backgroundColor: `${theme.colors.brand.primary}20` }]}>
              <Ionicons name="shield-checkmark" size={24} color={theme.colors.brand.primary} />
            </View>
            <View style={styles.introInfo}>
              <Text variant="labelLarge" color="primary">Privacy Policy</Text>
              <Text variant="caption" color="tertiary">Last updated: December 2024</Text>
            </View>
          </View>
          <Text variant="bodySmall" color="secondary" style={styles.introText}>
            At INSAF, we take your privacy seriously. This policy explains how we collect, use, and protect your personal information.
          </Text>
        </Card>

        {PRIVACY_SECTIONS.map((section, index) => (
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
          <View style={styles.contactRow}>
            <Ionicons name="mail-outline" size={20} color={theme.colors.brand.primary} />
            <View style={styles.contactInfo}>
              <Text variant="labelMedium" color="primary">Privacy Questions?</Text>
              <Text variant="bodySmall" color="secondary">privacy@insaf.pk</Text>
            </View>
          </View>
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
    padding: 16,
  },
  introHeader: {
    flexDirection: 'row',
    alignItems: 'center',
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
  introText: {
    marginTop: 12,
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
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactInfo: {
    marginLeft: 12,
  },
});

export default PrivacyScreen;
