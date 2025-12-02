/**
 * INSAF - Wallet Service
 *
 * Handles wallet management, payment methods, and transactions
 */

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  Unsubscribe,
  runTransaction,
  setDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { COLLECTIONS } from './firestore.service';

// Types
export type PaymentMethodType = 'BANK_ACCOUNT' | 'JAZZCASH' | 'EASYPAISA' | 'CARD';
export type TransactionType =
  | 'DEPOSIT'
  | 'WITHDRAWAL'
  | 'CASE_PAYMENT'
  | 'CONSULTATION_PAYMENT'
  | 'REFUND'
  | 'PLATFORM_FEE';
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface PaymentMethod {
  id?: string;
  userId: string;
  type: PaymentMethodType;
  isDefault: boolean;
  isVerified: boolean;
  details: {
    // For bank account
    bankName?: string;
    accountTitle?: string;
    accountNumber?: string;
    branchCode?: string;
    iban?: string;
    // For JazzCash/Easypaisa
    phoneNumber?: string;
    accountName?: string;
    // For card (limited info for security)
    cardLastFour?: string;
    cardBrand?: string;
    expiryMonth?: string;
    expiryYear?: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Transaction {
  id?: string;
  userId: string;
  type: TransactionType;
  amount: number;
  fee?: number;
  netAmount: number;
  status: TransactionStatus;
  paymentMethodId?: string;
  reference?: string;
  description: string;
  relatedId?: string; // Case ID, consultation ID, etc.
  metadata?: Record<string, any>;
  createdAt: Timestamp;
  completedAt?: Timestamp;
  failureReason?: string;
}

export interface Wallet {
  id?: string;
  userId: string;
  balance: number;
  currency: 'PKR';
  lastTransactionAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Constants
const WALLET_COLLECTION = 'wallets';
const PAYMENT_METHODS_COLLECTION = 'paymentMethods';
const TRANSACTIONS_COLLECTION = 'transactions';

// Wallet Functions

/**
 * Get or create wallet for a user
 */
export const getOrCreateWallet = async (userId: string): Promise<Wallet> => {
  const walletRef = doc(db, WALLET_COLLECTION, userId);
  const walletSnap = await getDoc(walletRef);

  if (walletSnap.exists()) {
    return { id: walletSnap.id, ...walletSnap.data() } as Wallet;
  }

  // Create new wallet
  const newWallet: Omit<Wallet, 'id'> = {
    userId,
    balance: 0,
    currency: 'PKR',
    createdAt: serverTimestamp() as Timestamp,
    updatedAt: serverTimestamp() as Timestamp,
  };

  await setDoc(walletRef, newWallet);
  return { id: userId, ...newWallet, createdAt: Timestamp.now(), updatedAt: Timestamp.now() };
};

/**
 * Get wallet balance
 */
export const getWalletBalance = async (userId: string): Promise<number> => {
  const wallet = await getOrCreateWallet(userId);
  return wallet.balance;
};

/**
 * Subscribe to wallet updates
 */
export const subscribeToWallet = (
  userId: string,
  callback: (wallet: Wallet) => void
): Unsubscribe => {
  const walletRef = doc(db, WALLET_COLLECTION, userId);

  return onSnapshot(walletRef, async (docSnap) => {
    if (docSnap.exists()) {
      callback({ id: docSnap.id, ...docSnap.data() } as Wallet);
    } else {
      // Create wallet if doesn't exist
      const wallet = await getOrCreateWallet(userId);
      callback(wallet);
    }
  });
};

/**
 * Add funds to wallet (internal use)
 */
export const addFundsToWallet = async (
  userId: string,
  amount: number,
  description: string,
  relatedId?: string
): Promise<string> => {
  return await runTransaction(db, async (transaction) => {
    const walletRef = doc(db, WALLET_COLLECTION, userId);
    const walletSnap = await transaction.get(walletRef);

    if (!walletSnap.exists()) {
      // Create wallet if doesn't exist
      transaction.set(walletRef, {
        userId,
        balance: amount,
        currency: 'PKR',
        lastTransactionAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      const currentBalance = walletSnap.data().balance || 0;
      transaction.update(walletRef, {
        balance: currentBalance + amount,
        lastTransactionAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    // Create transaction record
    const transactionData: Omit<Transaction, 'id'> = {
      userId,
      type: 'DEPOSIT',
      amount,
      netAmount: amount,
      status: 'COMPLETED',
      description,
      relatedId,
      createdAt: serverTimestamp() as Timestamp,
      completedAt: serverTimestamp() as Timestamp,
    };

    const transactionRef = doc(collection(db, TRANSACTIONS_COLLECTION));
    transaction.set(transactionRef, transactionData);

    return transactionRef.id;
  });
};

/**
 * Deduct funds from wallet (internal use)
 */
export const deductFundsFromWallet = async (
  userId: string,
  amount: number,
  description: string,
  relatedId?: string
): Promise<string> => {
  return await runTransaction(db, async (transaction) => {
    const walletRef = doc(db, WALLET_COLLECTION, userId);
    const walletSnap = await transaction.get(walletRef);

    if (!walletSnap.exists()) {
      throw new Error('Wallet not found');
    }

    const currentBalance = walletSnap.data().balance || 0;
    if (currentBalance < amount) {
      throw new Error('Insufficient balance');
    }

    transaction.update(walletRef, {
      balance: currentBalance - amount,
      lastTransactionAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Create transaction record
    const transactionData: Omit<Transaction, 'id'> = {
      userId,
      type: 'WITHDRAWAL',
      amount,
      netAmount: amount,
      status: 'COMPLETED',
      description,
      relatedId,
      createdAt: serverTimestamp() as Timestamp,
      completedAt: serverTimestamp() as Timestamp,
    };

    const transactionRef = doc(collection(db, TRANSACTIONS_COLLECTION));
    transaction.set(transactionRef, transactionData);

    return transactionRef.id;
  });
};

// Payment Method Functions

/**
 * Add a payment method
 */
export const addPaymentMethod = async (
  userId: string,
  type: PaymentMethodType,
  details: PaymentMethod['details'],
  setAsDefault: boolean = false
): Promise<string> => {
  // If setting as default, unset other defaults
  if (setAsDefault) {
    const existingMethods = await getPaymentMethods(userId);
    for (const method of existingMethods) {
      if (method.isDefault && method.id) {
        await updateDoc(doc(db, PAYMENT_METHODS_COLLECTION, method.id), {
          isDefault: false,
          updatedAt: serverTimestamp(),
        });
      }
    }
  }

  const paymentMethodData: Omit<PaymentMethod, 'id'> = {
    userId,
    type,
    isDefault: setAsDefault,
    isVerified: false, // Requires verification process
    details,
    createdAt: serverTimestamp() as Timestamp,
    updatedAt: serverTimestamp() as Timestamp,
  };

  const docRef = await addDoc(collection(db, PAYMENT_METHODS_COLLECTION), paymentMethodData);
  return docRef.id;
};

/**
 * Get all payment methods for a user
 */
export const getPaymentMethods = async (userId: string): Promise<PaymentMethod[]> => {
  const q = query(
    collection(db, PAYMENT_METHODS_COLLECTION),
    where('userId', '==', userId)
  );

  const querySnapshot = await getDocs(q);
  const methods = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as PaymentMethod[];

  // Sort in memory: default first, then by creation date
  return methods.sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    const aTime = a.createdAt?.toMillis?.() || 0;
    const bTime = b.createdAt?.toMillis?.() || 0;
    return bTime - aTime;
  });
};

/**
 * Get default payment method
 */
export const getDefaultPaymentMethod = async (userId: string): Promise<PaymentMethod | null> => {
  const q = query(
    collection(db, PAYMENT_METHODS_COLLECTION),
    where('userId', '==', userId),
    where('isDefault', '==', true),
    firestoreLimit(1)
  );

  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as PaymentMethod;
  }

  return null;
};

/**
 * Set payment method as default
 */
export const setDefaultPaymentMethod = async (
  userId: string,
  paymentMethodId: string
): Promise<void> => {
  // Get the payment method to verify ownership
  const methodRef = doc(db, PAYMENT_METHODS_COLLECTION, paymentMethodId);
  const methodSnap = await getDoc(methodRef);

  if (!methodSnap.exists()) {
    throw new Error('Payment method not found');
  }

  const method = methodSnap.data() as PaymentMethod;
  if (method.userId !== userId) {
    throw new Error('Unauthorized');
  }

  // Unset other defaults
  const existingMethods = await getPaymentMethods(userId);
  for (const m of existingMethods) {
    if (m.isDefault && m.id && m.id !== paymentMethodId) {
      await updateDoc(doc(db, PAYMENT_METHODS_COLLECTION, m.id), {
        isDefault: false,
        updatedAt: serverTimestamp(),
      });
    }
  }

  // Set new default
  await updateDoc(methodRef, {
    isDefault: true,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Update payment method
 */
export const updatePaymentMethod = async (
  paymentMethodId: string,
  userId: string,
  updates: Partial<Pick<PaymentMethod, 'details'>>
): Promise<void> => {
  const methodRef = doc(db, PAYMENT_METHODS_COLLECTION, paymentMethodId);
  const methodSnap = await getDoc(methodRef);

  if (!methodSnap.exists()) {
    throw new Error('Payment method not found');
  }

  const method = methodSnap.data() as PaymentMethod;
  if (method.userId !== userId) {
    throw new Error('Unauthorized');
  }

  await updateDoc(methodRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Delete payment method
 */
export const deletePaymentMethod = async (
  paymentMethodId: string,
  userId: string
): Promise<void> => {
  const methodRef = doc(db, PAYMENT_METHODS_COLLECTION, paymentMethodId);
  const methodSnap = await getDoc(methodRef);

  if (!methodSnap.exists()) {
    throw new Error('Payment method not found');
  }

  const method = methodSnap.data() as PaymentMethod;
  if (method.userId !== userId) {
    throw new Error('Unauthorized');
  }

  await deleteDoc(methodRef);

  // If deleted method was default, set another as default
  if (method.isDefault) {
    const remainingMethods = await getPaymentMethods(userId);
    if (remainingMethods.length > 0 && remainingMethods[0].id) {
      await updateDoc(doc(db, PAYMENT_METHODS_COLLECTION, remainingMethods[0].id), {
        isDefault: true,
        updatedAt: serverTimestamp(),
      });
    }
  }
};

/**
 * Verify payment method (admin/system function)
 */
export const verifyPaymentMethod = async (paymentMethodId: string): Promise<void> => {
  const methodRef = doc(db, PAYMENT_METHODS_COLLECTION, paymentMethodId);

  await updateDoc(methodRef, {
    isVerified: true,
    updatedAt: serverTimestamp(),
  });
};

// Transaction Functions

/**
 * Get transactions for a user
 */
export const getTransactions = async (
  userId: string,
  limitCount: number = 50
): Promise<Transaction[]> => {
  const q = query(
    collection(db, TRANSACTIONS_COLLECTION),
    where('userId', '==', userId)
  );

  const querySnapshot = await getDocs(q);
  const transactions = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Transaction[];

  // Sort in memory by createdAt descending and limit
  return transactions
    .sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || 0;
      const bTime = b.createdAt?.toMillis?.() || 0;
      return bTime - aTime;
    })
    .slice(0, limitCount);
};

/**
 * Subscribe to transactions
 */
export const subscribeToTransactions = (
  userId: string,
  callback: (transactions: Transaction[]) => void,
  limitCount: number = 20
): Unsubscribe => {
  const q = query(
    collection(db, TRANSACTIONS_COLLECTION),
    where('userId', '==', userId)
  );

  return onSnapshot(q, (querySnapshot) => {
    const transactions = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Transaction[];

    // Sort in memory by createdAt descending and limit
    const sorted = transactions
      .sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      })
      .slice(0, limitCount);

    callback(sorted);
  });
};

/**
 * Get transactions by type
 */
export const getTransactionsByType = async (
  userId: string,
  type: TransactionType,
  limitCount: number = 50
): Promise<Transaction[]> => {
  // Fetch all user transactions and filter in memory to avoid composite index
  const q = query(
    collection(db, TRANSACTIONS_COLLECTION),
    where('userId', '==', userId)
  );

  const querySnapshot = await getDocs(q);
  const transactions = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Transaction[];

  // Filter by type, sort by createdAt descending, and limit
  return transactions
    .filter(t => t.type === type)
    .sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || 0;
      const bTime = b.createdAt?.toMillis?.() || 0;
      return bTime - aTime;
    })
    .slice(0, limitCount);
};

/**
 * Get transaction by ID
 */
export const getTransactionById = async (transactionId: string): Promise<Transaction | null> => {
  const transactionRef = doc(db, TRANSACTIONS_COLLECTION, transactionId);
  const transactionSnap = await getDoc(transactionRef);

  if (transactionSnap.exists()) {
    return { id: transactionSnap.id, ...transactionSnap.data() } as Transaction;
  }

  return null;
};

/**
 * Get transaction summary for a user
 */
export const getTransactionSummary = async (
  userId: string,
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalDeposits: number;
  totalWithdrawals: number;
  totalCasePayments: number;
  totalConsultationPayments: number;
  totalRefunds: number;
  totalFees: number;
  netAmount: number;
  transactionCount: number;
}> => {
  let q = query(
    collection(db, TRANSACTIONS_COLLECTION),
    where('userId', '==', userId),
    where('status', '==', 'COMPLETED')
  );

  if (startDate) {
    q = query(q, where('createdAt', '>=', Timestamp.fromDate(startDate)));
  }

  if (endDate) {
    q = query(q, where('createdAt', '<=', Timestamp.fromDate(endDate)));
  }

  const querySnapshot = await getDocs(q);
  const transactions = querySnapshot.docs.map(doc => doc.data() as Transaction);

  let totalDeposits = 0;
  let totalWithdrawals = 0;
  let totalCasePayments = 0;
  let totalConsultationPayments = 0;
  let totalRefunds = 0;
  let totalFees = 0;

  transactions.forEach(t => {
    switch (t.type) {
      case 'DEPOSIT':
        totalDeposits += t.amount;
        break;
      case 'WITHDRAWAL':
        totalWithdrawals += t.amount;
        break;
      case 'CASE_PAYMENT':
        totalCasePayments += t.amount;
        break;
      case 'CONSULTATION_PAYMENT':
        totalConsultationPayments += t.amount;
        break;
      case 'REFUND':
        totalRefunds += t.amount;
        break;
      case 'PLATFORM_FEE':
        totalFees += t.amount;
        break;
    }
  });

  const netAmount = totalDeposits + totalCasePayments + totalConsultationPayments + totalRefunds
    - totalWithdrawals - totalFees;

  return {
    totalDeposits,
    totalWithdrawals,
    totalCasePayments,
    totalConsultationPayments,
    totalRefunds,
    totalFees,
    netAmount,
    transactionCount: transactions.length,
  };
};

/**
 * Create a pending transaction (for external payment processing)
 */
export const createPendingTransaction = async (
  userId: string,
  type: TransactionType,
  amount: number,
  description: string,
  paymentMethodId?: string,
  relatedId?: string,
  fee?: number
): Promise<string> => {
  const netAmount = amount - (fee || 0);

  const transactionData: Omit<Transaction, 'id'> = {
    userId,
    type,
    amount,
    fee,
    netAmount,
    status: 'PENDING',
    paymentMethodId,
    description,
    relatedId,
    createdAt: serverTimestamp() as Timestamp,
  };

  const docRef = await addDoc(collection(db, TRANSACTIONS_COLLECTION), transactionData);
  return docRef.id;
};

/**
 * Complete a pending transaction
 */
export const completeTransaction = async (
  transactionId: string,
  reference?: string
): Promise<void> => {
  const transactionRef = doc(db, TRANSACTIONS_COLLECTION, transactionId);
  const transactionSnap = await getDoc(transactionRef);

  if (!transactionSnap.exists()) {
    throw new Error('Transaction not found');
  }

  const transaction = transactionSnap.data() as Transaction;
  if (transaction.status !== 'PENDING') {
    throw new Error('Transaction is not in pending status');
  }

  await updateDoc(transactionRef, {
    status: 'COMPLETED',
    reference,
    completedAt: serverTimestamp(),
  });
};

/**
 * Fail a pending transaction
 */
export const failTransaction = async (
  transactionId: string,
  failureReason: string
): Promise<void> => {
  const transactionRef = doc(db, TRANSACTIONS_COLLECTION, transactionId);

  await updateDoc(transactionRef, {
    status: 'FAILED',
    failureReason,
  });
};
