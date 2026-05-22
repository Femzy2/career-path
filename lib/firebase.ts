import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
// @ts-expect-error - getReactNativePersistence is available in the React Native SDK but not in the standard 'firebase/auth' web types
import { getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Environment variables are preferred, but we keep hardcoded values as fallbacks for the demo
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyBKSdbORyEQOpIbJybOwLscmSHxGficOvI",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "career-path-3ed15.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "career-path-3ed15",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "career-path-3ed15.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "290053941258",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:290053941258:android:2f56634ac81cdf1e4757f3",
};

// Web OAuth 2.0 Client ID from google-services.json (client_type: 3)
// Used by GoogleAuthProvider to validate the ID token returned from expo-auth-session
export const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "290053941258-bc4cbvtjdrhhp2gflj470bhu4eqdekmf.apps.googleusercontent.com";

// Initialize Firebase only once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth with persistence for React Native
export const auth = getApps().length === 0
  ? initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  })
  : getAuth(app);

export const db = getFirestore(app);
export default app;
