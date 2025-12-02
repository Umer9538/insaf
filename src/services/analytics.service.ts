/**
 * INSAF - Analytics Service
 *
 * Provides dashboard statistics and analytics for lawyers
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  Timestamp,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { COLLECTIONS } from './firestore.service';
import { getLawyerEarnings, getLawyerWallet } from './earnings.service';
import { getReviewStats } from './review.service';
import { Case, CaseStatus } from './case.service';
import { Bid, BidStatus } from './bid.service';

// Types
export interface LawyerDashboardStats {
  // Case Statistics
  totalCases: number;
  activeCases: number;
  completedCases: number;
  casesThisMonth: number;

  // Bid Statistics
  totalBids: number;
  pendingBids: number;
  acceptedBids: number;
  rejectedBids: number;
  bidSuccessRate: number;

  // Financial Statistics
  totalEarnings: number;
  earningsThisMonth: number;
  pendingPayments: number;
  availableBalance: number;

  // Rating Statistics
  averageRating: number;
  totalReviews: number;

  // Consultation Statistics
  totalConsultations: number;
  upcomingConsultations: number;
  completedConsultations: number;
}

export interface EarningsTrend {
  period: string; // YYYY-MM for monthly, YYYY-MM-DD for daily
  amount: number;
  count: number;
}

export interface CaseTrend {
  period: string;
  newCases: number;
  completedCases: number;
}

export interface PerformanceMetrics {
  responseTime: number; // Average hours to respond to bids
  caseCompletionRate: number; // Percentage of cases completed successfully
  clientRetentionRate: number; // Percentage of returning clients
  disputeRate: number; // Percentage of cases that had disputes
}

// Functions

/**
 * Get comprehensive dashboard stats for a lawyer
 */
export const getLawyerDashboardStats = async (
  lawyerId: string
): Promise<LawyerDashboardStats> => {
  // Get current date info
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfMonthTimestamp = Timestamp.fromDate(startOfMonth);

  // Fetch all data in parallel
  const [
    casesData,
    bidsData,
    wallet,
    reviewStats,
    consultationsData,
  ] = await Promise.all([
    getCaseStats(lawyerId, startOfMonthTimestamp),
    getBidStats(lawyerId),
    getLawyerWallet(lawyerId),
    getReviewStats(lawyerId),
    getConsultationStats(lawyerId, startOfMonthTimestamp),
  ]);

  // Calculate earnings this month
  const earnings = await getLawyerEarnings(lawyerId, 100);
  const earningsThisMonth = earnings
    .filter(e => e.createdAt && e.createdAt.toDate() >= startOfMonth)
    .reduce((sum, e) => sum + e.netAmount, 0);

  return {
    // Case Statistics
    totalCases: casesData.total,
    activeCases: casesData.active,
    completedCases: casesData.completed,
    casesThisMonth: casesData.thisMonth,

    // Bid Statistics
    totalBids: bidsData.total,
    pendingBids: bidsData.pending,
    acceptedBids: bidsData.accepted,
    rejectedBids: bidsData.rejected,
    bidSuccessRate: bidsData.total > 0
      ? Math.round((bidsData.accepted / bidsData.total) * 100)
      : 0,

    // Financial Statistics
    totalEarnings: wallet?.totalEarned || 0,
    earningsThisMonth,
    pendingPayments: wallet?.pendingBalance || 0,
    availableBalance: wallet?.availableBalance || 0,

    // Rating Statistics
    averageRating: reviewStats.averageRating,
    totalReviews: reviewStats.totalReviews,

    // Consultation Statistics
    totalConsultations: consultationsData.total,
    upcomingConsultations: consultationsData.upcoming,
    completedConsultations: consultationsData.completed,
  };
};

/**
 * Get case statistics
 */
const getCaseStats = async (
  lawyerId: string,
  startOfMonth: Timestamp
): Promise<{
  total: number;
  active: number;
  completed: number;
  thisMonth: number;
}> => {
  const q = query(
    collection(db, COLLECTIONS.CASES),
    where('lawyerId', '==', lawyerId)
  );

  const querySnapshot = await getDocs(q);
  const cases = querySnapshot.docs.map(doc => doc.data() as Case);

  const activeStatuses: CaseStatus[] = ['ASSIGNED', 'IN_PROGRESS', 'CASE_CLEAR_PENDING'];

  return {
    total: cases.length,
    active: cases.filter(c => activeStatuses.includes(c.status)).length,
    completed: cases.filter(c => c.status === 'COMPLETED').length,
    thisMonth: cases.filter(c =>
      c.assignedAt && c.assignedAt.toDate() >= startOfMonth.toDate()
    ).length,
  };
};

/**
 * Get bid statistics
 */
