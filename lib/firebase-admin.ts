import admin from "firebase-admin";

const EXPECTED_BUCKET = "amin-academy-40d81.firebasestorage.app";

// Safe initialization function
function getAdminApp() {
    if (admin.apps.length > 0) {
        const currentApp = admin.app();
        if ((currentApp.options as any).storageBucket === EXPECTED_BUCKET) {
            return currentApp;
        }
        // If bucket is wrong (old HMR state), delete and re-init
        currentApp.delete();
    }

    try {
        const serviceKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        if (!serviceKey) return null;

        const serviceAccount = JSON.parse(serviceKey);
        return admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            storageBucket: EXPECTED_BUCKET
        });
    } catch (error) {
        console.error("Firebase Admin Init Error:", error);
        return null;
    }
}

/**
 * USE THESE FUNCTIONS in your API routes!
 */
export const getAdminAuth = () => {
    const app = getAdminApp();
    return app ? admin.auth(app) : null;
};

export const getAdminDb = () => {
    const app = getAdminApp();
    if (!app) return null;

    return admin.firestore(app);
};

export const adminAuth = new Proxy({} as any, {
    get: (target, prop) => {
        const auth = getAdminAuth();
        if (!auth) throw new Error("Firebase Admin Auth not initialized. Check your environment variables.");
        return (auth as any)[prop];
    }
});

export const adminDb = new Proxy({} as any, {
    get: (target, prop) => {
        const db = getAdminDb();
        if (!db) throw new Error("Firebase Admin Firestore not initialized. Check your environment variables.");
        return (db as any)[prop];
    }
});

export const adminStorage = new Proxy({} as any, {
    get: (target, prop) => {
        const app = getAdminApp();
        if (!app) throw new Error("Firebase Admin Storage not initialized.");
        const storage = admin.storage(app);
        return (storage as any)[prop];
    }
});

export default admin;