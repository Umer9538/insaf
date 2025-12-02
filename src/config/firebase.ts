import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA_QIoxbPK72qFgQ6XfEBjNmgPOFPN8PvQ",
  authDomain: "insaf-cf151.firebaseapp.com",
  projectId: "insaf-cf151",
  storageBucket: "insaf-cf151.firebasestorage.app",
  messagingSenderId: "804914296632",
  appId: "1:804914296632:web:76f374f05dd89fb51073cd",
  measurementId: "G-8VTW7ECTFT"
};

// Initialize Firebase (prevent re-initialization)
let app: FirebaseApp;
let auth: Auth;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  // Initialize auth with AsyncStorage persistence
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} else {
  app = getApps()[0];
  // Get existing auth instance
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
}

// Initialize services
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);

export { app, auth, db, storage };
