/**
 * INSAF - Wallet Screen
 *
 * Shows wallet balance, escrow details, and payout options
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
  TextInput,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Text } from '../../components/common/Text';
import { Card } from '../../components/common/Card';
import {
  getLawyerWallet,
  requestPayout,
  LawyerWallet,
  MINIMUM_PAYOUT,
} from '../../services/earnings.service';
import { getPaymentMethods, PaymentMethod } from '../../services/wallet.service';

export const WalletScreen: React.FC = () => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [wallet, setWallet] = useState<LawyerWallet | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);

  const isLawyer = user?.role === 'LAWYER' || user?.role === 'LAW_FIRM';

  useEffect(() => {
    fetchWalletData();
  }, [user?.uid]);

  const fetchWalletData = async () => {
    if (!user?.uid) return;

    try {
      if (isLawyer) {
        // Fetch wallet and payment methods separately to handle errors gracefully
        let walletData = null;
        let methods: PaymentMethod[] = [];

        try {
          walletData = await getLawyerWallet(user.uid);
        } catch (walletError) {
          console.error('Error fetching wallet:', walletError);
          // Create default wallet structure
          walletData = {
            lawyerId: user.uid,
            availableBalance: 0,
            pendingBalance: 0,
            escrowBalance: 0,
            totalEarned: 0,
            totalWithdrawn: 0,
          };
        }

        try {
          methods = await getPaymentMethods(user.uid);
        } catch (methodsError) {
          console.error('Error fetching payment methods:', methodsError);
          methods = [];
        }

        setWallet(walletData);
        setPaymentMethods(methods);
        if (methods.length > 0) {
          setSelectedMethod(methods.find(m => m.isDefault) || methods[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchWalletData();
  };

  const handleWithdraw = async () => {
    if (!user?.uid || !wallet || !selectedMethod) return;

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount < MINIMUM_PAYOUT) {
      Alert.alert('Invalid Amount', `Minimum withdrawal amount is PKR ${MINIMUM_PAYOUT.toLocaleString()}`);
      return;
    }

    if (amount > wallet.availableBalance) {
      Alert.alert('Insufficient Balance', 'You cannot withdraw more than your available balance');
      return;
    }

    setWithdrawing(true);
    try {
      await requestPayout(user.uid, amount, selectedMethod.id);
      Alert.alert('Success', 'Withdrawal request submitted. It will be processed within 1-3 business days.');
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      fetchWalletData();
    } catch (error) {
      Alert.alert('Error', 'Failed to submit withdrawal request');
    } finally {
      setWithdrawing(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return `PKR ${amount.toLocaleString()}`;
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: theme.colors.background.primary }]}>
        <ActivityIndicator size="large" color={theme.colors.brand.primary} />
      </View>
    );
  }

  if (!isLawyer) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text variant="h3" color="primary">Wallet</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.clientMessage}>
          <Ionicons name="wallet-outline" size={64} color={theme.colors.brand.primary} />
          <Text variant="h4" color="primary" style={{ marginTop: 16, textAlign: 'center' }}>
            Client Wallet
          </Text>
          <Text variant="bodyMedium" color="secondary" style={{ marginTop: 8, textAlign: 'center' }}>
            Payment features for clients are coming soon. You can make case payments directly from case pages.
          </Text>
        </View>
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
        <Text variant="h3" color="primary">Wallet</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
          <Ionicons name="receipt-outline" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Balance Card */}
        <LinearGradient
          colors={['#1a365d', '#2d4a7c']}
          style={styles.balanceCard}
        >
          <Text variant="labelMedium" style={styles.balanceLabel}>Available Balance</Text>
          <Text variant="h1" style={styles.balanceAmount}>
            {formatCurrency(wallet?.availableBalance || 0)}
          </Text>

          <View style={styles.balanceDetails}>
            <View style={styles.balanceItem}>
              <Text variant="caption" style={styles.balanceItemLabel}>Pending</Text>
              <Text variant="labelLarge" style={styles.balanceItemValue}>
                {formatCurrency(wallet?.pendingBalance || 0)}
              </Text>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceItem}>
              <Text variant="caption" style={styles.balanceItemLabel}>Total Earned</Text>
              <Text variant="labelLarge" style={styles.balanceItemValue}>
                {formatCurrency(wallet?.totalEarned || 0)}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.withdrawButton}
            onPress={() => setShowWithdrawModal(true)}
            disabled={(wallet?.availableBalance || 0) < MINIMUM_PAYOUT}
          >
            <Ionicons name="wallet-outline" size={20} color="#1a365d" />
            <Text variant="labelMedium" style={styles.withdrawButtonText}>Withdraw Funds</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Quick Info */}
        <View style={styles.infoRow}>
          <Card variant="elevated" style={styles.infoCard}>
            <Ionicons name="time-outline" size={24} color="#FF9800" />
            <Text variant="labelSmall" color="secondary" style={{ marginTop: 8 }}>
              Pending Clearance
            </Text>
            <Text variant="h4" color="primary">7 Days</Text>
          </Card>

          <Card variant="elevated" style={styles.infoCard}>
            <Ionicons name="cash-outline" size={24} color="#4CAF50" />
            <Text variant="labelSmall" color="secondary" style={{ marginTop: 8 }}>
              Min Withdrawal
            </Text>
            <Text variant="h4" color="primary">{formatCurrency(MINIMUM_PAYOUT)}</Text>
          </Card>
        </View>

        {/* Escrow Section */}
        <Text variant="h4" color="primary" style={styles.sectionTitle}>
          In Escrow
        </Text>

        <Card variant="elevated" style={styles.escrowCard}>
          <View style={styles.escrowHeader}>
            <View style={[styles.escrowIcon, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="shield-checkmark" size={24} color="#FF9800" />
            </View>
            <View style={styles.escrowInfo}>
              <Text variant="labelLarge" color="primary">Secured in Escrow</Text>
              <Text variant="caption" color="tertiary">
                Released upon case completion
              </Text>
            </View>
            <Text variant="h4" color="primary">
              {formatCurrency(wallet?.escrowBalance || 0)}
            </Text>
          </View>
        </Card>

        {/* Payment Methods Preview */}
        <View style={styles.sectionHeader}>
          <Text variant="h4" color="primary">Payment Methods</Text>
          <TouchableOpacity onPress={() => navigation.navigate('PaymentMethods')}>
            <Text variant="labelMedium" style={{ color: theme.colors.brand.primary }}>
              Manage
            </Text>
          </TouchableOpacity>
        </View>

        {paymentMethods.length === 0 ? (
          <Card variant="elevated" style={styles.noMethodsCard}>
            <Ionicons name="card-outline" size={32} color={theme.colors.text.tertiary} />
            <Text variant="bodyMedium" color="secondary" style={{ marginTop: 8 }}>
              Add a payment method to receive withdrawals
            </Text>
            <TouchableOpacity
              style={[styles.addMethodButton, { backgroundColor: theme.colors.brand.primary }]}
              onPress={() => navigation.navigate('PaymentMethods')}
            >
              <Ionicons name="add" size={16} color="#FFFFFF" />
              <Text variant="labelMedium" style={{ color: '#FFFFFF', marginLeft: 4 }}>
                Add Method
              </Text>
            </TouchableOpacity>
          </Card>
        ) : (
          paymentMethods.slice(0, 2).map(method => (
            <Card key={method.id} variant="elevated" style={styles.methodCard}>
              <View style={styles.methodContent}>
                <View style={[styles.methodIcon, { backgroundColor: theme.colors.background.secondary }]}>
                  <Ionicons
                    name={method.type === 'BANK_ACCOUNT' ? 'business-outline' : 'phone-portrait-outline'}
                    size={20}
                    color={theme.colors.brand.primary}
                  />
                </View>
                <View style={styles.methodInfo}>
                  <Text variant="labelMedium" color="primary">
                    {method.type === 'BANK_ACCOUNT' ? method.bankName : method.type.replace('_', ' ')}
                  </Text>
                  <Text variant="caption" color="tertiary">
                    {method.type === 'BANK_ACCOUNT' ? `****${method.accountNumber?.slice(-4)}` : method.phoneNumber}
                  </Text>
                </View>
                {method.isDefault && (
                  <View style={[styles.defaultBadge, { backgroundColor: '#E8F5E9' }]}>
                    <Text variant="caption" style={{ color: '#4CAF50' }}>Default</Text>
                  </View>
                )}
              </View>
            </Card>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Withdraw Modal */}
      <Modal
        visible={showWithdrawModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowWithdrawModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background.primary }]}>
            <View style={styles.modalHeader}>
              <Text variant="h4" color="primary">Withdraw Funds</Text>
              <TouchableOpacity onPress={() => setShowWithdrawModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>

            <Text variant="labelMedium" color="secondary" style={styles.modalLabel}>
              Amount (PKR)
            </Text>
            <TextInput
              style={[styles.amountInput, { backgroundColor: theme.colors.background.secondary, color: theme.colors.text.primary }]}
              value={withdrawAmount}
              onChangeText={setWithdrawAmount}
              placeholder="Enter amount"
              placeholderTextColor={theme.colors.text.tertiary}
              keyboardType="number-pad"
            />
            <Text variant="caption" color="tertiary">
              Available: {formatCurrency(wallet?.availableBalance || 0)} • Minimum: {formatCurrency(MINIMUM_PAYOUT)}
            </Text>

            <Text variant="labelMedium" color="secondary" style={[styles.modalLabel, { marginTop: 24 }]}>
              Withdraw To
            </Text>
            {paymentMethods.map(method => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.methodOption,
                  {
                    backgroundColor: theme.colors.background.secondary,
                    borderColor: selectedMethod?.id === method.id ? theme.colors.brand.primary : 'transparent',
                    borderWidth: 2,
                  },
                ]}
                onPress={() => setSelectedMethod(method)}
              >
                <Ionicons
                  name={method.type === 'BANK_ACCOUNT' ? 'business-outline' : 'phone-portrait-outline'}
                  size={20}
                  color={theme.colors.brand.primary}
                />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text variant="labelMedium" color="primary">
                    {method.type === 'BANK_ACCOUNT' ? method.bankName : method.type.replace('_', ' ')}
                  </Text>
                  <Text variant="caption" color="tertiary">
                    {method.type === 'BANK_ACCOUNT' ? `****${method.accountNumber?.slice(-4)}` : method.phoneNumber}
                  </Text>
                </View>
                {selectedMethod?.id === method.id && (
                  <Ionicons name="checkmark-circle" size={20} color={theme.colors.brand.primary} />
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.confirmButton, { backgroundColor: theme.colors.brand.primary }]}
              onPress={handleWithdraw}
              disabled={withdrawing || !withdrawAmount || !selectedMethod}
            >
              {withdrawing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text variant="labelLarge" style={{ color: '#FFFFFF' }}>Confirm Withdrawal</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  balanceCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
  },
  balanceLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  balanceAmount: {
    color: '#FFFFFF',
    marginTop: 8,
  },
  balanceDetails: {
    flexDirection: 'row',
    marginTop: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
  },
  balanceItem: {
    flex: 1,
    alignItems: 'center',
  },
  balanceDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  balanceItemLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  balanceItemValue: {
    color: '#FFFFFF',
    marginTop: 4,
  },
  withdrawButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d4af37',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 20,
  },
  withdrawButtonText: {
    color: '#1a365d',
    marginLeft: 8,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  infoCard: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  sectionTitle: {
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 24,
  },
  escrowCard: {
    marginBottom: 8,
  },
  escrowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  escrowIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  escrowInfo: {
    flex: 1,
    marginHorizontal: 12,
  },
  noMethodsCard: {
    padding: 24,
    alignItems: 'center',
  },
  addMethodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 16,
  },
  methodCard: {
    marginBottom: 8,
  },
  methodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  methodIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodInfo: {
    flex: 1,
    marginLeft: 12,
  },
  defaultBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  clientMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalLabel: {
    marginBottom: 8,
  },
  amountInput: {
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    marginBottom: 8,
  },
  methodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  confirmButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
  },
});

export default WalletScreen;
