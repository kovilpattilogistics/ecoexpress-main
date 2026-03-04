import { initializeApp, FirebaseApp } from "firebase/app";
import { initializeFirestore, Firestore } from "firebase/firestore";

// Safe access to environment variables
const env: any = import.meta.env || {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID
};

// Log status
if (!firebaseConfig.apiKey) {
  console.warn("Firebase Config missing. App running in offline/demo mode.");
}

// Initialize
const app: FirebaseApp | null = firebaseConfig.apiKey ? initializeApp(firebaseConfig) : null;
const firestore: Firestore | null = app ? initializeFirestore(app, { ignoreUndefinedProperties: true }) : null;

// Explicit exports
export const db = firestore;
export const isFirebaseInitialized = () => !!firestore;
