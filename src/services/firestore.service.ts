import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  DocumentData,
  QueryConstraint,
  onSnapshot,
  Unsubscribe,
  addDoc,
  getCountFromServer as getCountFromFirestore,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Collection names based on PRD data models
export const COLLECTIONS = {
  USERS: 'users',
  CLIENT_PROFILES: 'clientProfiles',
  LAWYER_PROFILES: 'lawyerProfiles',
  CORPORATE_PROFILES: 'corporateProfiles',
  CASES: 'cases',
  CASE_DOCUMENTS: 'caseDocuments',
  BIDS: 'bids',
  ESCROWS: 'escrows',
  PAYMENTS: 'payments',
  MESSAGES: 'messages',
  FOLLOWS: 'follows',
  CONSULTATIONS: 'consultations',
  REVIEWS: 'reviews',
  NOTIFICATIONS: 'notifications',
  DISPUTES: 'disputes',
  AI_MESSAGES: 'aiMessages', // AI chatbot messages
  AI_SESSIONS: 'aiSessions', // AI chat sessions
} as const;

// Generic CRUD operations

// Create document with auto ID
export const createDocument = async <T extends DocumentData>(
  collectionName: string,
  data: T
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    throw error;
  }
};

// Create document with custom ID
export const createDocumentWithId = async <T extends DocumentData>(
  collectionName: string,
  docId: string,
  data: T
): Promise<void> => {
  try {
    await setDoc(doc(db, collectionName, docId), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    throw error;
  }
};

// Get single document
export const getDocument = async <T>(
  collectionName: string,
  docId: string
): Promise<T | null> => {
  try {
    const docSnap = await getDoc(doc(db, collectionName, docId));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as T;
    }
    return null;
  } catch (error) {
    throw error;
  }
};

// Get multiple documents with query
export const getDocuments = async <T>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> => {
  try {
    const q = query(collection(db, collectionName), ...constraints);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as T[];
  } catch (error) {
    throw error;
  }
};

// Update document
export const updateDocument = async <T extends DocumentData>(
  collectionName: string,
  docId: string,
  data: Partial<T>
): Promise<void> => {
  try {
    await updateDoc(doc(db, collectionName, docId), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    throw error;
  }
};

// Delete document
export const deleteDocument = async (
  collectionName: string,
  docId: string
): Promise<void> => {
  try {
    await deleteDoc(doc(db, collectionName, docId));
  } catch (error) {
    throw error;
  }
};

// Get count of documents matching query
export const getCount = async (
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<number> => {
  try {
    const q = query(collection(db, collectionName), ...constraints);
    const snapshot = await getCountFromFirestore(q);
    return snapshot.data().count;
  } catch (error) {
    throw error;
  }
};

// Real-time listener for single document
export const subscribeToDocument = <T>(
  collectionName: string,
  docId: string,
  callback: (data: T | null) => void
): Unsubscribe => {
  return onSnapshot(doc(db, collectionName, docId), (docSnap) => {
    if (docSnap.exists()) {
      callback({ id: docSnap.id, ...docSnap.data() } as T);
    } else {
      callback(null);
    }
  });
};

// Real-time listener for collection
export const subscribeToCollection = <T>(
  collectionName: string,
  constraints: QueryConstraint[],
  callback: (data: T[]) => void
): Unsubscribe => {
  const q = query(collection(db, collectionName), ...constraints);
  return onSnapshot(q, (querySnapshot) => {
    const data = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as T[];
    callback(data);
  });
};

// Export query helpers
export { where, orderBy, limit, startAfter };
