/**
 * INSAF - Consultation Service
 *
 * Handles consultation booking, scheduling, and management
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
import { createConversation } from './chat.service';
import { recordEarning } from './earnings.service';

// Types
export type ConsultationType = 'VIDEO' | 'AUDIO' | 'CHAT' | 'IN_PERSON';
export type ConsultationStatus =
  | 'PENDING' // Awaiting lawyer confirmation
  | 'CONFIRMED' // Lawyer accepted
  | 'CANCELLED' // Cancelled by either party
  | 'COMPLETED' // Consultation finished
  | 'NO_SHOW' // Client didn't show up
  | 'RESCHEDULED'; // Rescheduled to new time

export interface TimeSlot {
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  available: boolean;
}

export interface LawyerAvailability {
  id?: string;
  lawyerId: string;
  weeklySchedule: {
    [key: number]: { // 0 = Sunday, 6 = Saturday
      enabled: boolean;
      slots: Array<{
        startTime: string;
        endTime: string;
      }>;
    };
  };
  blockedDates: string[]; // Array of YYYY-MM-DD dates
  consultationDuration: number; // In minutes (default 30)
  bufferTime: number; // Minutes between consultations
  updatedAt: Timestamp;
}

export interface Consultation {
  id?: string;
  lawyerId: string;
  lawyerName: string;
  lawyerAvatar?: string;
  clientId: string;
  clientName: string;
  clientAvatar?: string;
  type: ConsultationType;
  scheduledDate: Timestamp;
  duration: number; // In minutes
  fee: number;
  status: ConsultationStatus;
  topic: string;
  description?: string;
  meetingLink?: string;
  conversationId?: string;
  notes?: string; // Lawyer's notes
  paymentId?: string;
  cancelledBy?: 'CLIENT' | 'LAWYER';
  cancellationReason?: string;
  rescheduledFrom?: string; // Original consultation ID
  completedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Functions

/**
 * Set lawyer availability
 */
export const setLawyerAvailability = async (
  lawyerId: string,
  availability: Omit<LawyerAvailability, 'id' | 'lawyerId' | 'updatedAt'>
): Promise<void> => {
  const availabilityRef = doc(db, 'lawyerAvailability', lawyerId);
  const { setDoc } = await import('firebase/firestore');

  await setDoc(availabilityRef, {
    lawyerId,
    ...availability,
    updatedAt: serverTimestamp(),
  }, { merge: true });
};

/**
 * Get lawyer availability
 */
export const getLawyerAvailability = async (
  lawyerId: string
): Promise<LawyerAvailability | null> => {
  const availabilityRef = doc(db, 'lawyerAvailability', lawyerId);
  const availabilitySnap = await getDoc(availabilityRef);

  if (availabilitySnap.exists()) {
    return { id: availabilitySnap.id, ...availabilitySnap.data() } as LawyerAvailability;
  }

  return null;
};

/**
 * Get available time slots for a lawyer on a specific date
 */
