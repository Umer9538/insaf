import {
  COLLECTIONS,
  createDocument,
  getDocument,
  getDocuments,
  updateDocument,
  subscribeToCollection,
  where,
  orderBy,
} from './firestore.service';
import { serverTimestamp } from 'firebase/firestore';

// Case status flow from PRD
export type CaseStatus =
  | 'DRAFT'
  | 'POSTED'
  | 'MATCHING'
  | 'BIDDING'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'CASE_CLEAR_PENDING'
  | 'COMPLETED'
  | 'DISPUTED'
  | 'CANCELLED';

export type AreaOfLaw =
  | 'FAMILY_LAW'
  | 'CRIMINAL_LAW'
  | 'CIVIL_LAW'
  | 'CORPORATE_LAW'
  | 'PROPERTY_LAW'
  | 'LABOR_LAW'
  | 'TAX_LAW'
  | 'CONSTITUTIONAL_LAW'
  | 'BANKING_LAW'
  | 'CYBER_LAW'
  | 'OTHER';

export type ServiceType =
  | 'LEGAL_CONSULTATION'
  | 'DOCUMENT_DRAFTING'
  | 'COURT_REPRESENTATION'
  | 'LEGAL_OPINION'
  | 'CONTRACT_REVIEW'
  | 'FULL_CASE_HANDLING';

export interface Case {
  id?: string;
  caseNumber: string;
  clientId: string;
  lawyerId?: string;
  title: string;
  description: string;
  areaOfLaw: AreaOfLaw;
  serviceType: ServiceType;
  budgetMin: number;
  budgetMax: number;
  agreedFee?: number;
  urgency: 'NORMAL' | 'URGENT';
  preferredTimeline?: string;
  location: string;
  status: CaseStatus;
  aiSummary?: string;
  keyEntities?: {
    parties: string[];
    dates: string[];
    amounts: string[];
    locations: string[];
  };
  createdAt: any;
  updatedAt: any;
  assignedAt?: any;
  completedAt?: any;
}

// Generate unique case number
const generateCaseNumber = (): string => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `CASE-${year}-${random}`;
};

// Create new case
export const createCase = async (
  clientId: string,
  caseData: Omit<Case, 'id' | 'caseNumber' | 'clientId' | 'status' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  const newCase: Omit<Case, 'id'> = {
    ...caseData,
    caseNumber: generateCaseNumber(),
    clientId,
    status: 'DRAFT',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  return createDocument(COLLECTIONS.CASES, newCase);
};

// Get case by ID
export const getCaseById = async (caseId: string): Promise<Case | null> => {
  return getDocument<Case>(COLLECTIONS.CASES, caseId);
};

// Get cases for client
export const getClientCases = async (clientId: string): Promise<Case[]> => {
  const cases = await getDocuments<Case>(COLLECTIONS.CASES, [
    where('clientId', '==', clientId),
  ]);
  return cases.sort((a, b) => {
    const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
    const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
    return dateB.getTime() - dateA.getTime();
  });
};

// Get cases for lawyer
export const getLawyerCases = async (lawyerId: string): Promise<Case[]> => {
  const cases = await getDocuments<Case>(COLLECTIONS.CASES, [
    where('lawyerId', '==', lawyerId),
  ]);
  return cases.sort((a, b) => {
    const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
    const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
    return dateB.getTime() - dateA.getTime();
  });
};

// Get available cases for bidding
export const getAvailableCases = async (
  areaOfLaw?: AreaOfLaw
): Promise<Case[]> => {
  const constraints = [
    where('status', 'in', ['POSTED', 'BIDDING']),
  ];

  if (areaOfLaw) {
    constraints.unshift(where('areaOfLaw', '==', areaOfLaw));
  }

  const cases = await getDocuments<Case>(COLLECTIONS.CASES, constraints);
  return cases.sort((a, b) => {
    const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
    const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
    return dateB.getTime() - dateA.getTime();
  });
};

// Update case status
export const updateCaseStatus = async (
  caseId: string,
  status: CaseStatus,
  additionalData?: Partial<Case>
): Promise<void> => {
  const updateData: Partial<Case> = {
    status,
    ...additionalData,
  };

  if (status === 'ASSIGNED') {
    updateData.assignedAt = serverTimestamp();
  }

  if (status === 'COMPLETED') {
    updateData.completedAt = serverTimestamp();
  }

  return updateDocument(COLLECTIONS.CASES, caseId, updateData);
};

// Post case (change from DRAFT to POSTED)
export const postCase = async (caseId: string): Promise<void> => {
  return updateCaseStatus(caseId, 'POSTED');
};

// Assign lawyer to case
export const assignLawyerToCase = async (
  caseId: string,
  lawyerId: string,
  agreedFee: number
): Promise<void> => {
  return updateCaseStatus(caseId, 'ASSIGNED', {
    lawyerId,
    agreedFee,
  });
};

// Request case clear (by lawyer)
export const requestCaseClear = async (caseId: string): Promise<void> => {
  return updateCaseStatus(caseId, 'CASE_CLEAR_PENDING');
};

// Subscribe to case updates (real-time)
export const subscribeToCaseUpdates = (
  caseId: string,
  callback: (cases: Case[]) => void
) => {
  return subscribeToCollection<Case>(
    COLLECTIONS.CASES,
    [where('__name__', '==', caseId)],
    callback
  );
};
