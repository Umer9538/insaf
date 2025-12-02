/**
 * INSAF - Transactions Screen
 *
 * Shows transaction history for the user
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Text } from '../../components/common/Text';
import { Card } from '../../components/common/Card';
import { getTransactions, Transaction } from '../../services/wallet.service';

const TRANSACTION_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'EARNING', label: 'Earnings' },
  { id: 'PAYOUT', label: 'Payouts' },
  { id: 'PAYMENT', label: 'Payments' },
  { id: 'REFUND', label: 'Refunds' },
];

export const TransactionsScreen: React.FC = () => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('all');

  useEffect(() => {
    fetchTransactions();
  }, [user?.uid]);

  const fetchTransactions = async () => {
    if (!user?.uid) return;

    try {
      const txns = await getTransactions(user.uid, 50);
      setTransactions(txns);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTransactions();
  };

  const getTransactionIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'EARNING':
        return 'trending-up';
      case 'PAYOUT':
        return 'arrow-up-circle';
      case 'PAYMENT':
        return 'card';
      case 'REFUND':
        return 'refresh-circle';
      case 'ESCROW_HOLD':
        return 'shield';
      case 'ESCROW_RELEASE':
        return 'shield-checkmark';
      default:
        return 'swap-horizontal';
    }
  };

  const getTransactionColor = (type: string): string => {
    switch (type) {
      case 'EARNING':
      case 'ESCROW_RELEASE':
        return '#4CAF50';
      case 'PAYOUT':
      case 'PAYMENT':
        return '#EF4444';
      case 'REFUND':
        return '#2196F3';
      case 'ESCROW_HOLD':
        return '#FF9800';
      default:
        return theme.colors.text.secondary;
    }
  };

  const getStatusBadge = (status: string): { color: string; bg: string } => {
    switch (status) {
      case 'COMPLETED':
        return { color: '#4CAF50', bg: '#E8F5E9' };
      case 'PENDING':
        return { color: '#FF9800', bg: '#FFF3E0' };
      case 'FAILED':
        return { color: '#EF4444', bg: '#FEE2E2' };
      default:
        return { color: theme.colors.text.tertiary, bg: theme.colors.background.secondary };
    }
  };

  const formatCurrency = (amount: number): string => {
    return `PKR ${Math.abs(amount).toLocaleString()}`;
  };

  // Convert Firebase Timestamp to Date
  const toDate = (timestamp: any): Date => {
    if (!timestamp) return new Date();
    if (timestamp.toDate) return timestamp.toDate();
    if (timestamp instanceof Date) return timestamp;
    return new Date(timestamp);
  };

  const formatDate = (date: any): string => {
    const d = toDate(date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Today, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return d.toLocaleDateString([], { weekday: 'long' });
    } else {
      return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const filteredTransactions = selectedFilter === 'all'
    ? transactions
    : transactions.filter(txn => txn.type === selectedFilter);

  // Group transactions by date
  const groupedTransactions: { [key: string]: Transaction[] } = {};
  filteredTransactions.forEach(txn => {
    const dateKey = toDate(txn.createdAt).toDateString();
    if (!groupedTransactions[dateKey]) {
      groupedTransactions[dateKey] = [];
    }
    groupedTransactions[dateKey].push(txn);
  });

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
        <Text variant="h3" color="primary">Transactions</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {TRANSACTION_FILTERS.map(filter => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterChip,
              {
                backgroundColor: selectedFilter === filter.id
                  ? theme.colors.brand.primary
                  : theme.colors.background.secondary,
              },
            ]}
            onPress={() => setSelectedFilter(filter.id)}
          >
            <Text
              variant="labelMedium"
              style={{
                color: selectedFilter === filter.id
                  ? '#FFFFFF'
                  : theme.colors.text.secondary,
              }}
            >
              {filter.label}
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
        {filteredTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={64} color={theme.colors.text.tertiary} />
            <Text variant="h4" color="secondary" style={{ marginTop: 16, textAlign: 'center' }}>
              No Transactions
            </Text>
            <Text variant="bodyMedium" color="tertiary" style={{ marginTop: 8, textAlign: 'center' }}>
              {selectedFilter === 'all'
                ? 'Your transaction history will appear here'
                : `No ${selectedFilter.toLowerCase()} transactions found`}
            </Text>
          </View>
        ) : (
          Object.entries(groupedTransactions).map(([dateKey, txns]) => (
            <View key={dateKey}>
              <Text variant="labelMedium" color="tertiary" style={styles.dateHeader}>
                {formatDate(new Date(dateKey))}
              </Text>

              {txns.map(txn => (
                <Card key={txn.id} variant="elevated" style={styles.transactionCard}>
                  <View style={styles.transactionContent}>
                    <View style={[styles.transactionIcon, { backgroundColor: `${getTransactionColor(txn.type)}20` }]}>
                      <Ionicons
                        name={getTransactionIcon(txn.type)}
                        size={20}
                        color={getTransactionColor(txn.type)}
                      />
                    </View>

                    <View style={styles.transactionInfo}>
                      <Text variant="labelMedium" color="primary" numberOfLines={1}>
                        {txn.description}
                      </Text>
                      <View style={styles.transactionMeta}>
                        <Text variant="caption" color="tertiary">
                          {toDate(txn.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                        {txn.reference && (
                          <>
                            <Text variant="caption" color="tertiary"> • </Text>
                            <Text variant="caption" color="tertiary">
                              {txn.reference}
                            </Text>
                          </>
                        )}
                      </View>
                    </View>

                    <View style={styles.transactionAmount}>
                      <Text
                        variant="labelLarge"
                        style={{
                          color: txn.type === 'EARNING' || txn.type === 'REFUND' || txn.type === 'ESCROW_RELEASE'
                            ? '#4CAF50'
                            : theme.colors.text.primary,
                        }}
                      >
                        {txn.type === 'EARNING' || txn.type === 'REFUND' || txn.type === 'ESCROW_RELEASE' ? '+' : '-'}
                        {formatCurrency(txn.amount)}
                      </Text>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusBadge(txn.status).bg }]}>
                        <Text variant="caption" style={{ color: getStatusBadge(txn.status).color }}>
                          {txn.status}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          ))
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
  filterContainer: {
    maxHeight: 50,
  },
  filterContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
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
  dateHeader: {
    marginTop: 16,
    marginBottom: 8,
  },
  transactionCard: {
    marginBottom: 8,
  },
  transactionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionInfo: {
    flex: 1,
    marginHorizontal: 12,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
});

export default TransactionsScreen;