export const getAvailableSlots = async (
  lawyerId: string,
  date: Date
): Promise<TimeSlot[]> => {
  const availability = await getLawyerAvailability(lawyerId);
  if (!availability) {
    return [];
  }

  const dayOfWeek = date.getDay();
  const dateString = date.toISOString().split('T')[0];

  // Check if date is blocked
  if (availability.blockedDates.includes(dateString)) {
    return [];
  }

  // Get day schedule
  const daySchedule = availability.weeklySchedule[dayOfWeek];
  if (!daySchedule || !daySchedule.enabled) {
    return [];
  }

  // Get existing consultations for this day
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const q = query(
    collection(db, COLLECTIONS.CONSULTATIONS),
    where('lawyerId', '==', lawyerId),
    where('scheduledDate', '>=', Timestamp.fromDate(startOfDay)),
    where('scheduledDate', '<=', Timestamp.fromDate(endOfDay)),
    where('status', 'in', ['PENDING', 'CONFIRMED'])
  );

  const querySnapshot = await getDocs(q);
  const bookedSlots = querySnapshot.docs.map(doc => {
    const data = doc.data();
    const scheduledDate = data.scheduledDate.toDate();
    return {
      startTime: scheduledDate.toTimeString().slice(0, 5),
      endTime: new Date(scheduledDate.getTime() + data.duration * 60000).toTimeString().slice(0, 5),
    };
  });

  // Generate available slots
  const slots: TimeSlot[] = [];
  const duration = availability.consultationDuration || 30;
  const buffer = availability.bufferTime || 15;

  daySchedule.slots.forEach(slot => {
    let currentTime = parseTime(slot.startTime);
    const endTime = parseTime(slot.endTime);

    while (currentTime + duration <= endTime) {
      const slotStartTime = formatTime(currentTime);
      const slotEndTime = formatTime(currentTime + duration);

      // Check if slot overlaps with booked consultations
      const isBooked = bookedSlots.some(booked => {
        const bookedStart = parseTime(booked.startTime);
        const bookedEnd = parseTime(booked.endTime);
        return (currentTime < bookedEnd + buffer) && (currentTime + duration > bookedStart - buffer);
      });

      slots.push({
        date: dateString,
        startTime: slotStartTime,
        endTime: slotEndTime,
        available: !isBooked,
      });

      currentTime += duration + buffer;
    }
  });

  return slots;
};

// Helper functions
const parseTime = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const formatTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

/**
 * Book a consultation
 */
export const bookConsultation = async (
  lawyerId: string,
  lawyerName: string,
  clientId: string,
  clientName: string,
  type: ConsultationType,
  scheduledDate: Date,
  duration: number,
  fee: number,
  topic: string,
  description?: string,
  lawyerAvatar?: string,
  clientAvatar?: string
): Promise<string> => {
  // Verify slot is still available
  const slots = await getAvailableSlots(lawyerId, scheduledDate);
  const timeString = scheduledDate.toTimeString().slice(0, 5);
  const slot = slots.find(s => s.startTime === timeString);

  if (!slot || !slot.available) {
    throw new Error('This time slot is no longer available');
  }

  // Create chat conversation for the consultation
  const conversationId = await createConversation(
    [
      { userId: clientId, userName: clientName, userRole: 'client', userAvatar: clientAvatar },
      { userId: lawyerId, userName: lawyerName, userRole: 'lawyer', userAvatar: lawyerAvatar },
    ],
    undefined,
    'direct',
    `Consultation: ${topic}`
  );

  // Create consultation
  const consultationData: Omit<Consultation, 'id'> = {
    lawyerId,
    lawyerName,
    lawyerAvatar,
    clientId,
    clientName,
    clientAvatar,
    type,
    scheduledDate: Timestamp.fromDate(scheduledDate),
    duration,
    fee,
    status: 'PENDING',
    topic,
    description,
    conversationId,
    createdAt: serverTimestamp() as Timestamp,
    updatedAt: serverTimestamp() as Timestamp,
  };

  const docRef = await addDoc(collection(db, COLLECTIONS.CONSULTATIONS), consultationData);
  return docRef.id;
};

/**
 * Confirm consultation (by lawyer)
 */
