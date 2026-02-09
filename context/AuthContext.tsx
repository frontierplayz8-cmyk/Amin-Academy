'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface UserProfile {
    uid: string;
    email: string | null;
    username: string;
    ranks: 'Student' | 'Teacher' | 'Principal';
    bio?: string;
    designation?: string;
    joiningDate?: string;
    salary?: number;
}

interface AuthContextType {
    user: FirebaseUser | null;
    profile: UserProfile | null;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: true,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);

            if (firebaseUser) {
                // Fetch additional user data from Firestore
                const userDocRef = doc(db, 'users', firebaseUser.uid);
                try {
                    const userDoc = await getDoc(userDocRef);

                    if (userDoc.exists()) {
                        setProfile(userDoc.data() as UserProfile);
                    } else {
                        console.warn("AuthContext: Profile document not found for user", firebaseUser.uid);
                        setProfile(null);
                    }
                } catch (firestoreErr: any) {
                    console.error("AuthContext: Firestore fetch failed (likely offline):", firestoreErr);
                    setProfile(null);
                }
            } else {
                setProfile(null);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, profile, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
