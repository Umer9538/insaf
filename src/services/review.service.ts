/**
 * INSAF - Review Service
 *
 * Handles client reviews and ratings for lawyers
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
  runTransaction,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { COLLECTIONS } from './firestore.service';
import { updateLawyerRating, getLawyerProfile } from './lawyer.service';

// Types
export interface Review {
  id?: string;
  lawyerId: string;
  clientId: string;
  clientName: string;
  clientAvatar?: string;
  caseId: string;
  caseTitle?: string;
  rating: number; // 1-5
  title?: string;
  content: string;
  aspects?: {
    communication: number;
    professionalism: number;
    expertise: number;
    valueForMoney: number;
    timeliness: number;
  };
  helpful: number; // Count of users who found this helpful
  reported: boolean;
  lawyerResponse?: {
    content: string;
    createdAt: Timestamp;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  aspectAverages?: {
    communication: number;
    professionalism: number;
    expertise: number;
    valueForMoney: number;
    timeliness: number;
  };
}

// Functions

/**
 * Create a new review
 */
export const createReview = async (
  lawyerId: string,
  clientId: string,
  clientName: string,
  caseId: string,
  rating: number,
  content: string,
  title?: string,
  clientAvatar?: string,
  caseTitle?: string,
  aspects?: Review['aspects']
): Promise<string> => {
  // Validate rating
  if (rating < 1 || rating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }

  // Check if review already exists for this case
  const existingReview = await getReviewByCase(caseId);
  if (existingReview) {
    throw new Error('A review already exists for this case');
  }

  // Get current lawyer rating stats
  const lawyerProfile = await getLawyerProfile(lawyerId);
  if (!lawyerProfile) {
    throw new Error('Lawyer not found');
  }

  // Create review
  const reviewData: Omit<Review, 'id'> = {
    lawyerId,
    clientId,
    clientName,
    clientAvatar,
    caseId,
    caseTitle,
    rating,
    title,
    content,
    aspects,
    helpful: 0,
    reported: false,
    createdAt: serverTimestamp() as Timestamp,
    updatedAt: serverTimestamp() as Timestamp,
  };

  const docRef = await addDoc(collection(db, COLLECTIONS.REVIEWS), reviewData);

  // Update lawyer's rating
  await updateLawyerRating(
    lawyerId,
    rating,
    lawyerProfile.totalReviews,
    lawyerProfile.ratingAverage
  );

  return docRef.id;
};

/**
 * Get review by ID
 */
export const getReviewById = async (reviewId: string): Promise<Review | null> => {
  const reviewRef = doc(db, COLLECTIONS.REVIEWS, reviewId);
  const reviewSnap = await getDoc(reviewRef);

  if (reviewSnap.exists()) {
    return { id: reviewSnap.id, ...reviewSnap.data() } as Review;
  }

  return null;
};

/**
 * Get review by case ID
 */
export const getReviewByCase = async (caseId: string): Promise<Review | null> => {
  const q = query(
    collection(db, COLLECTIONS.REVIEWS),
    where('caseId', '==', caseId)
  );

  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Review;
  }

  return null;
};

/**
 * Get all reviews for a lawyer
 */
