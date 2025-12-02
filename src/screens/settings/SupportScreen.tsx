/**
 * INSAF - Support Screen
 *
 * Contact support and submit tickets
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Text } from '../../components/common/Text';
import { Card } from '../../components/common/Card';

type SupportCategory = 'general' | 'technical' | 'payment' | 'dispute' | 'verification' | 'other';

interface ContactOption {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  action: () => void;
}

export const SupportScreen: React.FC = () => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  const [category, setCategory] = useState<SupportCategory>('general');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const categories: { id: SupportCategory; label: string }[] = [
    { id: 'general', label: 'General' },
    { id: 'technical', label: 'Technical' },
    { id: 'payment', label: 'Payments' },
    { id: 'dispute', label: 'Disputes' },
    { id: 'verification', label: 'Verification' },
    { id: 'other', label: 'Other' },
  ];

  const contactOptions: ContactOption[] = [
    {
      id: 'email',
      title: 'Email Support',
      subtitle: 'support@insaf.pk',
      icon: 'mail-outline',
      action: () => Linking.openURL('mailto:support@insaf.pk'),
    },
    {
      id: 'whatsapp',
      title: 'WhatsApp',
      subtitle: '+92 300 1234567',
      icon: 'logo-whatsapp',
      action: () => Linking.openURL('https://wa.me/923001234567'),
    },
    {
      id: 'call',
      title: 'Phone Support',
      subtitle: 'Mon-Fri, 9AM-6PM',
      icon: 'call-outline',
      action: () => Linking.openURL('tel:+923001234567'),
    },
  ];

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Missing Information', 'Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      // TODO: Submit to backend
      await new Promise(resolve => setTimeout(resolve, 1500));

      Alert.alert(
        'Ticket Submitted',
        'Thank you for contacting us. We will respond within 24-48 hours.',
        [
          {
            text: 'OK',
            onPress: () => {
              setSubject('');
              setMessage('');
              setCategory('general');
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text variant="h3" color="primary">Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Contact Options */}
        <Text variant="labelMedium" color="tertiary" style={styles.sectionLabel}>
          Quick Contact
        </Text>

        <View style={styles.contactRow}>
          {contactOptions.map(option => (
            <TouchableOpacity
              key={option.id}
              style={[styles.contactOption, { backgroundColor: theme.colors.background.secondary }]}
              onPress={option.action}
            >
              <View style={[styles.contactIcon, { backgroundColor: `${theme.colors.brand.primary}20` }]}>
                <Ionicons name={option.icon} size={24} color={theme.colors.brand.primary} />
              </View>
              <Text variant="labelSmall" color="primary" style={{ marginTop: 8 }}>
                {option.title}
              </Text>
              <Text variant="caption" color="tertiary" numberOfLines={1}>
                {option.subtitle}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Submit Ticket */}
        <Text variant="labelMedium" color="tertiary" style={[styles.sectionLabel, { marginTop: 24 }]}>
          Submit a Ticket
        </Text>

        <Card variant="elevated" style={styles.formCard}>
          <Text variant="labelMedium" color="secondary" style={styles.label}>
            Category
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
          >
            {categories.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: category === cat.id
                      ? theme.colors.brand.primary
                      : theme.colors.background.secondary,
                  },
                ]}
                onPress={() => setCategory(cat.id)}
              >
                <Text
                  variant="labelSmall"
                  style={{
                    color: category === cat.id ? '#FFFFFF' : theme.colors.text.secondary,
                  }}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text variant="labelMedium" color="secondary" style={[styles.label, { marginTop: 16 }]}>
            Subject
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.colors.background.secondary, color: theme.colors.text.primary }]}
            value={subject}
            onChangeText={setSubject}
            placeholder="Brief description of your issue"
            placeholderTextColor={theme.colors.text.tertiary}
          />

          <Text variant="labelMedium" color="secondary" style={[styles.label, { marginTop: 16 }]}>
            Message
          </Text>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: theme.colors.background.secondary, color: theme.colors.text.primary }]}
            value={message}
            onChangeText={setMessage}
            placeholder="Please provide details about your issue..."
            placeholderTextColor={theme.colors.text.tertiary}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <LinearGradient
              colors={['#1a365d', '#2d4a7c']}
              style={styles.submitGradient}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="send" size={18} color="#FFFFFF" />
                  <Text variant="labelMedium" style={styles.submitText}>Submit Ticket</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Card>

        {/* Response Time */}
        <View style={styles.infoBox}>
          <Ionicons name="time-outline" size={20} color={theme.colors.text.tertiary} />
          <Text variant="caption" color="tertiary" style={{ marginLeft: 8, flex: 1 }}>
            Average response time: 4-6 hours during business hours. For urgent issues, please call our support line.
          </Text>
        </View>

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
  sectionLabel: {
    marginBottom: 12,
  },
  contactRow: {
    flexDirection: 'row',
    gap: 12,
  },
  contactOption: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formCard: {
    padding: 20,
  },
  label: {
    marginBottom: 8,
  },
  categoryScroll: {
    marginHorizontal: -4,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginHorizontal: 4,
  },
  input: {
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 14,
  },
  submitButton: {
    marginTop: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  submitText: {
    color: '#FFFFFF',
  },
  infoBox: {
    flexDirection: 'row',
    padding: 16,
    marginTop: 24,
  },
});

export default SupportScreen;
