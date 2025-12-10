/**
 * INSAF - Case Thread Service
 *
 * Manages structured case timelines (separate from chat)
 * Case Thread is a project management dashboard for tracking:
 * - Milestones (case start, hearings, judgments)
 * - Deadlines (document submissions, filings)
 * - Key Decisions (approvals, submissions)
 * - Meeting Summaries
 * - Important Documents
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Collection names
const COLLECTIONS = {
  CASE_THREADS: 'caseThreads',
  THREAD_ENTRIES: 'threadEntries',
};

// Entry types for the case thread
export type ThreadEntryType =
  | 'MILESTONE'      // Case Start, Court Hearing, Judgment
  | 'DEADLINE'       // Document submission, Filing deadlines
  | 'DECISION'       // Client approved, Lawyer submitted
  | 'MEETING'        // Meeting summaries
  | 'DOCUMENT'       // Important documents uploaded
  | 'STATUS_CHANGE'  // Case status changes
  | 'PAYMENT'        // Payment milestones
  | 'NOTE';          // General notes

// Priority levels
export type EntryPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

// Thread entry interface
export interface ThreadEntry {
  id: string;
  threadId: string;
  caseId: string;
  type: ThreadEntryType;
  title: string;
  description?: string;
  createdBy: string;
  createdByName: string;
  createdByRole: 'client' | 'lawyer' | 'system';
  createdAt: Timestamp;
  updatedAt: Timestamp;

  // Optional fields based on type
  dueDate?: Timestamp;          // For deadlines
  completedAt?: Timestamp;      // For milestones/deadlines
  isCompleted?: boolean;
  priority?: EntryPriority;

  // For documents
  attachments?: {
    name: string;
    url: string;
    type: string;
    size: number;
  }[];

  // For meetings
  meetingDate?: Timestamp;
  attendees?: string[];

  // Metadata
  metadata?: Record<string, any>;
}

// Case Thread interface
export interface CaseThread {
  id: string;
  caseId: string;
  caseTitle: string;
  caseNumber: string;
  clientId: string;
  clientName: string;
  lawyerId: string;
  lawyerName: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  entryCount: number;
  lastEntryAt?: Timestamp;
  status: 'ACTIVE' | 'ARCHIVED' | 'CLOSED';
}

/**
 * Create a new case thread (called when case moves to IN_PROGRESS)
 */
export const createCaseThread = async (
  caseId: string,
  caseTitle: string,
  caseNumber: string,
  clientId: string,
  clientName: string,
  lawyerId: string,
  lawyerName: string
): Promise<string> => {
  try {
    // Check if thread already exists for this case
    const existingThread = await getCaseThreadByCaseId(caseId);
    if (existingThread) {
      console.log('Thread already exists for case:', caseId);
      return existingThread.id;
    }

    const threadRef = doc(collection(db, COLLECTIONS.CASE_THREADS));
    const thread: Omit<CaseThread, 'id'> = {
      caseId,
      caseTitle,
      caseNumber,
      clientId,
      clientName,
      lawyerId,
      lawyerName,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
      entryCount: 0,
      status: 'ACTIVE',
    };

    await setDoc(threadRef, thread);

    // Add initial "Case Started" entry
    await addThreadEntry(threadRef.id, caseId, {
      type: 'MILESTONE',
      title: 'Case Started',
      description: `Case "${caseTitle}" is now in progress. Lawyer ${lawyerName} has been assigned.`,
      createdBy: 'system',
      createdByName: 'INSAF System',
      createdByRole: 'system',
      isCompleted: true,
      completedAt: serverTimestamp() as Timestamp,
    });

    return threadRef.id;
  } catch (error) {
    console.error('Error creating case thread:', error);
    throw error;
  }
};

/**
 * Get case thread by case ID
 */