const getBidStats = async (
  lawyerId: string
): Promise<{
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
}> => {
  const q = query(
    collection(db, COLLECTIONS.BIDS),
    where('lawyerId', '==', lawyerId)
  );

  const querySnapshot = await getDocs(q);
  const bids = querySnapshot.docs.map(doc => doc.data() as Bid);

  return {
    total: bids.length,
    pending: bids.filter(b => b.status === 'PENDING').length,
    accepted: bids.filter(b => b.status === 'ACCEPTED').length,
    rejected: bids.filter(b => b.status === 'REJECTED').length,
  };
};

/**
 * Get consultation statistics
 */
const getConsultationStats = async (
  lawyerId: string,
  startOfMonth: Timestamp
): Promise<{
  total: number;
  upcoming: number;
  completed: number;
}> => {
  const q = query(
    collection(db, COLLECTIONS.CONSULTATIONS),
    where('lawyerId', '==', lawyerId)
  );

  const querySnapshot = await getDocs(q);
  const consultations = querySnapshot.docs.map(doc => doc.data());

  const now = new Date();

  return {
    total: consultations.length,
    upcoming: consultations.filter(c =>
      c.status === 'CONFIRMED' && c.scheduledDate.toDate() > now
    ).length,
    completed: consultations.filter(c => c.status === 'COMPLETED').length,
  };
};

/**
 * Get earnings trend for the last N months
 */
export const getEarningsTrend = async (
  lawyerId: string,
  months: number = 6
): Promise<EarningsTrend[]> => {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const q = query(
    collection(db, 'earnings'),
    where('lawyerId', '==', lawyerId),
    where('createdAt', '>=', Timestamp.fromDate(startDate)),
    orderBy('createdAt', 'asc')
  );

  const querySnapshot = await getDocs(q);
  const earnings = querySnapshot.docs.map(doc => doc.data());

  // Group by month
  const trendMap = new Map<string, { amount: number; count: number }>();

  earnings.forEach(earning => {
    const date = earning.createdAt.toDate();
    const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    const existing = trendMap.get(period) || { amount: 0, count: 0 };
    trendMap.set(period, {
      amount: existing.amount + (earning.netAmount || 0),
      count: existing.count + 1,
    });
  });

  // Convert to array and sort
  const trend: EarningsTrend[] = [];
  trendMap.forEach((value, key) => {
    trend.push({ period: key, ...value });
  });

  return trend.sort((a, b) => a.period.localeCompare(b.period));
};

/**
 * Get case trend for the last N months
 */
export const getCaseTrend = async (
  lawyerId: string,
  months: number = 6
): Promise<CaseTrend[]> => {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const q = query(
    collection(db, COLLECTIONS.CASES),
    where('lawyerId', '==', lawyerId),
    where('createdAt', '>=', Timestamp.fromDate(startDate))
  );

  const querySnapshot = await getDocs(q);
  const cases = querySnapshot.docs.map(doc => doc.data() as Case);

  // Group by month
  const trendMap = new Map<string, { newCases: number; completedCases: number }>();

  cases.forEach(caseData => {
    // Count new cases
    if (caseData.assignedAt) {
      const assignedDate = caseData.assignedAt.toDate();
      const period = `${assignedDate.getFullYear()}-${String(assignedDate.getMonth() + 1).padStart(2, '0')}`;
      const existing = trendMap.get(period) || { newCases: 0, completedCases: 0 };
      trendMap.set(period, {
        ...existing,
        newCases: existing.newCases + 1,
      });
    }

    // Count completed cases
    if (caseData.completedAt) {
      const completedDate = caseData.completedAt.toDate();
      const period = `${completedDate.getFullYear()}-${String(completedDate.getMonth() + 1).padStart(2, '0')}`;
      const existing = trendMap.get(period) || { newCases: 0, completedCases: 0 };
      trendMap.set(period, {
        ...existing,
        completedCases: existing.completedCases + 1,
      });
    }
  });

  // Convert to array and sort
  const trend: CaseTrend[] = [];
  trendMap.forEach((value, key) => {
    trend.push({ period: key, ...value });
  });

  return trend.sort((a, b) => a.period.localeCompare(b.period));
};

/**
 * Get performance metrics
 */
export const getPerformanceMetrics = async (
  lawyerId: string
): Promise<PerformanceMetrics> => {
  // Get all cases
  const casesQuery = query(
    collection(db, COLLECTIONS.CASES),
    where('lawyerId', '==', lawyerId)
  );
  const casesSnapshot = await getDocs(casesQuery);
  const cases = casesSnapshot.docs.map(doc => doc.data() as Case);

  // Get all bids
  const bidsQuery = query(
    collection(db, COLLECTIONS.BIDS),
    where('lawyerId', '==', lawyerId)
  );
  const bidsSnapshot = await getDocs(bidsQuery);
  const bids = bidsSnapshot.docs.map(doc => doc.data() as Bid);

  // Calculate response time (average time from case posting to bid)
  // This would require more data tracking in real implementation
  const responseTime = 2.5; // Placeholder - would need bid timestamps

  // Calculate case completion rate
  const completedCases = cases.filter(c => c.status === 'COMPLETED').length;
  const totalAssignedCases = cases.filter(c =>
    ['ASSIGNED', 'IN_PROGRESS', 'CASE_CLEAR_PENDING', 'COMPLETED', 'DISPUTED'].includes(c.status)
  ).length;
  const caseCompletionRate = totalAssignedCases > 0
    ? Math.round((completedCases / totalAssignedCases) * 100)
    : 0;

  // Calculate dispute rate
  const disputedCases = cases.filter(c => c.status === 'DISPUTED').length;
  const disputeRate = totalAssignedCases > 0
    ? Math.round((disputedCases / totalAssignedCases) * 100)
    : 0;

  // Client retention would need more tracking
  const clientRetentionRate = 0; // Placeholder

  return {
    responseTime,
    caseCompletionRate,
    clientRetentionRate,
    disputeRate,
  };
};

