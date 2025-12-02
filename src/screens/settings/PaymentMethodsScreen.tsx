/**
 * INSAF - Payment Methods Screen
 *
 * Manage payment methods for receiving/making payments
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
import { useAppTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Text } from '../../components/common/Text';
import { Card } from '../../components/common/Card';
import {
  getPaymentMethods,
  addPaymentMethod,
  PaymentMethod,
  PaymentMethodType,
} from '../../services/wallet.service';
import { db } from '../../config/firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';

const PAYMENT_METHOD_TYPES: { type: PaymentMethodType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { type: 'BANK_ACCOUNT', label: 'Bank Account', icon: 'business-outline' },
  { type: 'JAZZCASH', label: 'JazzCash', icon: 'phone-portrait-outline' },
  { type: 'EASYPAISA', label: 'Easypaisa', icon: 'phone-portrait-outline' },
];

export const PaymentMethodsScreen: React.FC = () => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedType, setSelectedType] = useState<PaymentMethodType>('BANK_ACCOUNT');
  const [saving, setSaving] = useState(false);

  // Form fields
  const [bankName, setBankName] = useState('');
  const [accountTitle, setAccountTitle] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    fetchPaymentMethods();
  }, [user?.uid]);

  const fetchPaymentMethods = async () => {
    if (!user?.uid) return;

    try {
      const methods = await getPaymentMethods(user.uid);
      setPaymentMethods(methods);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPaymentMethods();
  };

  const resetForm = () => {
    setBankName('');
    setAccountTitle('');
    setAccountNumber('');
    setPhoneNumber('');
    setSelectedType('BANK_ACCOUNT');
  };

  const handleAddMethod = async () => {
    if (!user?.uid) return;

    if (selectedType === 'BANK_ACCOUNT') {
      if (!bankName.trim() || !accountTitle.trim() || !accountNumber.trim()) {
        Alert.alert('Missing Fields', 'Please fill in all bank details');
        return;
      }
    } else {
      if (!phoneNumber.trim()) {
        Alert.alert('Missing Fields', 'Please enter your phone number');
        return;
      }
    }

    setSaving(true);
    try {
      await addPaymentMethod(user.uid, {
        type: selectedType,
        bankName: selectedType === 'BANK_ACCOUNT' ? bankName : undefined,
        accountTitle: selectedType === 'BANK_ACCOUNT' ? accountTitle : undefined,
        accountNumber: selectedType === 'BANK_ACCOUNT' ? accountNumber : undefined,
        phoneNumber: selectedType !== 'BANK_ACCOUNT' ? phoneNumber : undefined,
        isDefault: paymentMethods.length === 0,
      });

      Alert.alert('Success', 'Payment method added successfully');
      setShowAddModal(false);
      resetForm();
      fetchPaymentMethods();
    } catch (error) {
      Alert.alert('Error', 'Failed to add payment method');
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (method: PaymentMethod) => {
    if (!user?.uid || method.isDefault) return;

    try {
      // Update current default to non-default
      const currentDefault = paymentMethods.find(m => m.isDefault);
      if (currentDefault) {
        await updateDoc(doc(db, 'paymentMethods', currentDefault.id), { isDefault: false });
      }

      // Set new default
      await updateDoc(doc(db, 'paymentMethods', method.id), { isDefault: true });

      Alert.alert('Success', 'Default payment method updated');
      fetchPaymentMethods();
    } catch (error) {
      Alert.alert('Error', 'Failed to update default method');
    }
  };

  const handleDeleteMethod = (method: PaymentMethod) => {
    Alert.alert(
      'Delete Payment Method',
      `Are you sure you want to delete this ${method.type === 'BANK_ACCOUNT' ? 'bank account' : 'mobile wallet'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'paymentMethods', method.id));
              Alert.alert('Success', 'Payment method deleted');
              fetchPaymentMethods();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete payment method');
            }
          },
        },
      ]
    );
  };

  const getMethodIcon = (type: PaymentMethodType): keyof typeof Ionicons.glyphMap => {
    return type === 'BANK_ACCOUNT' ? 'business-outline' : 'phone-portrait-outline';
  };

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
        <Text variant="h3" color="primary">Payment Methods</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <Ionicons name="add" size={24} color={theme.colors.brand.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {paymentMethods.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="card-outline" size={64} color={theme.colors.text.tertiary} />
            <Text variant="h4" color="secondary" style={{ marginTop: 16, textAlign: 'center' }}>
              No Payment Methods
            </Text>
            <Text variant="bodyMedium" color="tertiary" style={{ marginTop: 8, textAlign: 'center' }}>
              Add a bank account or mobile wallet to receive payments
            </Text>
            <TouchableOpacity
              style={[styles.emptyAddButton, { backgroundColor: theme.colors.brand.primary }]}
              onPress={() => setShowAddModal(true)}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text variant="labelMedium" style={{ color: '#FFFFFF', marginLeft: 8 }}>
                Add Payment Method
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text variant="labelMedium" color="tertiary" style={styles.sectionLabel}>
              Your payment methods
            </Text>

            {paymentMethods.map(method => (
              <Card key={method.id} variant="elevated" style={styles.methodCard}>
                <View style={styles.methodContent}>
                  <View style={[styles.methodIcon, { backgroundColor: theme.colors.background.secondary }]}>
                    <Ionicons
                      name={getMethodIcon(method.type)}
                      size={24}
                      color={theme.colors.brand.primary}
                    />
                  </View>

                  <View style={styles.methodInfo}>
                    <View style={styles.methodHeader}>
                      <Text variant="labelLarge" color="primary">
                        {method.type === 'BANK_ACCOUNT' ? method.bankName : method.type.replace('_', '')}
                      </Text>
                      {method.isDefault && (
                        <View style={[styles.defaultBadge, { backgroundColor: '#E8F5E9' }]}>
                          <Text variant="caption" style={{ color: '#4CAF50' }}>Default</Text>
                        </View>
                      )}
                    </View>
                    <Text variant="bodySmall" color="secondary">
                      {method.type === 'BANK_ACCOUNT' ? method.accountTitle : 'Mobile Wallet'}
                    </Text>
                    <Text variant="caption" color="tertiary">
                      {method.type === 'BANK_ACCOUNT'
                        ? `****${method.accountNumber?.slice(-4)}`
                        : method.phoneNumber}
                    </Text>
                  </View>

                  <View style={styles.methodActions}>
                    {!method.isDefault && (
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleSetDefault(method)}
                      >
                        <Ionicons name="star-outline" size={20} color={theme.colors.text.tertiary} />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleDeleteMethod(method)}
                    >
                      <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            ))}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add Method Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background.primary }]}>
            <View style={styles.modalHeader}>
              <Text variant="h4" color="primary">Add Payment Method</Text>
              <TouchableOpacity onPress={() => { setShowAddModal(false); resetForm(); }}>
                <Ionicons name="close" size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>

            {/* Type Selection */}
            <Text variant="labelMedium" color="secondary" style={styles.modalLabel}>
              Method Type
            </Text>
            <View style={styles.typeSelector}>
              {PAYMENT_METHOD_TYPES.map(type => (
                <TouchableOpacity
                  key={type.type}
                  style={[
                    styles.typeOption,
                    {
                      backgroundColor: selectedType === type.type
                        ? theme.colors.brand.primary
                        : theme.colors.background.secondary,
                    },
                  ]}
                  onPress={() => setSelectedType(type.type)}
                >
                  <Ionicons
                    name={type.icon}
                    size={18}
                    color={selectedType === type.type ? '#FFFFFF' : theme.colors.text.secondary}
                  />
                  <Text
                    variant="labelSmall"
                    style={{
                      color: selectedType === type.type ? '#FFFFFF' : theme.colors.text.secondary,
                      marginLeft: 4,
                    }}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Bank Account Fields */}
            {selectedType === 'BANK_ACCOUNT' && (
              <>
                <Text variant="labelMedium" color="secondary" style={styles.modalLabel}>
                  Bank Name
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.background.secondary, color: theme.colors.text.primary }]}
                  value={bankName}
                  onChangeText={setBankName}
                  placeholder="e.g., HBL, UBL, Meezan"
                  placeholderTextColor={theme.colors.text.tertiary}
                />

                <Text variant="labelMedium" color="secondary" style={styles.modalLabel}>
                  Account Title
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.background.secondary, color: theme.colors.text.primary }]}
                  value={accountTitle}
                  onChangeText={setAccountTitle}
                  placeholder="Name on account"
                  placeholderTextColor={theme.colors.text.tertiary}
                />

                <Text variant="labelMedium" color="secondary" style={styles.modalLabel}>
                  Account Number / IBAN
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.background.secondary, color: theme.colors.text.primary }]}
                  value={accountNumber}
                  onChangeText={setAccountNumber}
                  placeholder="Enter account number"
                  placeholderTextColor={theme.colors.text.tertiary}
                  keyboardType="default"
                />
              </>
            )}

            {/* Mobile Wallet Fields */}
            {selectedType !== 'BANK_ACCOUNT' && (
              <>
                <Text variant="labelMedium" color="secondary" style={styles.modalLabel}>
                  Phone Number
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.background.secondary, color: theme.colors.text.primary }]}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="03XX XXXXXXX"
                  placeholderTextColor={theme.colors.text.tertiary}
                  keyboardType="phone-pad"
                />
              </>
            )}

            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: theme.colors.brand.primary }]}
              onPress={handleAddMethod}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text variant="labelLarge" style={{ color: '#FFFFFF' }}>Add Method</Text>
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
  addButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionLabel: {
    marginBottom: 12,
  },
  methodCard: {
    marginBottom: 12,
  },
  methodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodInfo: {
    flex: 1,
    marginHorizontal: 12,
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  defaultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  methodActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 24,
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
    marginTop: 16,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
  },
  input: {
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  saveButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
  },
});

export default PaymentMethodsScreen;
