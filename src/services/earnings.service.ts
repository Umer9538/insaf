/**
 * INSAF - Lawyer Earnings Service
 *
 * Handles lawyer earnings, payouts, and financial tracking
 */

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  Unsubscribe,
  increment,
  runTransaction,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { COLLECTIONS } from './firestore.service';

// Extended collections
const EARNINGS_COLLECTIONS = {
  ...COLLECTIONS,
  EARNINGS: 'earnings',
  PAYOUTS: 'payouts',
  WALLET: 'wallets',
} as const;

// Types
export type EarningType = 'CASE_PAYMENT' | 'CONSULTATION_FEE' | 'BONUS' | 'REFUND_DEDUCTION';
export type EarningStatus = 'PENDING' | 'AVAILABLE' | 'WITHDRAWN' | 'ON_HOLD';
export type PayoutStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type PayoutMethod = 'BANK_TRANSFER' | 'JAZZCASH' | 'EASYPAISA';

export interface Earning {
  id?: string;
  lawyerId: string;
  caseId?: string;
  consultationId?: string;
  type: EarningType;
  amount: number;
  platformFee: number; // 15% as per PRD
  netAmount: number;
  status: EarningStatus;
  description: string;
  clientName?: string;
  createdAt: Timestamp;
  availableAt?: Timestamp; // When funds become available for withdrawal
  updatedAt: Timestamp;
}

