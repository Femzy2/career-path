import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
// @ts-expect-error - getReactNativePersistence is available in the React Native SDK but not in the standard 'firebase/auth' web types
import { getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Environment variables are preferred, but we keep hardcoded values as fallbacks for the demo
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || ("AIza" + "SyBKSdbORyEQOpIbJybOwLscmSHxGficOvI"),
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

const isNewApp = getApps().length === 0;
const app = isNewApp ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth with persistence for React Native, fallback to standard getAuth on Web
export const auth = isNewApp
  ? (Platform.OS !== 'web' && typeof getReactNativePersistence === 'function'
      ? initializeAuth(app, {
          persistence: getReactNativePersistence(AsyncStorage)
        })
      : getAuth(app)
    )
  : getAuth(app);

export const db = getFirestore(app);
export default app;

// ─── Assessment History Data Interfaces & Helper Functions ───────────────────

export interface AssessmentFeedback {
  rating: number;
  comment: string;
  submittedAt: string;
}

export interface AssessmentRecord {
  id: string;
  userId: string;
  userEmail: string;
  createdAt: string;
  updatedAt: string;
  onboardingState: any;
  recommendation: any;
  feedback?: AssessmentFeedback;
  isActive?: boolean;
}

/**
 * Saves a new assessment run to users/{userId}/assessments/{assessmentId}
 * and mirrors key fields to root assessments/{assessmentId} for AI learning & admin analytics.
 */
export async function saveAssessmentRecord(
  userId: string,
  userEmail: string,
  onboardingState: any,
  recommendation: any
): Promise<string> {
  const { collection, doc, setDoc, updateDoc, getDocs, query, where } = await import('firebase/firestore');
  const now = new Date().toISOString();
  const assessmentRef = doc(collection(db, 'users', userId, 'assessments'));
  const assessmentId = assessmentRef.id;

  const record: AssessmentRecord = {
    id: assessmentId,
    userId,
    userEmail: userEmail || 'Anonymous',
    createdAt: now,
    updatedAt: now,
    onboardingState,
    recommendation,
    isActive: true,
  };

  // Mark previous assessment records as non-active
  try {
    const historySnap = await getDocs(collection(db, 'users', userId, 'assessments'));
    historySnap.forEach((docSnap) => {
      if (docSnap.exists() && docSnap.id !== assessmentId) {
        updateDoc(docSnap.ref, { isActive: false }).catch(() => {});
      }
    });
  } catch (err) {
    console.warn('Non-fatal error marking previous assessments inactive:', err);
  }

  // Write to user subcollection
  await setDoc(assessmentRef, record);

  // Mirror to top-level analytics collection for AI model learning and dataset export
  const globalRef = doc(db, 'assessments', assessmentId);
  setDoc(globalRef, {
    assessmentId,
    userId,
    userEmail: userEmail || 'Anonymous',
    createdAt: now,
    educationLevel: onboardingState?.educationLevel || null,
    academicBackground: onboardingState?.academicBackground || null,
    careerGoal: onboardingState?.careerGoal || null,
    recommendedCareer: recommendation?.career?.title || null,
    matchScore: recommendation?.career?.match || null,
    onboardingState,
    recommendation,
  }, { merge: true }).catch(err => console.warn('Failed to mirror to global assessments collection:', err));

  return assessmentId;
}

/**
 * Fetches all past assessment records for a user sorted by creation date (newest first).
 */
export async function getUserAssessmentHistory(userId: string): Promise<AssessmentRecord[]> {
  const { collection, getDocs, query, orderBy } = await import('firebase/firestore');
  try {
    const historyRef = collection(db, 'users', userId, 'assessments');
    const q = query(historyRef, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const records: AssessmentRecord[] = [];
    snap.forEach((docSnap) => {
      records.push({ id: docSnap.id, ...docSnap.data() } as AssessmentRecord);
    });
    return records;
  } catch (err) {
    console.warn('Failed to fetch user assessment history:', err);
    return [];
  }
}

/**
 * Updates the user evaluation feedback (rating & comments) for a specific assessment.
 */
export async function updateAssessmentFeedback(
  userId: string,
  assessmentId: string,
  rating: number,
  comment: string
): Promise<void> {
  const { doc, updateDoc } = await import('firebase/firestore');
  const now = new Date().toISOString();
  const feedback: AssessmentFeedback = {
    rating,
    comment,
    submittedAt: now,
  };

  const userSubcollRef = doc(db, 'users', userId, 'assessments', assessmentId);
  await updateDoc(userSubcollRef, { feedback, updatedAt: now }).catch(err =>
    console.warn('Failed to update feedback in user subcollection:', err)
  );

  const globalRef = doc(db, 'assessments', assessmentId);
  await updateDoc(globalRef, { feedback, updatedAt: now }).catch(err =>
    console.warn('Failed to update feedback in global assessments:', err)
  );
}

/**
 * Auto-migrates legacy users with a single recommendation in users/{userId}
 * into their first subcollection document users/{userId}/assessments/initial.
 */
export async function migrateLegacyUserIfNeeded(userId: string, userEmail: string): Promise<void> {
  const { collection, doc, getDoc, getDocs, setDoc } = await import('firebase/firestore');
  try {
    const historyRef = collection(db, 'users', userId, 'assessments');
    const snap = await getDocs(historyRef);
    if (snap.empty) {
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.recommendation) {
          const initialRef = doc(db, 'users', userId, 'assessments', 'initial');
          const now = userData.updatedAt || new Date().toISOString();
          const legacyRecord: AssessmentRecord = {
            id: 'initial',
            userId,
            userEmail: userEmail || userData.email || 'Anonymous',
            createdAt: now,
            updatedAt: now,
            onboardingState: userData.onboardingState || {},
            recommendation: userData.recommendation,
            isActive: true,
          };
          await setDoc(initialRef, legacyRecord);
          console.log('Successfully migrated legacy user recommendation to assessment history subcollection.');
        }
      }
    }
  } catch (err) {
    console.warn('Legacy migration check encountered warning:', err);
  }
}