export const getCaseThreadByCaseId = async (caseId: string): Promise<CaseThread | null> => {
  try {
    const q = query(
      collection(db, COLLECTIONS.CASE_THREADS),
      where('caseId', '==', caseId)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as CaseThread;
  } catch (error) {
    console.error('Error getting case thread:', error);
    throw error;
  }
};

/**
 * Get case thread by ID
 */
export const getCaseThread = async (threadId: string): Promise<CaseThread | null> => {
  try {
    const docRef = doc(db, COLLECTIONS.CASE_THREADS, threadId);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      return null;
    }

    return { id: snapshot.id, ...snapshot.data() } as CaseThread;
  } catch (error) {
    console.error('Error getting case thread:', error);
    throw error;
  }
};

/**
 * Add an entry to the case thread
 */
export const addThreadEntry = async (
  threadId: string,
  caseId: string,
  entry: Omit<ThreadEntry, 'id' | 'threadId' | 'caseId' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    const entryRef = doc(collection(db, COLLECTIONS.THREAD_ENTRIES));
    const newEntry: Omit<ThreadEntry, 'id'> = {
      ...entry,
      threadId,
      caseId,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    };

    await setDoc(entryRef, newEntry);

    // Update thread entry count and last entry time
    const threadRef = doc(db, COLLECTIONS.CASE_THREADS, threadId);
    await updateDoc(threadRef, {
      entryCount: (await getDoc(threadRef)).data()?.entryCount + 1 || 1,
      lastEntryAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return entryRef.id;
  } catch (error) {
    console.error('Error adding thread entry:', error);
    throw error;
  }
};

/**
 * Get all entries for a thread
 */
export const getThreadEntries = async (threadId: string): Promise<ThreadEntry[]> => {
  try {
    const q = query(
      collection(db, COLLECTIONS.THREAD_ENTRIES),
      where('threadId', '==', threadId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as ThreadEntry[];
  } catch (error) {
    console.error('Error getting thread entries:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time thread entries updates
 */
export const subscribeToThreadEntries = (
  threadId: string,
  callback: (entries: ThreadEntry[]) => void
): Unsubscribe => {
  const q = query(
    collection(db, COLLECTIONS.THREAD_ENTRIES),
    where('threadId', '==', threadId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const entries = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as ThreadEntry[];
    callback(entries);
  });
};

/**
 * Update a thread entry
 */
export const updateThreadEntry = async (
  entryId: string,
  updates: Partial<ThreadEntry>
): Promise<void> => {
  try {
    const entryRef = doc(db, COLLECTIONS.THREAD_ENTRIES, entryId);
    await updateDoc(entryRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating thread entry:', error);
    throw error;
  }
};

/**
 * Mark entry as completed (for deadlines/milestones)
 */
export const markEntryCompleted = async (entryId: string): Promise<void> => {
  try {
    await updateThreadEntry(entryId, {
      isCompleted: true,
      completedAt: serverTimestamp() as Timestamp,
    });
  } catch (error) {
    console.error('Error marking entry completed:', error);
    throw error;
  }
};

/**
 * Delete a thread entry
 */
export const deleteThreadEntry = async (entryId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, COLLECTIONS.THREAD_ENTRIES, entryId));
  } catch (error) {
    console.error('Error deleting thread entry:', error);
    throw error;
  }
};

/**
 * Get threads for a user (as client or lawyer)
 */
export const getUserThreads = async (userId: string): Promise<CaseThread[]> => {
  try {
    // Get threads where user is client
    const clientQuery = query(
      collection(db, COLLECTIONS.CASE_THREADS),
      where('clientId', '==', userId),
      where('status', '==', 'ACTIVE')
    );

    // Get threads where user is lawyer
    const lawyerQuery = query(
      collection(db, COLLECTIONS.CASE_THREADS),
      where('lawyerId', '==', userId),
      where('status', '==', 'ACTIVE')
    );

    const [clientSnapshot, lawyerSnapshot] = await Promise.all([
      getDocs(clientQuery),
      getDocs(lawyerQuery),
    ]);

    const threads: CaseThread[] = [];
    const seenIds = new Set<string>();

    clientSnapshot.docs.forEach(doc => {
      if (!seenIds.has(doc.id)) {
        threads.push({ id: doc.id, ...doc.data() } as CaseThread);
        seenIds.add(doc.id);
      }
    });

    lawyerSnapshot.docs.forEach(doc => {
      if (!seenIds.has(doc.id)) {
        threads.push({ id: doc.id, ...doc.data() } as CaseThread);
        seenIds.add(doc.id);
      }
    });

    // Sort by last entry time
    return threads.sort((a, b) => {
      const aTime = a.lastEntryAt?.toMillis?.() || a.updatedAt?.toMillis?.() || 0;
      const bTime = b.lastEntryAt?.toMillis?.() || b.updatedAt?.toMillis?.() || 0;
      return bTime - aTime;
    });
  } catch (error) {
    console.error('Error getting user threads:', error);
    throw error;
  }
};

/**
 * Get upcoming deadlines for a user
 */
export const getUpcomingDeadlines = async (
  userId: string,
  daysAhead: number = 7
): Promise<ThreadEntry[]> => {
  try {
    const threads = await getUserThreads(userId);
    const threadIds = threads.map(t => t.id);

    if (threadIds.length === 0) return [];

    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const allDeadlines: ThreadEntry[] = [];

    // Get deadlines from each thread
    for (const threadId of threadIds) {
      const entries = await getThreadEntries(threadId);
      const deadlines = entries.filter(
        e => e.type === 'DEADLINE' && !e.isCompleted && e.dueDate
      );
      allDeadlines.push(...deadlines);
    }

    // Sort by due date
    return allDeadlines.sort((a, b) => {
      const aTime = a.dueDate?.toMillis?.() || 0;
      const bTime = b.dueDate?.toMillis?.() || 0;
      return aTime - bTime;
    });
  } catch (error) {
    console.error('Error getting upcoming deadlines:', error);
    throw error;
  }
};

/**
 * Archive a case thread (when case is completed)
 */
export const archiveCaseThread = async (threadId: string): Promise<void> => {
  try {
    const threadRef = doc(db, COLLECTIONS.CASE_THREADS, threadId);
    await updateDoc(threadRef, {
      status: 'ARCHIVED',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error archiving case thread:', error);
    throw error;
  }
};

/**
 * Close a case thread (when case is closed)
 */
export const closeCaseThread = async (threadId: string): Promise<void> => {
  try {
    const threadRef = doc(db, COLLECTIONS.CASE_THREADS, threadId);
    await updateDoc(threadRef, {
      status: 'CLOSED',
      updatedAt: serverTimestamp(),
    });

    // Add closing entry
    const thread = await getCaseThread(threadId);
    if (thread) {
      await addThreadEntry(threadId, thread.caseId, {
        type: 'MILESTONE',
        title: 'Case Closed',
        description: 'This case has been officially closed.',
        createdBy: 'system',
        createdByName: 'INSAF System',
        createdByRole: 'system',
        isCompleted: true,
        completedAt: serverTimestamp() as Timestamp,
      });
    }
  } catch (error) {
    console.error('Error closing case thread:', error);
    throw error;
  }
};

// Helper function to get entry type icon
export const getEntryTypeIcon = (type: ThreadEntryType): string => {
  switch (type) {
    case 'MILESTONE':
      return 'flag';
    case 'DEADLINE':
      return 'time';
    case 'DECISION':
      return 'checkmark-circle';
    case 'MEETING':
      return 'people';
    case 'DOCUMENT':
      return 'document-text';
    case 'STATUS_CHANGE':
      return 'swap-horizontal';
    case 'PAYMENT':
      return 'card';
    case 'NOTE':
      return 'create';
    default:
      return 'ellipse';
  }
};

// Helper function to get entry type color
export const getEntryTypeColor = (type: ThreadEntryType): string => {
  switch (type) {
    case 'MILESTONE':
      return '#4CAF50'; // Green
    case 'DEADLINE':
      return '#FF9800'; // Orange
    case 'DECISION':
      return '#2196F3'; // Blue
    case 'MEETING':
      return '#9C27B0'; // Purple
    case 'DOCUMENT':
      return '#00BCD4'; // Cyan
    case 'STATUS_CHANGE':
      return '#607D8B'; // Blue Grey
    case 'PAYMENT':
      return '#d4af37'; // Gold
    case 'NOTE':
      return '#795548'; // Brown
    default:
      return '#757575'; // Grey
  }
};
