/**
 * INSAF - Case Detail Screen
 *
 * Detailed view of a case with timeline and bids
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { Text } from '../../components/common/Text';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { useAuth } from '../../context/AuthContext';
import { createConversation } from '../../services/chat.service';
import { createCaseThread } from '../../services/caseThread.service';
import { getCaseById, Case, CaseStatus } from '../../services/case.service';
import { getBidsForCase, Bid, acceptBid, rejectBid } from '../../services/bid.service';
import { getLawyerProfile, LawyerProfile } from '../../services/lawyer.service';
import {
  createEscrow,
  getEscrowByCaseId,
  fundEscrow,
  clientConfirmCaseClear,
  lawyerConfirmCaseClear,
  raiseDispute,
  Escrow,
} from '../../services/escrow.service';
import { formatDistanceToNow } from 'date-fns';

const { width } = Dimensions.get('window');

// Extended bid with lawyer info
interface ExtendedBid extends Bid {
  lawyer?: LawyerProfile;
}

// Display case data structure
interface DisplayCaseData {
  id: string;
  caseNumber: string;
  title: string;
  description: string;
  status: string;
  category: string;
  budget: number;
  createdAt: string;
  updatedAt: string;
  lawyerId?: string;
  lawyer?: {
    id: string;
    name: string;
    specialty: string;
    rating: number;
  };
  documents: { id: string; name: string; size: string; date: string }[];
  timeline: { id: string; event: string; date: string; description: string }[];
  milestones: { id: string; title: string; amount: number; status: string }[];
}

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
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();
  const { caseId } = route.params || {};

  const [activeTab, setActiveTab] = useState('overview');
  const [startingChat, setStartingChat] = useState(false);
  const [acceptingBid, setAcceptingBid] = useState<string | null>(null);
  const [rejectingBid, setRejectingBid] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [caseData, setCaseData] = useState<DisplayCaseData | null>(null);
  const [bids, setBids] = useState<ExtendedBid[]>([]);
  const [escrow, setEscrow] = useState<Escrow | null>(null);
  const [processingEscrow, setProcessingEscrow] = useState(false);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [requestingClear, setRequestingClear] = useState(false);
  const [rawCaseStatus, setRawCaseStatus] = useState<string>('');
  const [isAssignedLawyer, setIsAssignedLawyer] = useState(false);

  // Fetch case data and bids
  const fetchData = useCallback(async (showLoader = true) => {
    if (!caseId) return;

    if (showLoader) setIsLoading(true);
    try {
      // Fetch case data and escrow
      const [fetchedCase, fetchedEscrow] = await Promise.all([
        getCaseById(caseId),
        getEscrowByCaseId(caseId),
      ]);

      setEscrow(fetchedEscrow);

      if (fetchedCase) {
        setRawCaseStatus(fetchedCase.status);
        // Check if current user is the assigned lawyer
        setIsAssignedLawyer(fetchedCase.lawyerId === user?.uid);
        // Format case data for display
        const displayCase: DisplayCaseData = {
          id: fetchedCase.id || caseId,
          caseNumber: fetchedCase.caseNumber,
          title: fetchedCase.title,
          description: fetchedCase.description,
          status: fetchedCase.status.toLowerCase().replace(/_/g, ''),
          category: fetchedCase.areaOfLaw.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
          budget: fetchedCase.budgetMin,
          createdAt: fetchedCase.createdAt?.toDate ? formatDistanceToNow(fetchedCase.createdAt.toDate(), { addSuffix: true }) : 'Recently',
          updatedAt: fetchedCase.updatedAt?.toDate ? formatDistanceToNow(fetchedCase.updatedAt.toDate(), { addSuffix: true }) : 'Recently',
          lawyerId: fetchedCase.lawyerId,
          documents: [], // Will be populated when document storage is implemented
          timeline: [
            {
              id: '1',
              event: 'Case Created',
              date: fetchedCase.createdAt?.toDate ? new Date(fetchedCase.createdAt.toDate()).toLocaleDateString() : 'Recently',
              description: 'Case submitted for review',
            },
          ],
          milestones: [],
        };

        // Fetch assigned lawyer info if exists
        if (fetchedCase.lawyerId) {
          const lawyerProfile = await getLawyerProfile(fetchedCase.lawyerId);
          if (lawyerProfile) {
            displayCase.lawyer = {
              id: fetchedCase.lawyerId,
              name: lawyerProfile.fullName,
              specialty: lawyerProfile.primarySpecialization || 'General Practice',
              rating: lawyerProfile.averageRating || 0,
            };
            displayCase.timeline.push({
              id: '2',
              event: 'Lawyer Assigned',
              date: fetchedCase.assignedAt?.toDate ? new Date(fetchedCase.assignedAt.toDate()).toLocaleDateString() : 'Recently',
              description: `${lawyerProfile.fullName} accepted the case`,
            });
          }
        }

        setCaseData(displayCase);
      }

      // Fetch bids with lawyer info
      const fetchedBids = await getBidsForCase(caseId);
      const extendedBids: ExtendedBid[] = await Promise.all(
        fetchedBids.map(async (bid) => {
          const lawyerProfile = await getLawyerProfile(bid.lawyerId);
          return { ...bid, lawyer: lawyerProfile || undefined };
        })
      );
      setBids(extendedBids);

    } catch (error) {
      console.error('Error fetching case data:', error);
      Alert.alert('Error', 'Failed to load case details');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [caseId]);

  // Fetch on focus
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  // Handle refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData(false);
  }, [fetchData]);

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: theme.colors.background.primary }]}>
        <ActivityIndicator size="large" color={theme.colors.brand.primary} />
        <Text variant="bodySmall" color="secondary" style={{ marginTop: 12 }}>
          Loading case details...
        </Text>
      </View>
    );
  }

  // No case data
  if (!caseData) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: theme.colors.background.primary }]}>
        <Ionicons name="alert-circle-outline" size={48} color={theme.colors.text.tertiary} />
        <Text variant="bodyMedium" color="secondary" style={{ marginTop: 12 }}>
          Case not found
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
          <Text variant="labelMedium" color="brand">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Start chat with assigned lawyer
  const handleChatWithLawyer = async () => {
    if (!user || !caseData.lawyer) return;

    setStartingChat(true);
    try {
      const lawyerId = caseData.lawyer.id;

      const conversationId = await createConversation(
        [
          {
            userId: user.uid,
            userName: user.displayName || 'Client',
            userRole: 'client',
          },
          {
            userId: lawyerId,
            userName: caseData.lawyer.name,
            userRole: 'lawyer',
          },
        ],
        caseData.id,
        'case',
        caseData.title,
        user.uid
      );

      navigation.navigate('ChatDetail', { conversationId });
    } catch (error) {
      console.error('Error starting chat:', error);
      Alert.alert('Error', 'Failed to start chat. Please try again.');
    } finally {
      setStartingChat(false);
    }
  };

  // Accept bid and create conversation with the lawyer
  const handleAcceptBid = async (bid: ExtendedBid) => {
    if (!user || !bid.id) return;

    // Confirm before accepting
    Alert.alert(
      'Accept Bid',
      `Accept ${bid.lawyer?.fullName || 'this lawyer'}'s bid for Rs. ${bid.proposedFee.toLocaleString()}?\n\nYou will need to pay 50% (Rs. ${(bid.proposedFee * 0.5).toLocaleString()}) to escrow to start the case.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept & Pay',
          onPress: async () => {
            setAcceptingBid(bid.id!);
            try {
              // Accept the bid (updates bid status, rejects others, assigns lawyer)
              await acceptBid(bid.id!, user.uid);

              const lawyerId = bid.lawyerId;
              const lawyerName = bid.lawyer?.fullName || 'Lawyer';

              // Create escrow
              await createEscrow(caseData.id, user.uid, lawyerId, bid.proposedFee);

              // Create conversation for chat
              const conversationId = await createConversation(
                [
                  {
                    userId: user.uid,
                    userName: user.displayName || 'Client',
                    userRole: 'client',
                  },
                  {
                    userId: lawyerId,
                    userName: lawyerName,
                    userRole: 'lawyer',
                  },
                ],
                caseData.id,
                'case',
                caseData.title,
                user.uid
              );

              // Create case thread for structured timeline
              await createCaseThread(
                caseData.id,
                caseData.title,
                caseData.caseNumber,
                user.uid,
                user.displayName || 'Client',
                lawyerId,
                lawyerName
              );

              // Show payment prompt
              Alert.alert(
                'Bid Accepted! Pay to Escrow',
                `Escrow created for Rs. ${(bid.proposedFee * 0.5).toLocaleString()} (50% of total).\n\nPay now to start the case. The lawyer will begin work once payment is confirmed.`,
                [
                  {
                    text: 'Pay Now',
                    onPress: () => handlePayEscrow(bid.proposedFee * 0.5),
                  },
                  {
                    text: 'Pay Later',
                    style: 'cancel',
                    onPress: () => {
                      Alert.alert('Reminder', 'Please pay to escrow from the case overview to start the case.');
                      fetchData(false);
                    },
                  },
                ]
              );
            } catch (error) {
              console.error('Error accepting bid:', error);
              Alert.alert('Error', 'Failed to accept bid. Please try again.');
            } finally {
              setAcceptingBid(null);
            }
          },
        },
      ]
    );
  };

  // Handle reject bid
  const handleRejectBid = async (bid: ExtendedBid) => {
    if (!bid.id) return;

    Alert.alert(
      'Reject Bid',
      `Are you sure you want to reject ${bid.lawyer?.fullName || 'this lawyer'}'s bid?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setRejectingBid(bid.id!);
            try {
              await rejectBid(bid.id!);
              Alert.alert('Bid Rejected', 'The lawyer has been notified.');
              fetchData(false);
            } catch (error) {
              console.error('Error rejecting bid:', error);
              Alert.alert('Error', 'Failed to reject bid. Please try again.');
            } finally {
              setRejectingBid(null);
            }
          },
        },
      ]
    );
  };

  // Handle pay to escrow (simulated - would integrate with payment gateway)
  const handlePayEscrow = async (amount: number) => {
    setProcessingEscrow(true);
    try {
      // Simulate payment processing
      // In production, this would integrate with JazzCash/EasyPaisa/Stripe
      const transactionId = `TXN-${Date.now()}`;

      await fundEscrow(caseId, transactionId);

      Alert.alert(
        'Payment Successful!',
        `Rs. ${amount.toLocaleString()} has been deposited to escrow. The lawyer has been notified and will begin work.`,
        [{ text: 'OK', onPress: () => fetchData(false) }]
      );
    } catch (error) {
      console.error('Error processing payment:', error);
      Alert.alert('Payment Failed', 'Please try again or contact support.');
    } finally {
      setProcessingEscrow(false);
    }
  };

  // Handle confirm case clear (client confirms work is complete)
  const handleConfirmCaseClear = async () => {
    Alert.alert(
      'Confirm Case Completion',
      'By confirming, you agree that the lawyer has completed the work satisfactorily. The escrow funds will be released to the lawyer.\n\nAre you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & Release Funds',
          onPress: async () => {
            setConfirmingClear(true);
            try {
              await clientConfirmCaseClear(caseId);
              Alert.alert(
                'Case Completed!',
                'The case has been marked as complete and funds have been released to the lawyer. Thank you for using INSAF!',
                [{ text: 'OK', onPress: () => fetchData(false) }]
              );
            } catch (error) {
              console.error('Error confirming case clear:', error);
              Alert.alert('Error', 'Failed to confirm. Please try again.');
            } finally {
              setConfirmingClear(false);
            }
          },
        },
      ]
    );
  };

  // Handle lawyer requesting case clear
  const handleRequestCaseClear = async () => {
    Alert.alert(
      'Request Case Completion',
      'By requesting case completion, you confirm that you have completed all work for this case. The client will be notified to review and confirm.\n\nProceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request Completion',
          onPress: async () => {
            setRequestingClear(true);
            try {
              await lawyerConfirmCaseClear(caseId);
              Alert.alert(
                'Request Sent!',
                'The client has been notified to review and confirm case completion. Once they confirm, the escrow will be released.',
                [{ text: 'OK', onPress: () => fetchData(false) }]
              );
            } catch (error) {
              console.error('Error requesting case clear:', error);
              Alert.alert('Error', 'Failed to request case completion. Please try again.');
            } finally {
              setRequestingClear(false);
            }
          },
        },
      ]
    );
  };

  // Handle raise dispute
  const handleRaiseDispute = () => {
    Alert.alert(
      'Raise Dispute',
      'Are you sure you want to raise a dispute? This will pause the case and an admin will review.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Raise Dispute',
          style: 'destructive',
          onPress: async () => {
            try {
              await raiseDispute(caseId);
              Alert.alert(
                'Dispute Raised',
                'Your dispute has been submitted. An admin will contact you within 24-48 hours.',
                [{ text: 'OK', onPress: () => fetchData(false) }]
              );
            } catch (error) {
              console.error('Error raising dispute:', error);
              Alert.alert('Error', 'Failed to raise dispute. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Navigate to case thread
  const handleViewThread = () => {
    navigation.navigate('CaseThread', { caseId: caseData.id, caseTitle: caseData.title });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.brand.primary}
            colors={[theme.colors.brand.primary]}
          />
        }
      >
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
              <TouchableOpacity style={styles.actionButton} onPress={handleViewThread}>
                <Ionicons name="git-branch-outline" size={22} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, { marginLeft: 8 }]}>
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
              {/* Escrow Status Card */}
              {escrow && (
                <View>
                  <Text variant="h4" color="primary" style={styles.sectionTitle}>Payment & Escrow</Text>
                  <Card style={styles.escrowCard}>
                    <View style={styles.escrowHeader}>
                      <View style={[styles.escrowStatusBadge, {
                        backgroundColor: escrow.status === 'FUNDED' ? '#4CAF5020' :
                          escrow.status === 'RELEASED' ? '#9C27B020' :
                          escrow.status === 'DISPUTED' ? '#EF444420' : '#FF980020'
                      }]}>
                        <Ionicons
                          name={escrow.status === 'FUNDED' ? 'checkmark-circle' :
                            escrow.status === 'RELEASED' ? 'trophy' :
                            escrow.status === 'DISPUTED' ? 'alert-circle' : 'time'}
                          size={16}
                          color={escrow.status === 'FUNDED' ? '#4CAF50' :
                            escrow.status === 'RELEASED' ? '#9C27B0' :
                            escrow.status === 'DISPUTED' ? '#EF4444' : '#FF9800'}
                        />
                        <Text variant="labelSmall" style={{
                          color: escrow.status === 'FUNDED' ? '#4CAF50' :
                            escrow.status === 'RELEASED' ? '#9C27B0' :
                            escrow.status === 'DISPUTED' ? '#EF4444' : '#FF9800',
                          marginLeft: 4,
                        }}>
                          {escrow.status === 'PENDING_PAYMENT' ? 'Awaiting Payment' :
                            escrow.status === 'FUNDED' ? 'Escrow Funded' :
                            escrow.status === 'RELEASED' ? 'Completed' :
                            escrow.status === 'DISPUTED' ? 'Disputed' : escrow.status}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.escrowDetails}>
                      <View style={styles.escrowRow}>
                        <Text variant="bodySmall" color="secondary">Total Fee</Text>
                        <Text variant="labelLarge" color="primary">Rs. {escrow.totalAmount.toLocaleString()}</Text>
                      </View>
                      <View style={styles.escrowRow}>
                        <Text variant="bodySmall" color="secondary">Escrow Amount (50%)</Text>
                        <Text variant="labelLarge" color="brand">Rs. {escrow.escrowAmount.toLocaleString()}</Text>
                      </View>
                      {escrow.status === 'FUNDED' && (
                        <View style={styles.escrowRow}>
                          <Text variant="bodySmall" color="secondary">Remaining (Due on Completion)</Text>
                          <Text variant="labelMedium" color="tertiary">Rs. {(escrow.totalAmount - escrow.escrowAmount).toLocaleString()}</Text>
                        </View>
                      )}
                    </View>

                    {/* Action Buttons based on status */}
                    {escrow.status === 'PENDING_PAYMENT' && (
                      <Button
                        label={processingEscrow ? "Processing..." : "Pay to Escrow"}
                        variant="gradient"
                        size="md"
                        fullWidth
                        onPress={() => handlePayEscrow(escrow.escrowAmount)}
                        disabled={processingEscrow}
                        style={{ marginTop: 16 }}
                      />
                    )}

                    {escrow.status === 'FUNDED' && rawCaseStatus === 'CASE_CLEAR_PENDING' && !escrow.clientConfirmed && (
                      <View style={{ marginTop: 16 }}>
                        <View style={styles.caseClearNotice}>
                          <Ionicons name="information-circle" size={20} color="#2196F3" />
                          <Text variant="bodySmall" color="secondary" style={{ marginLeft: 8, flex: 1 }}>
                            The lawyer has requested case completion. Please review and confirm if satisfied.
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                          <Button
                            label="Raise Dispute"
                            variant="outline"
                            size="sm"
                            style={{ flex: 1 }}
                            onPress={handleRaiseDispute}
                          />
                          <Button
                            label={confirmingClear ? "Confirming..." : "Confirm & Release"}
                            variant="gradient"
                            size="sm"
                            style={{ flex: 1 }}
                            onPress={handleConfirmCaseClear}
                            disabled={confirmingClear}
                          />
                        </View>
                      </View>
                    )}

                    {escrow.status === 'FUNDED' && rawCaseStatus === 'IN_PROGRESS' && !isAssignedLawyer && (
                      <View style={styles.progressNotice}>
                        <Ionicons name="hourglass" size={16} color="#FF9800" />
                        <Text variant="caption" color="secondary" style={{ marginLeft: 8 }}>
                          Case in progress. The lawyer will request completion when done.
                        </Text>
                      </View>
                    )}

                    {/* Lawyer: Request Case Clear */}
                    {escrow.status === 'FUNDED' && rawCaseStatus === 'IN_PROGRESS' && isAssignedLawyer && (
                      <View style={{ marginTop: 16 }}>
                        <View style={styles.progressNotice}>
                          <Ionicons name="construct" size={16} color="#FF9800" />
                          <Text variant="caption" color="secondary" style={{ marginLeft: 8 }}>
                            Once you complete the work, request case completion to release the escrow.
                          </Text>
                        </View>
                        <Button
                          label={requestingClear ? "Requesting..." : "Request Case Completion"}
                          variant="gradient"
                          size="md"
                          fullWidth
                          onPress={handleRequestCaseClear}
                          disabled={requestingClear}
                          style={{ marginTop: 12 }}
                        />
                      </View>
                    )}

                    {/* Lawyer: Waiting for client confirmation */}
                    {escrow.status === 'FUNDED' && rawCaseStatus === 'CASE_CLEAR_PENDING' && isAssignedLawyer && (
                      <View style={styles.progressNotice}>
                        <Ionicons name="time" size={16} color="#2196F3" />
                        <Text variant="caption" color="secondary" style={{ marginLeft: 8 }}>
                          Waiting for client to confirm case completion. Escrow will be released once confirmed.
                        </Text>
                      </View>
                    )}

                    {escrow.status === 'RELEASED' && (
                      <View style={styles.completedNotice}>
                        <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                        <Text variant="caption" style={{ marginLeft: 8, color: '#4CAF50' }}>
                          Payment released to lawyer. Case completed successfully!
                        </Text>
                      </View>
                    )}
                  </Card>
                </View>
              )}

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
                      <TouchableOpacity
                        onPress={handleChatWithLawyer}
                        disabled={startingChat}
                        style={styles.chatButton}
                      >
                        {startingChat ? (
                          <ActivityIndicator size="small" color={theme.colors.brand.primary} />
                        ) : (
                          <Ionicons name="chatbubble-outline" size={22} color={theme.colors.brand.primary} />
                        )}
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
                Received Bids ({bids.length})
              </Text>
              {bids.length === 0 ? (
                <Card style={styles.emptyBidsCard}>
                  <Ionicons name="hand-left-outline" size={48} color={theme.colors.text.tertiary} />
                  <Text variant="bodyMedium" color="secondary" style={{ marginTop: 12, textAlign: 'center' }}>
                    No bids received yet
                  </Text>
                  <Text variant="caption" color="tertiary" style={{ marginTop: 4, textAlign: 'center' }}>
                    Lawyers will start bidding on your case soon
                  </Text>
                </Card>
              ) : (
                bids.map((bid) => (
                  <Card key={bid.id} style={styles.bidCard}>
                    <View style={styles.bidHeader}>
                      <LinearGradient
                        colors={['#1a365d', '#2d4a7c']}
                        style={styles.bidAvatar}
                      >
                        <Ionicons name="person" size={20} color="#d4af37" />
                      </LinearGradient>
                      <View style={styles.bidInfo}>
                        <Text variant="labelLarge" color="primary">{bid.lawyer?.fullName || 'Lawyer'}</Text>
                        <Text variant="caption" color="secondary">
                          {bid.lawyer?.primarySpecialization || 'General Practice'} • {bid.lawyer?.yearsOfExperience || 0} years
                        </Text>
                      </View>
                      <View style={styles.bidRating}>
                        <Ionicons name="star" size={12} color="#d4af37" />
                        <Text variant="caption" color="secondary"> {bid.lawyer?.averageRating?.toFixed(1) || '0.0'}</Text>
                      </View>
                    </View>
                    <Text variant="bodySmall" color="secondary" style={styles.bidProposal}>
                      {bid.proposalText}
                    </Text>
                    <View style={styles.bidFooter}>
                      <View>
                        <Text variant="caption" color="tertiary">Bid Amount</Text>
                        <Text variant="h4" color="brand">Rs. {bid.proposedFee.toLocaleString()}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text variant="caption" color="tertiary">Timeline</Text>
                        <Text variant="labelMedium" color="primary">{bid.estimatedTimeline}</Text>
                      </View>
                    </View>
                    <View style={styles.bidActions}>
                      <Button
                        label="View Profile"
                        variant="outline"
                        size="sm"
                        style={{ flex: 1 }}
                        onPress={() => navigation.navigate('LawyerDetail', { lawyerId: bid.lawyerId })}
                      />
                      <TouchableOpacity
                        style={[styles.rejectButton, { borderColor: '#EF4444' }]}
                        onPress={() => handleRejectBid(bid)}
                        disabled={rejectingBid === bid.id}
                      >
                        {rejectingBid === bid.id ? (
                          <ActivityIndicator size="small" color="#EF4444" />
                        ) : (
                          <Ionicons name="close" size={18} color="#EF4444" />
                        )}
                      </TouchableOpacity>
                      <Button
                        label={acceptingBid === bid.id ? "Accepting..." : "Accept"}
                        variant="gradient"
                        size="sm"
                        style={{ flex: 1 }}
                        onPress={() => handleAcceptBid(bid)}
                        disabled={acceptingBid !== null || rejectingBid !== null}
                      />
                    </View>
                  </Card>
                ))
              )}
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
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBidsCard: {
    padding: 32,
    alignItems: 'center',
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
  chatButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  escrowCard: {
    padding: 16,
  },
  escrowHeader: {
    marginBottom: 16,
  },
  escrowStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  escrowDetails: {
    gap: 12,
  },
  escrowRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  caseClearNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#2196F310',
    padding: 12,
    borderRadius: 8,
  },
  progressNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#FF980010',
    borderRadius: 8,
  },
  completedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#4CAF5010',
    borderRadius: 8,
  },
  rejectButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
});

export default CaseDetailScreen;