export const confirmConsultation = async (
  consultationId: string,
  lawyerId: string,
  meetingLink?: string
): Promise<void> => {
  const consultationRef = doc(db, COLLECTIONS.CONSULTATIONS, consultationId);
  const consultationSnap = await getDoc(consultationRef);

  if (!consultationSnap.exists()) {
    throw new Error('Consultation not found');
  }

  const consultation = consultationSnap.data() as Consultation;

  if (consultation.lawyerId !== lawyerId) {
    throw new Error('Unauthorized');
  }

  if (consultation.status !== 'PENDING') {
    throw new Error('Cannot confirm this consultation');
  }

  await updateDoc(consultationRef, {
    status: 'CONFIRMED',
    meetingLink,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Cancel consultation
 */
export const cancelConsultation = async (
  consultationId: string,
  userId: string,
  reason?: string
): Promise<void> => {
  const consultationRef = doc(db, COLLECTIONS.CONSULTATIONS, consultationId);
  const consultationSnap = await getDoc(consultationRef);

  if (!consultationSnap.exists()) {
    throw new Error('Consultation not found');
  }

  const consultation = consultationSnap.data() as Consultation;

  if (consultation.clientId !== userId && consultation.lawyerId !== userId) {
    throw new Error('Unauthorized');
  }

  if (!['PENDING', 'CONFIRMED'].includes(consultation.status)) {
    throw new Error('Cannot cancel this consultation');
  }

  const cancelledBy = consultation.clientId === userId ? 'CLIENT' : 'LAWYER';

  await updateDoc(consultationRef, {
    status: 'CANCELLED',
    cancelledBy,
    cancellationReason: reason,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Complete consultation (by lawyer)
 */
export const completeConsultation = async (
  consultationId: string,
  lawyerId: string,
  notes?: string
): Promise<void> => {
  const consultationRef = doc(db, COLLECTIONS.CONSULTATIONS, consultationId);
  const consultationSnap = await getDoc(consultationRef);

  if (!consultationSnap.exists()) {
    throw new Error('Consultation not found');
  }

  const consultation = consultationSnap.data() as Consultation;

  if (consultation.lawyerId !== lawyerId) {
    throw new Error('Unauthorized');
  }

  if (consultation.status !== 'CONFIRMED') {
    throw new Error('Cannot complete this consultation');
  }

  await updateDoc(consultationRef, {
    status: 'COMPLETED',
    notes,
    completedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Record earning for lawyer
  await recordEarning(
    lawyerId,
    consultation.fee,
    'CONSULTATION_FEE',
    `Consultation with ${consultation.clientName}`,
    undefined,
    consultationId,
    consultation.clientName
  );
};

/**
 * Mark as no-show
 */
export const markNoShow = async (
  consultationId: string,
  lawyerId: string
): Promise<void> => {
  const consultationRef = doc(db, COLLECTIONS.CONSULTATIONS, consultationId);
  const consultationSnap = await getDoc(consultationRef);

  if (!consultationSnap.exists()) {
    throw new Error('Consultation not found');
  }

  const consultation = consultationSnap.data() as Consultation;

  if (consultation.lawyerId !== lawyerId) {
    throw new Error('Unauthorized');
  }

  if (consultation.status !== 'CONFIRMED') {
    throw new Error('Cannot mark this consultation as no-show');
  }

  await updateDoc(consultationRef, {
    status: 'NO_SHOW',
    updatedAt: serverTimestamp(),
  });

  // Still record partial earning for no-show (e.g., 50%)
  await recordEarning(
    lawyerId,
    consultation.fee * 0.5,
    'CONSULTATION_FEE',
    `No-show consultation with ${consultation.clientName}`,
    undefined,
    consultationId,
    consultation.clientName
  );
};

/**
 * Reschedule consultation
 */
export const rescheduleConsultation = async (
  consultationId: string,
  newDate: Date,
  userId: string
): Promise<string> => {
  const consultationRef = doc(db, COLLECTIONS.CONSULTATIONS, consultationId);
  const consultationSnap = await getDoc(consultationRef);

  if (!consultationSnap.exists()) {
    throw new Error('Consultation not found');
  }

  const consultation = consultationSnap.data() as Consultation;

  if (consultation.clientId !== userId && consultation.lawyerId !== userId) {
    throw new Error('Unauthorized');
  }

  if (!['PENDING', 'CONFIRMED'].includes(consultation.status)) {
    throw new Error('Cannot reschedule this consultation');
  }

  // Verify new slot is available
  const slots = await getAvailableSlots(consultation.lawyerId, newDate);
  const timeString = newDate.toTimeString().slice(0, 5);
  const slot = slots.find(s => s.startTime === timeString);

  if (!slot || !slot.available) {
    throw new Error('The new time slot is not available');
  }

  // Mark old consultation as rescheduled
  await updateDoc(consultationRef, {
    status: 'RESCHEDULED',
    updatedAt: serverTimestamp(),
  });

  // Create new consultation
  const newConsultationData: Omit<Consultation, 'id'> = {
    ...consultation,
    scheduledDate: Timestamp.fromDate(newDate),
    status: 'PENDING',
    rescheduledFrom: consultationId,
    createdAt: serverTimestamp() as Timestamp,
    updatedAt: serverTimestamp() as Timestamp,
  };

  const docRef = await addDoc(collection(db, COLLECTIONS.CONSULTATIONS), newConsultationData);
  return docRef.id;
};

/**
 * Get consultations for a lawyer
 */
export const getLawyerConsultations = async (
  lawyerId: string,
  status?: ConsultationStatus[],
  limitCount: number = 50
): Promise<Consultation[]> => {
  let q = query(
    collection(db, COLLECTIONS.CONSULTATIONS),
    where('lawyerId', '==', lawyerId),
    orderBy('scheduledDate', 'desc'),
    firestoreLimit(limitCount)
  );

  if (status && status.length > 0) {
    q = query(
      collection(db, COLLECTIONS.CONSULTATIONS),
      where('lawyerId', '==', lawyerId),
      where('status', 'in', status),
      orderBy('scheduledDate', 'desc'),
      firestoreLimit(limitCount)
    );
  }

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Consultation[];
};

/**
 * Get consultations for a client
 */
export const getClientConsultations = async (
  clientId: string,
  limitCount: number = 50
): Promise<Consultation[]> => {
  const q = query(
    collection(db, COLLECTIONS.CONSULTATIONS),
    where('clientId', '==', clientId),
    orderBy('scheduledDate', 'desc'),
    firestoreLimit(limitCount)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Consultation[];
};

/**
 * Subscribe to lawyer's upcoming consultations
 */
export const subscribeToUpcomingConsultations = (
  lawyerId: string,
  callback: (consultations: Consultation[]) => void
): Unsubscribe => {
  const now = Timestamp.now();

  const q = query(
    collection(db, COLLECTIONS.CONSULTATIONS),
    where('lawyerId', '==', lawyerId),
    where('scheduledDate', '>=', now),
    where('status', 'in', ['PENDING', 'CONFIRMED']),
    orderBy('scheduledDate', 'asc'),
    firestoreLimit(20)
  );

  return onSnapshot(q, (querySnapshot) => {
    const consultations = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Consultation[];
    callback(consultations);
  });
};

/**
 * Get consultation by ID
 */
export const getConsultationById = async (
  consultationId: string
): Promise<Consultation | null> => {
  const consultationRef = doc(db, COLLECTIONS.CONSULTATIONS, consultationId);
  const consultationSnap = await getDoc(consultationRef);

  if (consultationSnap.exists()) {
    return { id: consultationSnap.id, ...consultationSnap.data() } as Consultation;
  }

  return null;
};

/**
 * Add blocked date
 */
export const addBlockedDate = async (
  lawyerId: string,
  date: string
): Promise<void> => {
  const availabilityRef = doc(db, 'lawyerAvailability', lawyerId);
  const availabilitySnap = await getDoc(availabilityRef);

  if (!availabilitySnap.exists()) {
    throw new Error('Availability settings not found');
  }

  const { arrayUnion } = await import('firebase/firestore');

  await updateDoc(availabilityRef, {
    blockedDates: arrayUnion(date),
    updatedAt: serverTimestamp(),
  });
};

/**
 * Remove blocked date
 */
export const removeBlockedDate = async (
  lawyerId: string,
  date: string
): Promise<void> => {
  const availabilityRef = doc(db, 'lawyerAvailability', lawyerId);
  const availabilitySnap = await getDoc(availabilityRef);

  if (!availabilitySnap.exists()) {
    throw new Error('Availability settings not found');
  }

  const { arrayRemove } = await import('firebase/firestore');

  await updateDoc(availabilityRef, {
    blockedDates: arrayRemove(date),
    updatedAt: serverTimestamp(),
  });
};
