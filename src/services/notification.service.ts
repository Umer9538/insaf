import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { COLLECTIONS } from './firestore.service';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Notification types based on PRD
export type NotificationType =
  | 'BID_RECEIVED'
  | 'BID_ACCEPTED'
  | 'BID_REJECTED'
  | 'NEW_MESSAGE'
  | 'CASE_UPDATE'
  | 'PAYMENT_RECEIVED'
  | 'ESCROW_FUNDED'
  | 'CASE_CLEAR_REQUEST'
  | 'HEARING_REMINDER'
  | 'VERIFICATION_STATUS'
  | 'SYSTEM';

export interface NotificationData {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
}

// Register for push notifications and get token
export const registerForPushNotifications = async (): Promise<string | null> => {
  // Check if physical device (notifications don't work on simulator)
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  // Check/request permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Permission for notifications not granted');
    return null;
  }

  // Get Expo push token
  const projectId = Constants.expoConfig?.extra?.eas?.projectId
    ?? Constants.easConfig?.projectId;

  const token = await Notifications.getExpoPushTokenAsync({
    projectId,
  });

  // Android specific channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token.data;
};

// Save push token to Firestore (linked to user)
export const savePushToken = async (userId: string, token: string): Promise<void> => {
  await setDoc(
    doc(db, 'userTokens', userId),
    {
      pushToken: token,
      platform: Platform.OS,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
};

// Store notification in Firestore
export const saveNotificationToFirestore = async (
  userId: string,
  notification: NotificationData
): Promise<string> => {
  const docRef = await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), {
    userId,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    data: notification.data || {},
    read: false,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

// Send local notification (for testing or immediate alerts)
export const sendLocalNotification = async (
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<void> => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: null, // Immediate
  });
};

// Schedule notification for later (e.g., hearing reminders)
export const scheduleNotification = async (
  title: string,
  body: string,
  triggerDate: Date,
  data?: Record<string, any>
): Promise<string> => {
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: {
      date: triggerDate,
    },
  });
  return id;
};

// Cancel scheduled notification
export const cancelNotification = async (notificationId: string): Promise<void> => {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
};

// Cancel all notifications
export const cancelAllNotifications = async (): Promise<void> => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};

// Add notification listeners
export const addNotificationListeners = (
  onReceived: (notification: Notifications.Notification) => void,
  onTapped: (response: Notifications.NotificationResponse) => void
) => {
  // When notification received while app is open
  const receivedSubscription = Notifications.addNotificationReceivedListener(onReceived);

  // When user taps on notification
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(onTapped);

  // Return cleanup function
  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
};

// Get all pending notifications
export const getPendingNotifications = async () => {
  return await Notifications.getAllScheduledNotificationsAsync();
};

// Set badge count (iOS)
export const setBadgeCount = async (count: number): Promise<void> => {
  await Notifications.setBadgeCountAsync(count);
};