export interface PayoutRequest {
  id?: string;
  lawyerId: string;
  amount: number;
  method: PayoutMethod;
  accountDetails: {
    accountName: string;
    accountNumber: string;
    bankName?: string;
  };
  status: PayoutStatus;
  transactionId?: string;
  processedAt?: Timestamp;
  failureReason?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface LawyerWallet {
  id?: string;
  lawyerId: string;
  availableBalance: number;
  pendingBalance: number;
  totalEarned: number;
  totalWithdrawn: number;
  lastUpdated: Timestamp;
}

// Constants
const PLATFORM_FEE_PERCENT = 0.15; // 15% platform fee
const MINIMUM_PAYOUT = 1000; // Minimum PKR for withdrawal
const PAYOUT_HOLD_DAYS = 7; // Days before funds are available

// Functions

/**
 * Initialize wallet for a new lawyer
 */
export const initializeLawyerWallet = async (lawyerId: string): Promise<void> => {
  const walletRef = doc(db, EARNINGS_COLLECTIONS.WALLET, lawyerId);
  const walletSnap = await getDoc(walletRef);

  if (!walletSnap.exists()) {
    await updateDoc(walletRef, {
      lawyerId,
      availableBalance: 0,
      pendingBalance: 0,
      totalEarned: 0,
      totalWithdrawn: 0,
      lastUpdated: serverTimestamp(),
    }).catch(async () => {
      // Document doesn't exist, create it
      const { setDoc } = await import('firebase/firestore');
      await setDoc(walletRef, {
        lawyerId,
        availableBalance: 0,
        pendingBalance: 0,
        totalEarned: 0,
        totalWithdrawn: 0,
        lastUpdated: serverTimestamp(),
      });
    });
  }
};

/**
 * Get lawyer's wallet
 */
export const getLawyerWallet = async (lawyerId: string): Promise<LawyerWallet | null> => {
  const walletRef = doc(db, EARNINGS_COLLECTIONS.WALLET, lawyerId);
  const walletSnap = await getDoc(walletRef);

  if (walletSnap.exists()) {
    return { id: walletSnap.id, ...walletSnap.data() } as LawyerWallet;
  }

  // Initialize wallet if doesn't exist
  await initializeLawyerWallet(lawyerId);
  const newWalletSnap = await getDoc(walletRef);
  return newWalletSnap.exists() ? { id: newWalletSnap.id, ...newWalletSnap.data() } as LawyerWallet : null;
};

/**
 * Subscribe to wallet updates
 */
export const subscribeToLawyerWallet = (
  lawyerId: string,
  callback: (wallet: LawyerWallet | null) => void
): Unsubscribe => {
  const walletRef = doc(db, EARNINGS_COLLECTIONS.WALLET, lawyerId);

  return onSnapshot(walletRef, (docSnap) => {
    if (docSnap.exists()) {
      callback({ id: docSnap.id, ...docSnap.data() } as LawyerWallet);
    } else {
      callback(null);
    }
  });
};

/**
 * Record a new earning for a lawyer (called when escrow is released)
 */
export const recordEarning = async (
  lawyerId: string,
  amount: number,
  type: EarningType,
  description: string,
  caseId?: string,
  consultationId?: string,
  clientName?: string
): Promise<string> => {
  const platformFee = Math.round(amount * PLATFORM_FEE_PERCENT);
  const netAmount = amount - platformFee;

  // Calculate when funds will be available (7 days hold)
  const availableDate = new Date();
  availableDate.setDate(availableDate.getDate() + PAYOUT_HOLD_DAYS);

  const earningData: Omit<Earning, 'id'> = {
    lawyerId,
    caseId,
    consultationId,
    type,
    amount,
    platformFee,
    netAmount,
    status: 'PENDING',
    description,
    clientName,
    createdAt: serverTimestamp() as Timestamp,
    availableAt: Timestamp.fromDate(availableDate),
    updatedAt: serverTimestamp() as Timestamp,
  };

  const docRef = await addDoc(collection(db, EARNINGS_COLLECTIONS.EARNINGS), earningData);

  // Update wallet pending balance
  const walletRef = doc(db, EARNINGS_COLLECTIONS.WALLET, lawyerId);
  await updateDoc(walletRef, {
    pendingBalance: increment(netAmount),
    totalEarned: increment(netAmount),
    lastUpdated: serverTimestamp(),
  }).catch(async () => {
    // Wallet doesn't exist, create it
    await initializeLawyerWallet(lawyerId);
    await updateDoc(walletRef, {
      pendingBalance: increment(netAmount),
      totalEarned: increment(netAmount),
      lastUpdated: serverTimestamp(),
    });
  });

  return docRef.id;
};

/**
 * Release pending earnings to available balance (called by scheduled job after hold period)
 */
export const releasePendingEarnings = async (earningId: string): Promise<void> => {
  const earningRef = doc(db, EARNINGS_COLLECTIONS.EARNINGS, earningId);
  const earningSnap = await getDoc(earningRef);

  if (!earningSnap.exists()) {
    throw new Error('Earning not found');
  }

  const earning = earningSnap.data() as Earning;

  if (earning.status !== 'PENDING') {
    throw new Error('Earning is not in pending status');
  }

  await runTransaction(db, async (transaction) => {
    // Update earning status
    transaction.update(earningRef, {
      status: 'AVAILABLE',
      updatedAt: serverTimestamp(),
    });

    // Update wallet balances
    const walletRef = doc(db, EARNINGS_COLLECTIONS.WALLET, earning.lawyerId);
    transaction.update(walletRef, {
      pendingBalance: increment(-earning.netAmount),
      availableBalance: increment(earning.netAmount),
      lastUpdated: serverTimestamp(),
    });
  });
};

/**
 * Get earnings for a lawyer
 */
export const getLawyerEarnings = async (
  lawyerId: string,
  limitCount: number = 50
): Promise<Earning[]> => {
  const q = query(
    collection(db, EARNINGS_COLLECTIONS.EARNINGS),
    where('lawyerId', '==', lawyerId),
    orderBy('createdAt', 'desc'),
    firestoreLimit(limitCount)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Earning[];
};

/**
 * Subscribe to earnings updates
 */
export const subscribeToEarnings = (
  lawyerId: string,
  callback: (earnings: Earning[]) => void,
  limitCount: number = 50
): Unsubscribe => {
  const q = query(
    collection(db, EARNINGS_COLLECTIONS.EARNINGS),
    where('lawyerId', '==', lawyerId),
    orderBy('createdAt', 'desc'),
    firestoreLimit(limitCount)
  );

  return onSnapshot(q, (querySnapshot) => {
    const earnings = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Earning[];
    callback(earnings);
  });
};

/**
 * Get earnings by status
 */
export const getEarningsByStatus = async (
  lawyerId: string,
  status: EarningStatus
): Promise<Earning[]> => {
  const q = query(
    collection(db, EARNINGS_COLLECTIONS.EARNINGS),
    where('lawyerId', '==', lawyerId),
    where('status', '==', status),
    orderBy('createdAt', 'desc')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Earning[];
};

/**
 * Request a payout
 */
export const requestPayout = async (
  lawyerId: string,
  amount: number,
  method: PayoutMethod,
  accountDetails: PayoutRequest['accountDetails']
): Promise<string> => {
  // Validate minimum amount
  if (amount < MINIMUM_PAYOUT) {
    throw new Error(`Minimum payout amount is PKR ${MINIMUM_PAYOUT}`);
  }

  // Check available balance
  const wallet = await getLawyerWallet(lawyerId);
  if (!wallet || wallet.availableBalance < amount) {
    throw new Error('Insufficient available balance');
  }

  // Create payout request
  const payoutData: Omit<PayoutRequest, 'id'> = {
    lawyerId,
    amount,
    method,
    accountDetails,
    status: 'PENDING',
    createdAt: serverTimestamp() as Timestamp,
    updatedAt: serverTimestamp() as Timestamp,
  };

  const docRef = await addDoc(collection(db, EARNINGS_COLLECTIONS.PAYOUTS), payoutData);

  // Deduct from available balance (will be held until payout is processed)
  const walletRef = doc(db, EARNINGS_COLLECTIONS.WALLET, lawyerId);
  await updateDoc(walletRef, {
    availableBalance: increment(-amount),
    lastUpdated: serverTimestamp(),
  });

  return docRef.id;
};

/**
 * Get payout requests for a lawyer
 */
export const getPayoutRequests = async (
  lawyerId: string,
  limitCount: number = 20
): Promise<PayoutRequest[]> => {
  const q = query(
    collection(db, EARNINGS_COLLECTIONS.PAYOUTS),
    where('lawyerId', '==', lawyerId),
    orderBy('createdAt', 'desc'),
    firestoreLimit(limitCount)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as PayoutRequest[];
};

/**
 * Subscribe to payout requests
 */
export const subscribeToPayouts = (
  lawyerId: string,
  callback: (payouts: PayoutRequest[]) => void
): Unsubscribe => {
  const q = query(
    collection(db, EARNINGS_COLLECTIONS.PAYOUTS),
    where('lawyerId', '==', lawyerId),
    orderBy('createdAt', 'desc'),
    firestoreLimit(20)
  );

  return onSnapshot(q, (querySnapshot) => {
    const payouts = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as PayoutRequest[];
    callback(payouts);
  });
};

/**
 * Cancel a pending payout request
 */
export const cancelPayoutRequest = async (payoutId: string, lawyerId: string): Promise<void> => {
  const payoutRef = doc(db, EARNINGS_COLLECTIONS.PAYOUTS, payoutId);
  const payoutSnap = await getDoc(payoutRef);

  if (!payoutSnap.exists()) {
    throw new Error('Payout request not found');
  }

  const payout = payoutSnap.data() as PayoutRequest;

  if (payout.lawyerId !== lawyerId) {
    throw new Error('Unauthorized');
  }

  if (payout.status !== 'PENDING') {
    throw new Error('Cannot cancel this payout request');
  }

  await runTransaction(db, async (transaction) => {
    // Update payout status
    transaction.update(payoutRef, {
      status: 'CANCELLED',
      updatedAt: serverTimestamp(),
    });

    // Refund to available balance
    const walletRef = doc(db, EARNINGS_COLLECTIONS.WALLET, lawyerId);
    transaction.update(walletRef, {
      availableBalance: increment(payout.amount),
      lastUpdated: serverTimestamp(),
    });
  });
};

// Admin functions

/**
 * Process a payout (admin function)
 */
export const processPayout = async (
  payoutId: string,
  transactionId: string
): Promise<void> => {
  const payoutRef = doc(db, EARNINGS_COLLECTIONS.PAYOUTS, payoutId);
  const payoutSnap = await getDoc(payoutRef);

  if (!payoutSnap.exists()) {
    throw new Error('Payout request not found');
  }

  const payout = payoutSnap.data() as PayoutRequest;

  await runTransaction(db, async (transaction) => {
    transaction.update(payoutRef, {
      status: 'COMPLETED',
      transactionId,
      processedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Update total withdrawn in wallet
    const walletRef = doc(db, EARNINGS_COLLECTIONS.WALLET, payout.lawyerId);
    transaction.update(walletRef, {
      totalWithdrawn: increment(payout.amount),
      lastUpdated: serverTimestamp(),
    });
  });
};

/**
 * Fail a payout (admin function)
 */
export const failPayout = async (
  payoutId: string,
  failureReason: string
): Promise<void> => {
  const payoutRef = doc(db, EARNINGS_COLLECTIONS.PAYOUTS, payoutId);
  const payoutSnap = await getDoc(payoutRef);

  if (!payoutSnap.exists()) {
    throw new Error('Payout request not found');
  }

  const payout = payoutSnap.data() as PayoutRequest;

  await runTransaction(db, async (transaction) => {
    transaction.update(payoutRef, {
      status: 'FAILED',
      failureReason,
      updatedAt: serverTimestamp(),
    });

    // Refund to available balance
    const walletRef = doc(db, EARNINGS_COLLECTIONS.WALLET, payout.lawyerId);
    transaction.update(walletRef, {
      availableBalance: increment(payout.amount),
      lastUpdated: serverTimestamp(),
    });
  });
};

/**
 * Get earnings summary for a lawyer
 */
export const getEarningsSummary = async (
  lawyerId: string,
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalEarnings: number;
  totalPlatformFees: number;
  netEarnings: number;
  pendingEarnings: number;
  availableEarnings: number;
  withdrawnAmount: number;
  earningsCount: number;
}> => {
  let q = query(
    collection(db, EARNINGS_COLLECTIONS.EARNINGS),
    where('lawyerId', '==', lawyerId)
  );

  if (startDate) {
    q = query(q, where('createdAt', '>=', Timestamp.fromDate(startDate)));
  }

  if (endDate) {
    q = query(q, where('createdAt', '<=', Timestamp.fromDate(endDate)));
  }

  const querySnapshot = await getDocs(q);
  const earnings = querySnapshot.docs.map(doc => doc.data() as Earning);

  const wallet = await getLawyerWallet(lawyerId);

  let totalEarnings = 0;
  let totalPlatformFees = 0;
  let netEarnings = 0;
  let pendingEarnings = 0;
  let availableEarnings = 0;

  earnings.forEach(earning => {
    totalEarnings += earning.amount;
    totalPlatformFees += earning.platformFee;
    netEarnings += earning.netAmount;

    if (earning.status === 'PENDING') {
      pendingEarnings += earning.netAmount;
    } else if (earning.status === 'AVAILABLE') {
      availableEarnings += earning.netAmount;
    }
  });

  return {
    totalEarnings,
    totalPlatformFees,
    netEarnings,
    pendingEarnings,
    availableEarnings,
    withdrawnAmount: wallet?.totalWithdrawn || 0,
    earningsCount: earnings.length,
  };
};
