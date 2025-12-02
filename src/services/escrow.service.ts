import {
  COLLECTIONS,
  createDocumentWithId,
  getDocument,
  getDocuments,
  updateDocument,
  where,
} from './firestore.service';
import { updateCaseStatus, getCaseById } from './case.service';
import { incrementCompletedCases } from './lawyer.service';

// Escrow status from PRD
export type EscrowStatus =
  | 'PENDING_PAYMENT'
  | 'FUNDED'
  | 'RELEASED'
  | 'REFUNDED'
  | 'DISPUTED';

export interface Escrow {
  id?: string;
  caseId: string;
  clientId: string;
  lawyerId: string;
  totalAmount: number;
  escrowAmount: number; // 50% of total
  status: EscrowStatus;
  fundedAt?: any;
  clientConfirmed: boolean;
  clientConfirmedAt?: any;
  lawyerConfirmed: boolean;
  lawyerConfirmedAt?: any;
  releasedAt?: any;
  releaseAmount?: number;
  transactionId?: string;
  createdAt: any;
  updatedAt: any;
}

// Create escrow after bid acceptance
export const createEscrow = async (
  caseId: string,
  clientId: string,
  lawyerId: string,
  totalAmount: number
): Promise<string> => {
  const escrowAmount = totalAmount * 0.5; // 50% as per PRD

  const escrow: Omit<Escrow, 'id'> = {
    caseId,
    clientId,
    lawyerId,
    totalAmount,
    escrowAmount,
    status: 'PENDING_PAYMENT',
    clientConfirmed: false,
    lawyerConfirmed: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Use caseId as escrow ID for easy lookup
  await createDocumentWithId(COLLECTIONS.ESCROWS, caseId, escrow);
  return caseId;
};

// Get escrow by case ID
export const getEscrowByCaseId = async (caseId: string): Promise<Escrow | null> => {
  return getDocument<Escrow>(COLLECTIONS.ESCROWS, caseId);
};

// Get escrows for client
export const getClientEscrows = async (clientId: string): Promise<Escrow[]> => {
  return getDocuments<Escrow>(COLLECTIONS.ESCROWS, [
    where('clientId', '==', clientId),
  ]);
};

// Get escrows for lawyer
export const getLawyerEscrows = async (lawyerId: string): Promise<Escrow[]> => {
  return getDocuments<Escrow>(COLLECTIONS.ESCROWS, [
    where('lawyerId', '==', lawyerId),
  ]);
};

// Fund escrow (after successful payment)
export const fundEscrow = async (
  caseId: string,
  transactionId: string
): Promise<void> => {
  await updateDocument(COLLECTIONS.ESCROWS, caseId, {
    status: 'FUNDED',
    fundedAt: new Date(),
    transactionId,
  });

  // Update case status to IN_PROGRESS
  await updateCaseStatus(caseId, 'IN_PROGRESS');
};

// Lawyer confirms case clear
export const lawyerConfirmCaseClear = async (caseId: string): Promise<void> => {
  const escrow = await getEscrowByCaseId(caseId);

  if (!escrow || escrow.status !== 'FUNDED') {
    throw new Error('Invalid escrow status');
  }

  await updateDocument(COLLECTIONS.ESCROWS, caseId, {
    lawyerConfirmed: true,
    lawyerConfirmedAt: new Date(),
  });

  // Update case status
  await updateCaseStatus(caseId, 'CASE_CLEAR_PENDING');

  // Check if both confirmed
  if (escrow.clientConfirmed) {
    await releaseEscrow(caseId);
  }
};

// Client confirms case clear
export const clientConfirmCaseClear = async (caseId: string): Promise<void> => {
  const escrow = await getEscrowByCaseId(caseId);

  if (!escrow) {
    throw new Error('Escrow not found');
  }

  if (escrow.status !== 'FUNDED') {
    throw new Error('Invalid escrow status');
  }

  await updateDocument(COLLECTIONS.ESCROWS, caseId, {
    clientConfirmed: true,
    clientConfirmedAt: new Date(),
  });

  // Check if both confirmed - release escrow
  if (escrow.lawyerConfirmed) {
    await releaseEscrow(caseId);
  }
};

// Release escrow (internal - called when both confirm)
const releaseEscrow = async (caseId: string): Promise<void> => {
  const escrow = await getEscrowByCaseId(caseId);

  if (!escrow) {
    throw new Error('Escrow not found');
  }

  await updateDocument(COLLECTIONS.ESCROWS, caseId, {
    status: 'RELEASED',
    releasedAt: new Date(),
    releaseAmount: escrow.escrowAmount,
  });

  // Update case status to COMPLETED
  await updateCaseStatus(caseId, 'COMPLETED');

  // Increment lawyer's completed cases count
  await incrementCompletedCases(escrow.lawyerId);
};

// Raise dispute
export const raiseDispute = async (caseId: string): Promise<void> => {
  await updateDocument(COLLECTIONS.ESCROWS, caseId, {
    status: 'DISPUTED',
  });

  await updateCaseStatus(caseId, 'DISPUTED');
};

// Admin: Resolve dispute with fund split
export const resolveDispute = async (
  caseId: string,
  clientPercent: number,
  lawyerPercent: number
): Promise<void> => {
  if (clientPercent + lawyerPercent !== 100) {
    throw new Error('Percentages must sum to 100');
  }

  const escrow = await getEscrowByCaseId(caseId);
  if (!escrow) {
    throw new Error('Escrow not found');
  }

  const clientRefund = (escrow.escrowAmount * clientPercent) / 100;
  const lawyerPayment = (escrow.escrowAmount * lawyerPercent) / 100;

  await updateDocument(COLLECTIONS.ESCROWS, caseId, {
    status: 'RELEASED',
    releasedAt: new Date(),
    releaseAmount: lawyerPayment,
    refundAmount: clientRefund,
    disputeResolution: {
      clientPercent,
      lawyerPercent,
      resolvedAt: new Date(),
    },
  });

  // Mark case as completed (dispute resolved)
  await updateCaseStatus(caseId, 'COMPLETED');
};

// Admin: Full refund to client
export const refundEscrow = async (caseId: string): Promise<void> => {
  const escrow = await getEscrowByCaseId(caseId);
  if (!escrow) {
    throw new Error('Escrow not found');
  }

  await updateDocument(COLLECTIONS.ESCROWS, caseId, {
    status: 'REFUNDED',
    releasedAt: new Date(),
    refundAmount: escrow.escrowAmount,
    releaseAmount: 0,
  });

  await updateCaseStatus(caseId, 'CANCELLED');
};
