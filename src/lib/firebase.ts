import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
    apiKey: "AIzaSyDAL6MM6rCU7W03V90-ypKDsYsXzK3_7M8",
    authDomain: "cryptotycoonmining.firebaseapp.com",
    projectId: "cryptotycoonmining",
    storageBucket: "cryptotycoonmining.firebasestorage.app",
    messagingSenderId: "64861457497",
    appId: "1:64861457497:android:fa4f56c141f788fd9e7548"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export { onAuthStateChanged };

// ── Google Auth ───────────────────────────────────────────────
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const signInWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
};

export const firebaseSignOut = () => signOut(auth);

// ── FCM ───────────────────────────────────────────────────────
let messaging: any = null;
try {
    messaging = getMessaging(app);
} catch (e) {
    console.warn("FCM not available:", e);
}
export { messaging };

export const requestForToken = async () => {
    try {
        if (!messaging) return null;
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
            const token = await getToken(messaging, {
                vapidKey: "Di7SONRZmBp8NYU11lzPBtlJDMOdWW7M8TQhvG0OE6I",
            });
            return token || null;
        }
    } catch (err) {
        console.warn("FCM Token hatası:", err);
        return null;
    }
};

export const onMessageListener = (callback: (payload: any) => void) => {
    if (!messaging) return;
    onMessage(messaging, callback);
};

export const COLLECTIONS = {
    USERS: 'users',
    MARKETPLACE: 'marketplace',
    GUILDS: 'guilds',
    SETTINGS: 'settings',
    TRANSACTIONS: 'transactions'
};
