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
  writeBatch,
  increment,
  arrayUnion,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { COLLECTIONS } from './firestore.service';

// Add CONVERSATIONS collection
export const CHAT_COLLECTIONS = {
  ...COLLECTIONS,
  CONVERSATIONS: 'conversations',
} as const;

// Types

export interface MessageAttachment {
  id: string;
  type: 'image' | 'document' | 'video' | 'audio';
  url: string;
  name: string;
  size: number;
  mimeType?: string;
  thumbnailUrl?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  attachments?: MessageAttachment[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  readBy: string[]; // Array of user IDs who have read this message
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  replyTo?: string; // ID of the message being replied to
  edited?: boolean;
  deleted?: boolean;
}

export interface ChatParticipant {
  userId: string;
  userName: string;
  userAvatar?: string;
  userRole: 'client' | 'lawyer' | 'corporate';
  joinedAt: Timestamp;
  lastReadAt?: Timestamp;
  unreadCount: number;
}

export interface Conversation {
  id: string;
  participants: ChatParticipant[];
  participantIds: string[]; // For querying
  caseId?: string; // Optional link to a case
  type: 'direct' | 'group' | 'case'; // Type of conversation
  title?: string; // For group chats or case discussions
  avatar?: string; // Group/case avatar
  lastMessage?: {
    text: string;
    senderId: string;
    senderName: string;
    createdAt: Timestamp;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  archived?: boolean;
  muted?: boolean;
}

// Helper function to get participant data
const createParticipant = (
  userId: string,
  userName: string,
  userRole: 'client' | 'lawyer' | 'corporate',
  userAvatar?: string
): ChatParticipant => ({
  userId,
  userName,
  userAvatar,
  userRole,
  joinedAt: Timestamp.now(),
  unreadCount: 0,
});

// Functions

/**
 * Create a new conversation
 * @param participants Array of participant data
 * @param caseId Optional case ID to link the conversation
 * @param type Type of conversation
 * @param title Optional title for group chats
 * @returns The conversation ID
 */
export const createConversation = async (
  participants: Array<{
    userId: string;
    userName: string;
    userRole: 'client' | 'lawyer' | 'corporate';
    userAvatar?: string;
  }>,
  caseId?: string,
  type: 'direct' | 'group' | 'case' = 'direct',
  title?: string,
  createdBy?: string
): Promise<string> => {
  try {
    if (participants.length < 2) {
      throw new Error('A conversation must have at least 2 participants');
    }

    // Check if direct conversation already exists between these participants
    if (type === 'direct' && participants.length === 2) {
      const participantIds = participants.map(p => p.userId).sort();
      const existingConvQuery = query(
        collection(db, CHAT_COLLECTIONS.CONVERSATIONS),
        where('participantIds', '==', participantIds),
        where('type', '==', 'direct')
      );
      const existingConvSnapshot = await getDocs(existingConvQuery);

      if (!existingConvSnapshot.empty) {
        return existingConvSnapshot.docs[0].id;
      }
    }

    const chatParticipants = participants.map(p =>
      createParticipant(p.userId, p.userName, p.userRole, p.userAvatar)
    );

    const conversationData: Omit<Conversation, 'id'> = {
      participants: chatParticipants,
      participantIds: participants.map(p => p.userId).sort(),
      caseId,
      type,
      title: type === 'group' || type === 'case' ? title : undefined,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
      createdBy: createdBy || participants[0].userId,
    };

    const docRef = await addDoc(
      collection(db, CHAT_COLLECTIONS.CONVERSATIONS),
      conversationData
    );

    return docRef.id;
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
};

/**
 * Get all conversations for a user
 * @param userId User ID
 * @returns Array of conversations
 */
export const getConversations = async (userId: string): Promise<Conversation[]> => {
  try {
    const q = query(
      collection(db, CHAT_COLLECTIONS.CONVERSATIONS),
      where('participantIds', 'array-contains', userId),
      where('archived', '!=', true),
      orderBy('archived'),
      orderBy('updatedAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Conversation[];
  } catch (error) {
    console.error('Error getting conversations:', error);
    throw error;
  }
};

/**
 * Get messages for a conversation
 * @param conversationId Conversation ID
 * @param limit Number of messages to fetch
 * @returns Array of messages
 */
export const getMessages = async (
  conversationId: string,
  limit: number = 50
): Promise<Message[]> => {
  try {
    const q = query(
      collection(db, CHAT_COLLECTIONS.MESSAGES),
      where('conversationId', '==', conversationId),
      orderBy('createdAt', 'desc'),
      firestoreLimit(limit)
    );

    const querySnapshot = await getDocs(q);
    const messages = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Message[];

    // Return in chronological order (oldest first)
    return messages.reverse();
  } catch (error) {
    console.error('Error getting messages:', error);
    throw error;
  }
};

/**
 * Send a message in a conversation
 * @param conversationId Conversation ID
 * @param senderId Sender's user ID
 * @param senderName Sender's name
 * @param text Message text
 * @param attachments Optional attachments
 * @param senderAvatar Optional sender avatar URL
 * @param replyTo Optional message ID being replied to
 * @returns The message ID
 */
export const sendMessage = async (
  conversationId: string,
  senderId: string,
  senderName: string,
  text: string,
  attachments?: MessageAttachment[],
  senderAvatar?: string,
  replyTo?: string
): Promise<string> => {
  try {
    const batch = writeBatch(db);

    // Create message
    const messageData: Omit<Message, 'id'> = {
      conversationId,
      senderId,
      senderName,
      senderAvatar,
      text,
      attachments,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
      readBy: [senderId], // Sender has read their own message
      status: 'sent',
      replyTo,
    };

    const messageRef = await addDoc(
      collection(db, CHAT_COLLECTIONS.MESSAGES),
      messageData
    );

    // Update conversation's last message and unread counts
    const conversationRef = doc(db, CHAT_COLLECTIONS.CONVERSATIONS, conversationId);
    const conversationSnap = await getDoc(conversationRef);

    if (conversationSnap.exists()) {
      const conversationData = conversationSnap.data() as Conversation;

      // Update unread count for all participants except sender
      const updatedParticipants = conversationData.participants.map(participant => {
        if (participant.userId !== senderId) {
          return {
            ...participant,
            unreadCount: participant.unreadCount + 1,
          };
        }
        return participant;
      });

      await updateDoc(conversationRef, {
        lastMessage: {
          text: text.substring(0, 100), // Truncate for preview
          senderId,
          senderName,
          createdAt: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
        participants: updatedParticipants,
      });
    }

    return messageRef.id;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

/**
 * Mark messages as read for a user in a conversation
 * @param conversationId Conversation ID
 * @param userId User ID
 */
export const markMessagesAsRead = async (
  conversationId: string,
  userId: string
): Promise<void> => {
  try {
    const batch = writeBatch(db);

    // Get all unread messages in the conversation
    const q = query(
      collection(db, CHAT_COLLECTIONS.MESSAGES),
      where('conversationId', '==', conversationId),
      where('senderId', '!=', userId) // Only messages not sent by this user
    );

    const querySnapshot = await getDocs(q);

    // Update each message to add user to readBy array
    querySnapshot.docs.forEach(docSnapshot => {
      const message = docSnapshot.data() as Message;
      if (!message.readBy.includes(userId)) {
        const messageRef = doc(db, CHAT_COLLECTIONS.MESSAGES, docSnapshot.id);
        batch.update(messageRef, {
          readBy: arrayUnion(userId),
          status: 'read',
        });
      }
    });

    // Update conversation to reset unread count for this user
    const conversationRef = doc(db, CHAT_COLLECTIONS.CONVERSATIONS, conversationId);
    const conversationSnap = await getDoc(conversationRef);

    if (conversationSnap.exists()) {
      const conversationData = conversationSnap.data() as Conversation;
      const updatedParticipants = conversationData.participants.map(participant => {
        if (participant.userId === userId) {
          return {
            ...participant,
            unreadCount: 0,
            lastReadAt: serverTimestamp() as Timestamp,
          };
        }
        return participant;
      });

      batch.update(conversationRef, {
        participants: updatedParticipants,
      });
    }

    await batch.commit();
  } catch (error) {
    console.error('Error marking messages as read:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time conversation updates for a user
 * @param userId User ID
 * @param callback Callback function to handle conversation updates
 * @returns Unsubscribe function
 */
export const subscribeToConversations = (
  userId: string,
  callback: (conversations: Conversation[]) => void
): Unsubscribe => {
  try {
    const q = query(
      collection(db, CHAT_COLLECTIONS.CONVERSATIONS),
      where('participantIds', 'array-contains', userId),
      where('archived', '!=', true),
      orderBy('archived'),
      orderBy('updatedAt', 'desc')
    );

    return onSnapshot(
      q,
      (querySnapshot) => {
        const conversations = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Conversation[];
        callback(conversations);
      },
      (error) => {
        console.error('Error in conversation subscription:', error);
      }
    );
  } catch (error) {
    console.error('Error subscribing to conversations:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time message updates for a conversation
 * @param conversationId Conversation ID
 * @param callback Callback function to handle message updates
 * @param limit Number of messages to listen to
 * @returns Unsubscribe function
 */
export const subscribeToMessages = (
  conversationId: string,
  callback: (messages: Message[]) => void,
  limit: number = 50
): Unsubscribe => {
  try {
    const q = query(
      collection(db, CHAT_COLLECTIONS.MESSAGES),
      where('conversationId', '==', conversationId),
      orderBy('createdAt', 'desc'),
      firestoreLimit(limit)
    );

    return onSnapshot(
      q,
      (querySnapshot) => {
        const messages = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Message[];

        // Return in chronological order (oldest first)
        callback(messages.reverse());
      },
      (error) => {
        console.error('Error in messages subscription:', error);
      }
    );
  } catch (error) {
    console.error('Error subscribing to messages:', error);
    throw error;
  }
};

/**
 * Get unread message count for a user across all conversations
 * @param userId User ID
 * @returns Total unread count
 */
export const getUnreadCount = async (userId: string): Promise<number> => {
  try {
    const conversations = await getConversations(userId);

    let totalUnread = 0;
    conversations.forEach(conversation => {
      const participant = conversation.participants.find(p => p.userId === userId);
      if (participant) {
        totalUnread += participant.unreadCount;
      }
    });

    return totalUnread;
  } catch (error) {
    console.error('Error getting unread count:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time unread count updates for a user
 * @param userId User ID
 * @param callback Callback function to handle unread count updates
 * @returns Unsubscribe function
 */
export const subscribeToUnreadCount = (
  userId: string,
  callback: (count: number) => void
): Unsubscribe => {
  return subscribeToConversations(userId, (conversations) => {
    let totalUnread = 0;
    conversations.forEach(conversation => {
      const participant = conversation.participants.find(p => p.userId === userId);
      if (participant) {
        totalUnread += participant.unreadCount;
      }
    });
    callback(totalUnread);
  });
};

/**
 * Update a message (edit)
 * @param messageId Message ID
 * @param text New message text
 */
export const updateMessage = async (
  messageId: string,
  text: string
): Promise<void> => {
  try {
    const messageRef = doc(db, CHAT_COLLECTIONS.MESSAGES, messageId);
    await updateDoc(messageRef, {
      text,
      edited: true,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating message:', error);
    throw error;
  }
};

/**
 * Delete a message (soft delete)
 * @param messageId Message ID
 */
export const deleteMessage = async (messageId: string): Promise<void> => {
  try {
    const messageRef = doc(db, CHAT_COLLECTIONS.MESSAGES, messageId);
    await updateDoc(messageRef, {
      text: 'This message was deleted',
      deleted: true,
      attachments: [],
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
};

/**
 * Archive a conversation
 * @param conversationId Conversation ID
 */
export const archiveConversation = async (conversationId: string): Promise<void> => {
  try {
    const conversationRef = doc(db, CHAT_COLLECTIONS.CONVERSATIONS, conversationId);
    await updateDoc(conversationRef, {
      archived: true,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error archiving conversation:', error);
    throw error;
  }
};

/**
 * Unarchive a conversation
 * @param conversationId Conversation ID
 */
export const unarchiveConversation = async (conversationId: string): Promise<void> => {
  try {
    const conversationRef = doc(db, CHAT_COLLECTIONS.CONVERSATIONS, conversationId);
    await updateDoc(conversationRef, {
      archived: false,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error unarchiving conversation:', error);
    throw error;
  }
};

/**
 * Get a single conversation by ID
 * @param conversationId Conversation ID
 * @returns Conversation data or null
 */
export const getConversation = async (
  conversationId: string
): Promise<Conversation | null> => {
  try {
    const docSnap = await getDoc(
      doc(db, CHAT_COLLECTIONS.CONVERSATIONS, conversationId)
    );

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as Conversation;
    }

    return null;
  } catch (error) {
    console.error('Error getting conversation:', error);
    throw error;
  }
};

/**
 * Add participants to a group conversation
 * @param conversationId Conversation ID
 * @param participants Array of new participants
 */
export const addParticipants = async (
  conversationId: string,
  participants: Array<{
    userId: string;
    userName: string;
    userRole: 'client' | 'lawyer' | 'corporate';
    userAvatar?: string;
  }>
): Promise<void> => {
  try {
    const conversationRef = doc(db, CHAT_COLLECTIONS.CONVERSATIONS, conversationId);
    const conversationSnap = await getDoc(conversationRef);

    if (!conversationSnap.exists()) {
      throw new Error('Conversation not found');
    }

    const conversationData = conversationSnap.data() as Conversation;

    if (conversationData.type === 'direct') {
      throw new Error('Cannot add participants to a direct conversation');
    }

    const newParticipants = participants.map(p =>
      createParticipant(p.userId, p.userName, p.userRole, p.userAvatar)
    );

    const updatedParticipants = [...conversationData.participants, ...newParticipants];
    const updatedParticipantIds = updatedParticipants.map(p => p.userId).sort();

    await updateDoc(conversationRef, {
      participants: updatedParticipants,
      participantIds: updatedParticipantIds,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error adding participants:', error);
    throw error;
  }
};

/**
 * Remove a participant from a group conversation
 * @param conversationId Conversation ID
 * @param userId User ID to remove
 */
export const removeParticipant = async (
  conversationId: string,
  userId: string
): Promise<void> => {
  try {
    const conversationRef = doc(db, CHAT_COLLECTIONS.CONVERSATIONS, conversationId);
    const conversationSnap = await getDoc(conversationRef);

    if (!conversationSnap.exists()) {
      throw new Error('Conversation not found');
    }

    const conversationData = conversationSnap.data() as Conversation;

    if (conversationData.type === 'direct') {
      throw new Error('Cannot remove participants from a direct conversation');
    }

    const updatedParticipants = conversationData.participants.filter(
      p => p.userId !== userId
    );
    const updatedParticipantIds = updatedParticipants.map(p => p.userId).sort();

    await updateDoc(conversationRef, {
      participants: updatedParticipants,
      participantIds: updatedParticipantIds,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error removing participant:', error);
    throw error;
  }
};
