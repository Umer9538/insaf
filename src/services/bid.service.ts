import {
  COLLECTIONS,
  createDocument,
  getDocument,
  getDocuments,
  updateDocument,
  deleteDocument,
  where,
  orderBy,
} from './firestore.service';
import { updateCaseStatus, assignLawyerToCase } from './case.service';

// Bid status from PRD
export type BidStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
export type FeeType = 'FIXED' | 'HOURLY';

export interface Bid {
  id?: string;
  caseId: string;
  lawyerId: string;
  proposedFee: number;
  feeType: FeeType;
  estimatedTimeline: string;
  proposalText: string;
  status: BidStatus;
  createdAt: any;
  updatedAt: any;
}

// Create new bid
export const createBid = async (
  lawyerId: string,
  bidData: Omit<Bid, 'id' | 'lawyerId' | 'status' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  // Check if lawyer already bid on this case
  const existingBids = await getDocuments<Bid>(COLLECTIONS.BIDS, [
    where('caseId', '==', bidData.caseId),
    where('lawyerId', '==', lawyerId),
    where('status', '==', 'PENDING'),
  ]);

  if (existingBids.length > 0) {
    throw new Error('You have already submitted a bid for this case');
  }

  const newBid: Omit<Bid, 'id'> = {
    ...bidData,
    lawyerId,
    status: 'PENDING',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const bidId = await createDocument(COLLECTIONS.BIDS, newBid);

  // Update case status to BIDDING if it was POSTED
  await updateCaseStatus(bidData.caseId, 'BIDDING');

  return bidId;
};

// Get bid by ID
export const getBidById = async (bidId: string): Promise<Bid | null> => {
  return getDocument<Bid>(COLLECTIONS.BIDS, bidId);
};

// Get all bids for a case
export const getBidsForCase = async (caseId: string): Promise<Bid[]> => {
  const bids = await getDocuments<Bid>(COLLECTIONS.BIDS, [
    where('caseId', '==', caseId),
    where('status', '==', 'PENDING'),
  ]);
  return bids.sort((a, b) => {
    const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
    const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
    return dateB.getTime() - dateA.getTime();
  });
};

// Get all bids by a lawyer
export const getBidsByLawyer = async (lawyerId: string): Promise<Bid[]> => {
  const bids = await getDocuments<Bid>(COLLECTIONS.BIDS, [
    where('lawyerId', '==', lawyerId),
  ]);
  return bids.sort((a, b) => {
    const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
    const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
    return dateB.getTime() - dateA.getTime();
  });
};

// Update bid
export const updateBid = async (
  bidId: string,
  data: Partial<Omit<Bid, 'id' | 'caseId' | 'lawyerId' | 'createdAt'>>
): Promise<void> => {
  const bid = await getBidById(bidId);
  if (!bid || bid.status !== 'PENDING') {
    throw new Error('Cannot update this bid');
  }
  return updateDocument(COLLECTIONS.BIDS, bidId, data);
};

// Withdraw bid (by lawyer)
export const withdrawBid = async (bidId: string, lawyerId: string): Promise<void> => {
  const bid = await getBidById(bidId);

  if (!bid) {
    throw new Error('Bid not found');
  }

  if (bid.lawyerId !== lawyerId) {
    throw new Error('You can only withdraw your own bids');
  }

  if (bid.status !== 'PENDING') {
    throw new Error('Cannot withdraw this bid');
  }

  return updateDocument(COLLECTIONS.BIDS, bidId, { status: 'WITHDRAWN' });
};

// Accept bid (by client) - triggers escrow creation
export const acceptBid = async (bidId: string, clientId: string): Promise<void> => {
  const bid = await getBidById(bidId);

  if (!bid || bid.status !== 'PENDING') {
    throw new Error('Cannot accept this bid');
  }

  // Update bid status
  await updateDocument(COLLECTIONS.BIDS, bidId, { status: 'ACCEPTED' });

  // Reject all other pending bids for this case
  const otherBids = await getBidsForCase(bid.caseId);
  for (const otherBid of otherBids) {
    if (otherBid.id !== bidId) {
      await updateDocument(COLLECTIONS.BIDS, otherBid.id!, { status: 'REJECTED' });
    }
  }

  // Assign lawyer to case
  await assignLawyerToCase(bid.caseId, bid.lawyerId, bid.proposedFee);

  // Note: Escrow creation should be triggered separately after payment
};

// Reject bid (by client)
export const rejectBid = async (
  bidId: string,
  feedback?: string
): Promise<void> => {
  const bid = await getBidById(bidId);

  if (!bid || bid.status !== 'PENDING') {
    throw new Error('Cannot reject this bid');
  }

  return updateDocument(COLLECTIONS.BIDS, bidId, {
    status: 'REJECTED',
    rejectionFeedback: feedback,
  });
};

// Get bid count for a case
export const getBidCountForCase = async (caseId: string): Promise<number> => {
  const bids = await getBidsForCase(caseId);
  return bids.length;
};
