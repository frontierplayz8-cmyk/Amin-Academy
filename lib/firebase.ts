import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getStorage, FirebaseStorage } from "firebase/storage";
import {
    initializeFirestore,
    memoryLocalCache,
    Firestore,
    getFirestore
} from "firebase/firestore";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: "amin-academy-40d81.firebaseapp.com",
    projectId: "amin-academy-40d81",
    storageBucket: "amin-academy-40d81.firebasestorage.app",
    messagingSenderId: "980799995241",
    appId: "1:980799995241:web:31612709eb570d56c951f8",
    measurementId: "G-Z7GP7PG8LE"
};

// Singleton pattern for Firebase initialization
function getFirebaseApp(): FirebaseApp {
    if (getApps().length === 0) {
        return initializeApp(firebaseConfig);
    }
    return getApp();
}

const app = getFirebaseApp();
const auth = getAuth(app);

/**
 * Force Memory Cache and Long Polling for Firestore
 * This bypasses IndexedDB locks in Brave/Chrome and resolves "Client is offline" errors.
 */
function getFirestoreInstance(app: FirebaseApp): Firestore {
    try {
        // Only try to get existing if we are sure it was initialized with our settings.
        // In Next.js dev, it's safer to check if a global flag is set.
        if (typeof window !== "undefined" && (window as any)._firestore_ready) {
            return getFirestore(app);
        }

        const firestore = initializeFirestore(app, {
            localCache: memoryLocalCache(),
            experimentalForceLongPolling: true
        });

        if (typeof window !== "undefined") {
            (window as any)._firestore_ready = true;
        }
        return firestore;
    } catch (e) {
        // If already initialized, just return it
        return getFirestore(app);
    }
}

const db = getFirestoreInstance(app);
const storage = getStorage(app);

export { app, auth, db, storage };
