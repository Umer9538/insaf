import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
// @ts-ignore
import { initializeAuth, getReactNativePersistence, getAuth, Auth } from 'firebase/auth';
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

try {
  // Check if app is already initialized
  if (getApps().length > 0) {
    console.log('Firebase App already initialized');
    app = getApps()[0];
    auth = getAuth(app);
  } else {
    console.log('Initializing Firebase App...');
    app = initializeApp(firebaseConfig);

    console.log('Initializing Firebase Auth...');
    try {
      // @ts-ignore - getReactNativePersistence might be missing in types but present in runtime
      if (typeof getReactNativePersistence === 'function') {
        auth = initializeAuth(app, {
          persistence: getReactNativePersistence(AsyncStorage)
        });
        console.log('Firebase Auth initialized with persistence');
      } else {
        console.warn('getReactNativePersistence is not a function, falling back to default');
        auth = getAuth(app);
      }
    } catch (authError) {
      console.error('Auth initialization failed:', authError);
      auth = getAuth(app);
    }
  }
} catch (error) {
  console.error('FIREBASE INITIALIZATION ERROR:', error);
  // Emergency fallback
  try {
    if (getApps().length > 0) {
      app = getApps()[0];
    } else {
      app = initializeApp(firebaseConfig);
    }
    auth = getAuth(app);
  } catch (fallbackError) {
    console.error('Critical Firebase Failure:', fallbackError);
    // @ts-ignore
    app = {} as FirebaseApp;
    // @ts-ignore
    auth = {} as Auth;
  }
}

// Initialize services
// Initialize services
let db: Firestore;
let storage: FirebaseStorage;

try {
  // @ts-ignore
  db = getFirestore(app);
  // @ts-ignore
  storage = getStorage(app);
} catch (serviceError) {
  console.error('Service initialization failed:', serviceError);
  // @ts-ignore
  db = {} as Firestore;
  // @ts-ignore
  storage = {} as FirebaseStorage;
}

export { app, auth, db, storage };