export const getLawyerReviews = async (
  lawyerId: string,
  limitCount: number = 20
): Promise<Review[]> => {
  const q = query(
    collection(db, COLLECTIONS.REVIEWS),
    where('lawyerId', '==', lawyerId),
    where('reported', '==', false),
    orderBy('createdAt', 'desc'),
    firestoreLimit(limitCount)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Review[];
};

/**
 * Subscribe to lawyer reviews
 */
export const subscribeToLawyerReviews = (
  lawyerId: string,
  callback: (reviews: Review[]) => void
): Unsubscribe => {
  const q = query(
    collection(db, COLLECTIONS.REVIEWS),
    where('lawyerId', '==', lawyerId),
    where('reported', '==', false),
    orderBy('createdAt', 'desc'),
    firestoreLimit(20)
  );

  return onSnapshot(q, (querySnapshot) => {
    const reviews = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Review[];
    callback(reviews);
  });
};

/**
 * Get reviews by client
 */
export const getClientReviews = async (clientId: string): Promise<Review[]> => {
  const q = query(
    collection(db, COLLECTIONS.REVIEWS),
    where('clientId', '==', clientId),
    orderBy('createdAt', 'desc')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Review[];
};

/**
 * Get review statistics for a lawyer
 */
export const getReviewStats = async (lawyerId: string): Promise<ReviewStats> => {
  const q = query(
    collection(db, COLLECTIONS.REVIEWS),
    where('lawyerId', '==', lawyerId),
    where('reported', '==', false)
  );

  const querySnapshot = await getDocs(q);
  const reviews = querySnapshot.docs.map(doc => doc.data() as Review);

  if (reviews.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }

  // Calculate statistics
  const ratingDistribution: ReviewStats['ratingDistribution'] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let totalRating = 0;
  let aspectTotals = {
    communication: 0,
    professionalism: 0,
    expertise: 0,
    valueForMoney: 0,
    timeliness: 0,
  };
  let aspectCount = 0;

  reviews.forEach(review => {
    totalRating += review.rating;
    ratingDistribution[review.rating as 1 | 2 | 3 | 4 | 5]++;

    if (review.aspects) {
      aspectTotals.communication += review.aspects.communication;
      aspectTotals.professionalism += review.aspects.professionalism;
      aspectTotals.expertise += review.aspects.expertise;
      aspectTotals.valueForMoney += review.aspects.valueForMoney;
      aspectTotals.timeliness += review.aspects.timeliness;
      aspectCount++;
    }
  });

  const averageRating = Math.round((totalRating / reviews.length) * 10) / 10;

  const stats: ReviewStats = {
    averageRating,
    totalReviews: reviews.length,
    ratingDistribution,
  };

  if (aspectCount > 0) {
    stats.aspectAverages = {
      communication: Math.round((aspectTotals.communication / aspectCount) * 10) / 10,
      professionalism: Math.round((aspectTotals.professionalism / aspectCount) * 10) / 10,
      expertise: Math.round((aspectTotals.expertise / aspectCount) * 10) / 10,
      valueForMoney: Math.round((aspectTotals.valueForMoney / aspectCount) * 10) / 10,
      timeliness: Math.round((aspectTotals.timeliness / aspectCount) * 10) / 10,
    };
  }

  return stats;
};

/**
 * Update a review
 */
export const updateReview = async (
  reviewId: string,
  clientId: string,
  updates: Partial<Pick<Review, 'rating' | 'title' | 'content' | 'aspects'>>
): Promise<void> => {
  const reviewRef = doc(db, COLLECTIONS.REVIEWS, reviewId);
  const reviewSnap = await getDoc(reviewRef);

  if (!reviewSnap.exists()) {
    throw new Error('Review not found');
  }

  const review = reviewSnap.data() as Review;

  if (review.clientId !== clientId) {
    throw new Error('Unauthorized');
  }

  // If rating changed, update lawyer's average rating
  if (updates.rating && updates.rating !== review.rating) {
    const lawyerProfile = await getLawyerProfile(review.lawyerId);
    if (lawyerProfile) {
      // Recalculate average excluding old rating and including new
      const totalRating = lawyerProfile.ratingAverage * lawyerProfile.totalReviews;
      const newTotalRating = totalRating - review.rating + updates.rating;
      const newAverage = newTotalRating / lawyerProfile.totalReviews;

      const lawyerRef = doc(db, 'lawyerProfiles', review.lawyerId);
      await updateDoc(lawyerRef, {
        ratingAverage: Math.round(newAverage * 10) / 10,
      });
    }
  }

  await updateDoc(reviewRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Add lawyer response to a review
 */
export const addLawyerResponse = async (
  reviewId: string,
  lawyerId: string,
  responseContent: string
): Promise<void> => {
  const reviewRef = doc(db, COLLECTIONS.REVIEWS, reviewId);
  const reviewSnap = await getDoc(reviewRef);

  if (!reviewSnap.exists()) {
    throw new Error('Review not found');
  }

  const review = reviewSnap.data() as Review;

  if (review.lawyerId !== lawyerId) {
    throw new Error('Unauthorized');
  }

  if (review.lawyerResponse) {
    throw new Error('Response already exists');
  }

  await updateDoc(reviewRef, {
    lawyerResponse: {
      content: responseContent,
      createdAt: serverTimestamp(),
    },
    updatedAt: serverTimestamp(),
  });
};

/**
 * Mark review as helpful
 */
export const markReviewHelpful = async (reviewId: string): Promise<void> => {
  const reviewRef = doc(db, COLLECTIONS.REVIEWS, reviewId);

  await runTransaction(db, async (transaction) => {
    const reviewSnap = await transaction.get(reviewRef);
    if (!reviewSnap.exists()) {
      throw new Error('Review not found');
    }

    const currentHelpful = reviewSnap.data().helpful || 0;
    transaction.update(reviewRef, {
      helpful: currentHelpful + 1,
      updatedAt: serverTimestamp(),
    });
  });
};

/**
 * Report a review
 */
export const reportReview = async (
  reviewId: string,
  reporterId: string,
  reason: string
): Promise<void> => {
  const reviewRef = doc(db, COLLECTIONS.REVIEWS, reviewId);

  await updateDoc(reviewRef, {
    reported: true,
    reportInfo: {
      reporterId,
      reason,
      reportedAt: serverTimestamp(),
    },
    updatedAt: serverTimestamp(),
  });
};

/**
 * Get top reviews for a lawyer
 */
export const getTopReviews = async (
  lawyerId: string,
  count: number = 5
): Promise<Review[]> => {
  const q = query(
    collection(db, COLLECTIONS.REVIEWS),
    where('lawyerId', '==', lawyerId),
    where('reported', '==', false),
    where('rating', '>=', 4),
    orderBy('rating', 'desc'),
    orderBy('helpful', 'desc'),
    firestoreLimit(count)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Review[];
};

/**
 * Check if client can review a case
 */
export const canReviewCase = async (
  clientId: string,
  caseId: string
): Promise<boolean> => {
  // Check if case exists and is completed
  const caseRef = doc(db, COLLECTIONS.CASES, caseId);
  const caseSnap = await getDoc(caseRef);

  if (!caseSnap.exists()) {
    return false;
  }

  const caseData = caseSnap.data();

  // Check if client owns this case
  if (caseData.clientId !== clientId) {
    return false;
  }

  // Check if case is completed
  if (caseData.status !== 'COMPLETED') {
    return false;
  }

  // Check if review already exists
  const existingReview = await getReviewByCase(caseId);
  return !existingReview;
};
