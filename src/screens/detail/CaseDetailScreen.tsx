/**
 * INSAF - Case Detail Screen
 *
 * Detailed view of a case with timeline and bids
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { Text } from '../../components/common/Text';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';

const { width } = Dimensions.get('window');

// Sample Case Data
const CASE_DATA = {
  id: '1',
  caseNumber: 'INS-2024-001',
  title: 'Property Dispute Resolution',
  description: 'Land ownership dispute in Lahore regarding inherited property rights. Need legal representation to establish rightful ownership and resolve conflict with other claimants.',
  status: 'active',
  category: 'Property Law',
  budget: 50000,
  createdAt: '2024-01-15',
  updatedAt: '2 hours ago',
  lawyer: {
    name: 'Adv. Ahmad Khan',
    specialty: 'Property Law',
    rating: 4.9,
  },
  documents: [
    { id: '1', name: 'Property_Deed.pdf', size: '2.4 MB', date: 'Jan 15, 2024' },
    { id: '2', name: 'Inheritance_Proof.pdf', size: '1.8 MB', date: 'Jan 15, 2024' },
    { id: '3', name: 'Survey_Report.pdf', size: '3.2 MB', date: 'Jan 16, 2024' },
  ],
  timeline: [
    { id: '1', event: 'Case Created', date: 'Jan 15, 2024', description: 'Case filed for property dispute' },
    { id: '2', event: 'Lawyer Assigned', date: 'Jan 18, 2024', description: 'Adv. Ahmad Khan accepted the case' },
    { id: '3', event: 'Documents Submitted', date: 'Jan 20, 2024', description: 'Property documents uploaded' },
    { id: '4', event: 'First Hearing', date: 'Feb 5, 2024', description: 'Scheduled at Civil Court Lahore' },
  ],
  milestones: [
    { id: '1', title: 'Initial Consultation', amount: 10000, status: 'completed' },
    { id: '2', title: 'Document Preparation', amount: 15000, status: 'in_progress' },
    { id: '3', title: 'Court Filing', amount: 10000, status: 'pending' },
    { id: '4', title: 'Hearing & Representation', amount: 15000, status: 'pending' },
  ],
};

// Sample Bids Data
const BIDS = [
  {
    id: '1',
    lawyerName: 'Adv. Fatima Zahra',
    specialty: 'Property Law',
    experience: '10 years',
    rating: 4.6,
    amount: 45000,
    proposal: 'I have extensive experience in property disputes. I can help resolve this matter efficiently.',
    deliveryTime: '3-4 months',
  },
  {
    id: '2',
    lawyerName: 'Adv. Bilal Ahmed',
    specialty: 'Civil Law',
    experience: '8 years',
    rating: 4.5,
    amount: 40000,
    proposal: 'Specialized in land disputes with high success rate in Lahore courts.',
    deliveryTime: '4-5 months',
  },
  {
    id: '3',
    lawyerName: 'Adv. Imran Shah',
    specialty: 'Property Law',
    experience: '20 years',
    rating: 4.7,
    amount: 55000,
    proposal: 'Senior advocate with direct experience in property inheritance cases.',
    deliveryTime: '2-3 months',
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return '#4CAF50';
    case 'bidding': return '#2196F3';
    case 'completed': return '#9C27B0';
    case 'in_progress': return '#FF9800';
    case 'pending': return '#757575';
    default: return '#757575';
  }
};

export const CaseDetailScreen: React.FC = () => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('overview');

  const caseData = CASE_DATA;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={theme.colors.gradient.primary as [string, string]}
          style={[styles.header, { paddingTop: insets.top }]}
        >
          {/* Navigation */}
          <View style={styles.navRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.navActions}>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="ellipsis-horizontal" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Case Info */}
          <View style={styles.caseInfo}>
            <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(caseData.status)}20` }]}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(caseData.status) }]} />
              <Text variant="caption" style={{ color: getStatusColor(caseData.status) }}>
                Active
              </Text>
            </View>
            <Text variant="h2" style={styles.caseTitle} numberOfLines={2}>
              {caseData.title}
            </Text>
            <Text variant="bodySmall" style={styles.caseNumber}>
              Case #{caseData.caseNumber}
            </Text>
          </View>

          {/* Quick Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="briefcase-outline" size={18} color="rgba(255,255,255,0.7)" />
              <Text variant="caption" style={styles.statLabel}>{caseData.category}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="cash-outline" size={18} color="rgba(255,255,255,0.7)" />
              <Text variant="caption" style={styles.statLabel}>Rs. {caseData.budget.toLocaleString()}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={18} color="rgba(255,255,255,0.7)" />
              <Text variant="caption" style={styles.statLabel}>{caseData.updatedAt}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {['overview', 'bids', 'timeline', 'documents'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                activeTab === tab && { borderBottomColor: theme.colors.brand.primary, borderBottomWidth: 2 },
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                variant="labelMedium"
                style={{ color: activeTab === tab ? theme.colors.brand.primary : theme.colors.text.secondary }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {activeTab === 'overview' && (
            <>
              {/* Description */}
              <View>
                <Text variant="h4" color="primary" style={styles.sectionTitle}>Description</Text>
                <Card style={styles.descriptionCard}>
                  <Text variant="bodyMedium" color="secondary" style={styles.descriptionText}>
                    {caseData.description}
                  </Text>
                </Card>
              </View>

              {/* Assigned Lawyer */}
              {caseData.lawyer && (
                <View>
                  <Text variant="h4" color="primary" style={styles.sectionTitle}>Assigned Lawyer</Text>
                  <Card style={styles.lawyerCard}>
                    <View style={styles.lawyerRow}>
                      <LinearGradient
                        colors={['#1a365d', '#2d4a7c']}
                        style={styles.lawyerAvatar}
                      >
                        <Ionicons name="person" size={24} color="#d4af37" />
                      </LinearGradient>
                      <View style={styles.lawyerInfo}>
                        <Text variant="labelLarge" color="primary">{caseData.lawyer.name}</Text>
                        <Text variant="caption" color="secondary">{caseData.lawyer.specialty}</Text>
                        <View style={styles.ratingRow}>
                          <Ionicons name="star" size={12} color="#d4af37" />
                          <Text variant="caption" color="secondary"> {caseData.lawyer.rating}</Text>
                        </View>
                      </View>
                      <TouchableOpacity>
                        <Ionicons name="chatbubble-outline" size={22} color={theme.colors.brand.primary} />
                      </TouchableOpacity>
                    </View>
                  </Card>
                </View>
              )}

              {/* Milestones */}
              <View>
                <Text variant="h4" color="primary" style={styles.sectionTitle}>Payment Milestones</Text>
                <Card style={styles.milestonesCard}>
                  {caseData.milestones.map((milestone, index) => (
                    <View
                      key={milestone.id}
                      style={[
                        styles.milestoneItem,
                        index < caseData.milestones.length - 1 && styles.milestoneBorder,
                      ]}
                    >
                      <View style={[styles.milestoneStatus, { backgroundColor: `${getStatusColor(milestone.status)}15` }]}>
                        <Ionicons
                          name={milestone.status === 'completed' ? 'checkmark' : milestone.status === 'in_progress' ? 'timer' : 'ellipse'}
                          size={16}
                          color={getStatusColor(milestone.status)}
                        />
                      </View>
                      <View style={styles.milestoneInfo}>
                        <Text variant="labelMedium" color="primary">{milestone.title}</Text>
                        <Text variant="caption" color="tertiary">
                          {milestone.status.charAt(0).toUpperCase() + milestone.status.slice(1).replace('_', ' ')}
                        </Text>
                      </View>
                      <Text variant="labelMedium" color="brand">
                        Rs. {milestone.amount.toLocaleString()}
                      </Text>
                    </View>
                  ))}
                </Card>
              </View>
            </>
          )}

          {activeTab === 'bids' && (
            <View>
              <Text variant="h4" color="primary" style={styles.sectionTitle}>
                Received Bids ({BIDS.length})
              </Text>
              {BIDS.map((bid) => (
                <Card key={bid.id} style={styles.bidCard}>
                  <View style={styles.bidHeader}>
                    <LinearGradient
                      colors={['#1a365d', '#2d4a7c']}
                      style={styles.bidAvatar}
                    >
                      <Ionicons name="person" size={20} color="#d4af37" />
                    </LinearGradient>
                    <View style={styles.bidInfo}>
                      <Text variant="labelLarge" color="primary">{bid.lawyerName}</Text>
                      <Text variant="caption" color="secondary">
                        {bid.specialty} • {bid.experience}
                      </Text>
                    </View>
                    <View style={styles.bidRating}>
                      <Ionicons name="star" size={12} color="#d4af37" />
                      <Text variant="caption" color="secondary"> {bid.rating}</Text>
                    </View>
                  </View>
                  <Text variant="bodySmall" color="secondary" style={styles.bidProposal}>
                    {bid.proposal}
                  </Text>
                  <View style={styles.bidFooter}>
                    <View>
                      <Text variant="caption" color="tertiary">Bid Amount</Text>
                      <Text variant="h4" color="brand">Rs. {bid.amount.toLocaleString()}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text variant="caption" color="tertiary">Delivery</Text>
                      <Text variant="labelMedium" color="primary">{bid.deliveryTime}</Text>
                    </View>
                  </View>
                  <View style={styles.bidActions}>
                    <Button title="View Profile" variant="outline" size="sm" style={{ flex: 1, marginRight: 8 }} />
                    <Button title="Accept Bid" variant="gradient" size="sm" style={{ flex: 1 }} />
                  </View>
                </Card>
              ))}
            </View>
          )}

          {activeTab === 'timeline' && (
            <View>
              <Text variant="h4" color="primary" style={styles.sectionTitle}>Case Timeline</Text>
              <View style={styles.timeline}>
                {caseData.timeline.map((event, index) => (
                  <View key={event.id} style={styles.timelineItem}>
                    <View style={styles.timelineLeft}>
                      <View style={[styles.timelineDot, { backgroundColor: theme.colors.brand.primary }]} />
                      {index < caseData.timeline.length - 1 && (
                        <View style={[styles.timelineLine, { backgroundColor: theme.colors.border.light }]} />
                      )}
                    </View>
                    <Card style={styles.timelineCard}>
                      <Text variant="labelMedium" color="primary">{event.event}</Text>
                      <Text variant="bodySmall" color="secondary" style={{ marginTop: 4 }}>
                        {event.description}
                      </Text>
                      <Text variant="caption" color="tertiary" style={{ marginTop: 8 }}>
                        {event.date}
                      </Text>
                    </Card>
                  </View>
                ))}
              </View>
            </View>
          )}

          {activeTab === 'documents' && (
            <View>
              <View style={styles.docsHeader}>
                <Text variant="h4" color="primary">Documents ({caseData.documents.length})</Text>
                <TouchableOpacity style={styles.uploadButton}>
                  <Ionicons name="cloud-upload-outline" size={18} color={theme.colors.brand.primary} />
                  <Text variant="labelSmall" color="brand" style={{ marginLeft: 4 }}>Upload</Text>
                </TouchableOpacity>
              </View>
              {caseData.documents.map((doc) => (
                <Card key={doc.id} style={styles.documentCard}>
                  <View style={[styles.docIcon, { backgroundColor: `${theme.colors.brand.primary}15` }]}>
                    <Ionicons name="document-text" size={24} color={theme.colors.brand.primary} />
                  </View>
                  <View style={styles.docInfo}>
                    <Text variant="labelMedium" color="primary">{doc.name}</Text>
                    <Text variant="caption" color="tertiary">{doc.size} • {doc.date}</Text>
                  </View>
                  <TouchableOpacity>
                    <Ionicons name="download-outline" size={22} color={theme.colors.text.secondary} />
                  </TouchableOpacity>
                </Card>
              ))}
            </View>
          )}
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
    paddingBottom: 24,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navActions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  caseInfo: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  caseTitle: {
    color: '#FFFFFF',
  },
  caseNumber: {
    color: 'rgba(255,255,255,0.7)',
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 20,
    marginHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 12,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.9)',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    marginBottom: 12,
    marginTop: 8,
  },
  descriptionCard: {
    padding: 16,
  },
  descriptionText: {
    lineHeight: 22,
  },
  lawyerCard: {
    padding: 16,
  },
  lawyerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lawyerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lawyerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  milestonesCard: {
    padding: 0,
    overflow: 'hidden',
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  milestoneBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  milestoneStatus: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneInfo: {
    flex: 1,
    marginLeft: 12,
  },
  bidCard: {
    padding: 16,
    marginBottom: 12,
  },
  bidHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bidAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bidInfo: {
    flex: 1,
    marginLeft: 12,
  },
  bidRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bidProposal: {
    marginBottom: 12,
    lineHeight: 20,
  },
  bidFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    marginBottom: 12,
  },
  bidActions: {
    flexDirection: 'row',
  },
  timeline: {
    marginTop: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineLeft: {
    alignItems: 'center',
    width: 24,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
  },
  timelineCard: {
    flex: 1,
    marginLeft: 12,
    padding: 16,
  },
  docsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  documentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 10,
  },
  docIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docInfo: {
    flex: 1,
    marginLeft: 12,
  },
});

export default CaseDetailScreen;
