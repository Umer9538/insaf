/**
 * INSAF - Help Screen
 *
 * FAQ and help articles
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Text } from '../../components/common/Text';
import { Card } from '../../components/common/Card';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    id: '1',
    question: 'How do I get verified as a lawyer?',
    answer: 'To get verified, go to Profile > Verification and upload your Bar Council ID (front and back), Law License, CNIC (front and back), and a professional photo. Our team will review your documents within 24-48 hours.',
    category: 'verification',
  },
  {
    id: '2',
    question: 'How does the bidding system work?',
    answer: 'When clients post cases, verified lawyers can submit bids with their proposed fee and approach. Clients review all bids and select the lawyer they want to work with. You can bid on multiple cases at once.',
    category: 'cases',
  },
  {
    id: '3',
    question: 'How and when do I get paid?',
    answer: 'Payments are held in escrow until case milestones are completed. Once the client confirms completion, funds are released to your wallet. You can withdraw to your bank account or mobile wallet after a 7-day holding period.',
    category: 'payments',
  },
  {
    id: '4',
    question: 'What is the platform fee?',
    answer: 'INSAF charges a 15% platform fee on completed cases. This fee covers payment processing, platform maintenance, and support services. The fee is automatically deducted from your earnings.',
    category: 'payments',
  },
  {
    id: '5',
    question: 'How do consultations work?',
    answer: 'You can set your availability in your profile. Clients can book video or phone consultations during your available slots. You set your consultation fee, and payment is collected upfront from the client.',
    category: 'consultations',
  },
  {
    id: '6',
    question: 'Can I message clients before being hired?',
    answer: 'Limited messaging is available during the bidding process. Full chat features are unlocked once a client accepts your bid and payment is secured in escrow.',
    category: 'messaging',
  },
  {
    id: '7',
    question: 'What happens if there is a dispute?',
    answer: 'If there is a dispute, either party can open a case. Our dispute resolution team will review the case, communications, and evidence. Funds in escrow are held until the dispute is resolved.',
    category: 'disputes',
  },
  {
    id: '8',
    question: 'How do I withdraw my earnings?',
    answer: 'Go to Wallet > Withdraw Funds. Add a payment method (bank account, JazzCash, or Easypaisa) if you have not already. Enter the amount and confirm. Withdrawals are processed within 1-3 business days.',
    category: 'payments',
  },
  {
    id: '9',
    question: 'Can I update my profile after verification?',
    answer: 'Yes, you can update your bio, experience, rates, and other details anytime. However, changing your name or verification documents requires re-verification.',
    category: 'profile',
  },
  {
    id: '10',
    question: 'How do client reviews work?',
    answer: 'After a case is completed, clients can leave a rating (1-5 stars) and written review. You can respond to reviews publicly. Higher ratings improve your visibility in search results.',
    category: 'reviews',
  },
];

const CATEGORIES = [
  { id: 'all', label: 'All Topics', icon: 'apps-outline' },
  { id: 'verification', label: 'Verification', icon: 'shield-checkmark-outline' },
  { id: 'cases', label: 'Cases', icon: 'briefcase-outline' },
  { id: 'payments', label: 'Payments', icon: 'wallet-outline' },
  { id: 'consultations', label: 'Consultations', icon: 'calendar-outline' },
];

export const HelpScreen: React.FC = () => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredFAQ = FAQ_DATA.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text variant="h3" color="primary">Help Center</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.background.secondary }]}>
        <Ionicons name="search" size={20} color={theme.colors.text.tertiary} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text.primary }]}
          placeholder="Search help articles..."
          placeholderTextColor={theme.colors.text.tertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={theme.colors.text.tertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {CATEGORIES.map(category => (
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
            <Ionicons
              name={category.icon as any}
              size={16}
              color={selectedCategory === category.id ? '#FFFFFF' : theme.colors.text.secondary}
            />
            <Text
              variant="labelSmall"
              style={{
                color: selectedCategory === category.id ? '#FFFFFF' : theme.colors.text.secondary,
                marginLeft: 6,
              }}
            >
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredFAQ.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search" size={48} color={theme.colors.text.tertiary} />
            <Text variant="h4" color="secondary" style={{ marginTop: 16, textAlign: 'center' }}>
              No Results Found
            </Text>
            <Text variant="bodyMedium" color="tertiary" style={{ marginTop: 8, textAlign: 'center' }}>
              Try a different search term or category
            </Text>
          </View>
        ) : (
          <>
            <Text variant="labelMedium" color="tertiary" style={styles.resultCount}>
              {filteredFAQ.length} article{filteredFAQ.length !== 1 ? 's' : ''} found
            </Text>

            {filteredFAQ.map(item => (
              <Card key={item.id} variant="elevated" style={styles.faqCard}>
                <TouchableOpacity
                  style={styles.faqHeader}
                  onPress={() => toggleExpand(item.id)}
                  activeOpacity={0.7}
                >
                  <Text variant="labelMedium" color="primary" style={styles.faqQuestion}>
                    {item.question}
                  </Text>
                  <Ionicons
                    name={expandedId === item.id ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={theme.colors.text.tertiary}
                  />
                </TouchableOpacity>

                {expandedId === item.id && (
                  <View style={styles.faqAnswer}>
                    <Text variant="bodyMedium" color="secondary">
                      {item.answer}
                    </Text>
                  </View>
                )}
              </Card>
            ))}
          </>
        )}

        {/* Contact Support */}
        <Card variant="elevated" style={styles.contactCard}>
          <View style={styles.contactContent}>
            <View style={[styles.contactIcon, { backgroundColor: theme.colors.brand.primary }]}>
              <Ionicons name="headset-outline" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.contactInfo}>
              <Text variant="labelLarge" color="primary">Still need help?</Text>
              <Text variant="bodySmall" color="secondary">
                Contact our support team
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.contactButton, { backgroundColor: theme.colors.background.secondary }]}
              onPress={() => navigation.navigate('Support')}
            >
              <Text variant="labelMedium" style={{ color: theme.colors.brand.primary }}>
                Contact
              </Text>
            </TouchableOpacity>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  categoriesContainer: {
    maxHeight: 50,
    marginTop: 16,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 16,
  },
  resultCount: {
    marginBottom: 12,
  },
  faqCard: {
    marginBottom: 8,
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  faqQuestion: {
    flex: 1,
    marginRight: 12,
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  contactCard: {
    marginTop: 24,
  },
  contactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactInfo: {
    flex: 1,
    marginHorizontal: 12,
  },
  contactButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
});

export default HelpScreen;
