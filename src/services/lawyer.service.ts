import {
  COLLECTIONS,
  createDocumentWithId,
  getDocument,
  getDocuments,
  updateDocument,
  where,
  orderBy,
  limit,
} from './firestore.service';
import { AreaOfLaw } from './case.service';

// Verification status from PRD
export type VerificationStatus = 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED';
export type AvailabilityStatus = 'AVAILABLE' | 'BUSY' | 'UNAVAILABLE';

export interface LawyerProfile {
  id?: string;
  userId: string;
  fullName: string;
  cnic?: string; // Encrypted
  barId: string;
  licenseNumber: string;
  specializations: AreaOfLaw[];
  experienceYears: number;
  education: {
    degree: string;
    institution: string;
    year: number;
  }[];
  serviceAreas: string[]; // Cities
  bio: string;
  profileImage?: string;
  hourlyRate?: number;
  consultationFee?: number;
  languages: ('EN' | 'UR')[];
  availabilityStatus: AvailabilityStatus;
  verificationStatus: VerificationStatus;
  verifiedAt?: any;
  verifiedBy?: string;
  ratingAverage: number;
  totalReviews: number;
  totalCasesCompleted: number;
  documents: {
    barIdFront?: string;
    barIdBack?: string;
    license?: string;
    cnicFront?: string;
    cnicBack?: string;
    photo?: string;
  };
  createdAt: any;
  updatedAt: any;
}

// Create lawyer profile
export const createLawyerProfile = async (
  userId: string,
  profileData: Omit<LawyerProfile, 'id' | 'userId' | 'verificationStatus' | 'ratingAverage' | 'totalReviews' | 'totalCasesCompleted' | 'createdAt' | 'updatedAt'>
): Promise<void> => {
  const profile: Omit<LawyerProfile, 'id'> = {
    ...profileData,
    userId,
    verificationStatus: 'PENDING',
    ratingAverage: 0,
    totalReviews: 0,
    totalCasesCompleted: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return createDocumentWithId(COLLECTIONS.LAWYER_PROFILES, userId, profile);
};

// Get lawyer profile
export const getLawyerProfile = async (userId: string): Promise<LawyerProfile | null> => {
  return getDocument<LawyerProfile>(COLLECTIONS.LAWYER_PROFILES, userId);
};

// Update lawyer profile
export const updateLawyerProfile = async (
  userId: string,
  data: Partial<LawyerProfile>
): Promise<void> => {
  return updateDocument(COLLECTIONS.LAWYER_PROFILES, userId, data);
};

// Submit documents for verification
export const submitForVerification = async (
  userId: string,
  documents: LawyerProfile['documents']
): Promise<void> => {
  return updateDocument(COLLECTIONS.LAWYER_PROFILES, userId, {
    documents,
    verificationStatus: 'UNDER_REVIEW',
  });
};

// Get all verified lawyers
export const getVerifiedLawyers = async (): Promise<LawyerProfile[]> => {
  return getDocuments<LawyerProfile>(COLLECTIONS.LAWYER_PROFILES, [
    where('verificationStatus', '==', 'VERIFIED'),
    orderBy('ratingAverage', 'desc'),
  ]);
};

// Search lawyers by specialization
export const searchLawyersBySpecialization = async (
  specialization: AreaOfLaw
): Promise<LawyerProfile[]> => {
  return getDocuments<LawyerProfile>(COLLECTIONS.LAWYER_PROFILES, [
    where('verificationStatus', '==', 'VERIFIED'),
    where('specializations', 'array-contains', specialization),
    orderBy('ratingAverage', 'desc'),
  ]);
};

// Search lawyers by city
export const searchLawyersByCity = async (city: string): Promise<LawyerProfile[]> => {
  return getDocuments<LawyerProfile>(COLLECTIONS.LAWYER_PROFILES, [
    where('verificationStatus', '==', 'VERIFIED'),
    where('serviceAreas', 'array-contains', city),
    orderBy('ratingAverage', 'desc'),
  ]);
};

// Get top rated lawyers
export const getTopRatedLawyers = async (count: number = 10): Promise<LawyerProfile[]> => {
  return getDocuments<LawyerProfile>(COLLECTIONS.LAWYER_PROFILES, [
    where('verificationStatus', '==', 'VERIFIED'),
    orderBy('ratingAverage', 'desc'),
    limit(count),
  ]);
};

// Update lawyer availability
export const updateAvailability = async (
  userId: string,
  status: AvailabilityStatus
): Promise<void> => {
  return updateDocument(COLLECTIONS.LAWYER_PROFILES, userId, {
    availabilityStatus: status,
  });
};

// Update lawyer rating (called after review)
export const updateLawyerRating = async (
  userId: string,
  newRating: number,
  currentTotalReviews: number,
  currentAverage: number
): Promise<void> => {
  const newTotalReviews = currentTotalReviews + 1;
  const newAverage = ((currentAverage * currentTotalReviews) + newRating) / newTotalReviews;

  return updateDocument(COLLECTIONS.LAWYER_PROFILES, userId, {
    ratingAverage: Math.round(newAverage * 10) / 10, // Round to 1 decimal
    totalReviews: newTotalReviews,
  });
};

// Increment completed cases count
export const incrementCompletedCases = async (userId: string): Promise<void> => {
  const profile = await getLawyerProfile(userId);
  if (profile) {
    return updateDocument(COLLECTIONS.LAWYER_PROFILES, userId, {
      totalCasesCompleted: profile.totalCasesCompleted + 1,
    });
  }
};

// === ADMIN FUNCTIONS ===

// Get lawyers pending verification
export const getPendingVerifications = async (): Promise<LawyerProfile[]> => {
  return getDocuments<LawyerProfile>(COLLECTIONS.LAWYER_PROFILES, [
    where('verificationStatus', 'in', ['PENDING', 'UNDER_REVIEW']),
    orderBy('createdAt', 'asc'),
  ]);
};

// Approve lawyer verification
export const approveLawyer = async (
  userId: string,
  adminId: string
): Promise<void> => {
  return updateDocument(COLLECTIONS.LAWYER_PROFILES, userId, {
    verificationStatus: 'VERIFIED',
    verifiedAt: new Date(),
    verifiedBy: adminId,
  });
};

// Reject lawyer verification
export const rejectLawyer = async (
  userId: string,
  reason: string
): Promise<void> => {
  return updateDocument(COLLECTIONS.LAWYER_PROFILES, userId, {
    verificationStatus: 'REJECTED',
    rejectionReason: reason,
  });
};
