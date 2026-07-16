import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    User,
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, displayName?: string) => Promise<void>;
    logout: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            if (firebaseUser) {
                try {
                    // Sync user data from Firestore to local AsyncStorage
                    const docRef = doc(db, 'users', firebaseUser.uid);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        if (data.recommendation) {
                            await AsyncStorage.setItem('@career_recommendation', JSON.stringify(data.recommendation));
                        }
                        if (data.skills) {
                            await AsyncStorage.setItem('@user_skills', JSON.stringify(data.skills));
                        }
                        if (data.personality) {
                            await AsyncStorage.setItem('@user_personality', JSON.stringify(data.personality));
                        }
                        if (data.progress) {
                            await AsyncStorage.setItem('@user_progress', JSON.stringify(data.progress));
                        }
                        if (data.onboardingState) {
                            await AsyncStorage.setItem('@onboarding_state', JSON.stringify(data.onboardingState));
                        }
                    }
                } catch (err: any) {
                    console.warn('Failed to sync Firestore career data on login (offline):', err?.message || err);
                }
            }
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const signIn = async (email: string, password: string) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error('Firebase SignIn Error:', error);
            throw error;
        }
    };

    const signUp = async (email: string, password: string, displayName?: string) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const firebaseUser = userCredential.user;
            
            // Create user document in Firestore users collection
            await setDoc(doc(db, 'users', firebaseUser.uid), {
                email: firebaseUser.email,
                name: displayName || '',
                createdAt: new Date().toISOString(),
                onboardingState: null,
                recommendation: null,
            }, { merge: true });
        } catch (error) {
            console.error('Firebase SignUp Error:', error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            await AsyncStorage.multiRemove([
                '@career_recommendation',
                '@user_skills',
                '@user_personality',
                '@user_progress',
                '@recommendation_feedback',
                '@onboarding_state'
            ]);
        } catch (err) {
            console.error('Failed to clear local storage on logout:', err);
        }
    };

    const resetPassword = async (email: string) => {
        await sendPasswordResetEmail(auth, email);
    };

    return (
        <AuthContext.Provider value={{ user, loading, signIn, signUp, logout, resetPassword }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
}