/**
 * Get top performing areas of law
 */
export const getTopAreasOfLaw = async (
  lawyerId: string
): Promise<Array<{ area: string; count: number; earnings: number }>> => {
  const casesQuery = query(
    collection(db, COLLECTIONS.CASES),
    where('lawyerId', '==', lawyerId),
    where('status', '==', 'COMPLETED')
  );

  const casesSnapshot = await getDocs(casesQuery);
  const cases = casesSnapshot.docs.map(doc => doc.data() as Case);

  // Group by area of law
  const areaMap = new Map<string, { count: number; earnings: number }>();

  cases.forEach(caseData => {
    const area = caseData.areaOfLaw;
    const existing = areaMap.get(area) || { count: 0, earnings: 0 };
    areaMap.set(area, {
      count: existing.count + 1,
      earnings: existing.earnings + (caseData.agreedFee || 0),
    });
  });

  // Convert to array and sort by count
  const result: Array<{ area: string; count: number; earnings: number }> = [];
  areaMap.forEach((value, key) => {
    result.push({ area: key, ...value });
  });

  return result.sort((a, b) => b.count - a.count);
};

/**
 * Subscribe to real-time dashboard stats
 */
export const subscribeToDashboardStats = (
  lawyerId: string,
  callback: (stats: Partial<LawyerDashboardStats>) => void
): Unsubscribe => {
  // Subscribe to cases for real-time updates
  const casesQuery = query(
    collection(db, COLLECTIONS.CASES),
    where('lawyerId', '==', lawyerId)
  );

  return onSnapshot(casesQuery, async () => {
    // Fetch fresh stats when cases change
    const stats = await getLawyerDashboardStats(lawyerId);
    callback(stats);
  });
};

/**
 * Get activity feed for lawyer dashboard
 */
export const getActivityFeed = async (
  lawyerId: string,
  limitCount: number = 20
): Promise<Array<{
  type: 'case' | 'bid' | 'payment' | 'review' | 'consultation';
  title: string;
  description: string;
  timestamp: Date;
  data?: any;
}>> => {
  const activities: Array<{
    type: 'case' | 'bid' | 'payment' | 'review' | 'consultation';
    title: string;
    description: string;
    timestamp: Date;
    data?: any;
  }> = [];

  // Get recent cases
  const casesQuery = query(
    collection(db, COLLECTIONS.CASES),
    where('lawyerId', '==', lawyerId),
    orderBy('updatedAt', 'desc'),
    firestoreLimit(10)
  );
  const casesSnapshot = await getDocs(casesQuery);
  casesSnapshot.docs.forEach(doc => {
    const data = doc.data();
    activities.push({
      type: 'case',
      title: `Case ${data.status.toLowerCase().replace('_', ' ')}`,
      description: data.title,
      timestamp: data.updatedAt?.toDate() || new Date(),
      data: { id: doc.id, ...data },
    });
  });

  // Get recent bids
  const bidsQuery = query(
    collection(db, COLLECTIONS.BIDS),
    where('lawyerId', '==', lawyerId),
    orderBy('updatedAt', 'desc'),
    firestoreLimit(10)
  );
  const bidsSnapshot = await getDocs(bidsQuery);
  bidsSnapshot.docs.forEach(doc => {
    const data = doc.data();
    activities.push({
      type: 'bid',
      title: `Bid ${data.status.toLowerCase()}`,
      description: `PKR ${data.proposedFee.toLocaleString()}`,
      timestamp: data.updatedAt?.toDate() || new Date(),
      data: { id: doc.id, ...data },
    });
  });

  // Get recent earnings
  const earningsQuery = query(
    collection(db, 'earnings'),
    where('lawyerId', '==', lawyerId),
    orderBy('createdAt', 'desc'),
    firestoreLimit(10)
  );
  const earningsSnapshot = await getDocs(earningsQuery);
  earningsSnapshot.docs.forEach(doc => {
    const data = doc.data();
    activities.push({
      type: 'payment',
      title: 'Payment received',
      description: `PKR ${data.netAmount?.toLocaleString()}`,
      timestamp: data.createdAt?.toDate() || new Date(),
      data: { id: doc.id, ...data },
    });
  });

  // Sort by timestamp and limit
  return activities
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limitCount);
};
