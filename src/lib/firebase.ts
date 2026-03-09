import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, query, onSnapshot, doc, setDoc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// TODO: Replace with user-provided configuration
const firebaseConfig = {
    apiKey: "AIzaSyDAL6MM6rCU7W03V90-ypKDsYsXzK3_7M8",
    authDomain: "cryptotycoonmining.firebaseapp.com",
    projectId: "cryptotycoonmining",
    storageBucket: "cryptotycoonmining.firebasestorage.app",
    messagingSenderId: "64861457497",
    appId: "1:64861457497:android:fa4f56c141f788fd9e7548"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const messaging = getMessaging(app);

export const requestForToken = async () => {
    try {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
            const currentToken = await getToken(messaging, {
                vapidKey: "Di7SONRZmBp8NYU11lzPBtlJDMOdWW7M8TQhvG0OE6I",
            });
            if (currentToken) {
                console.log("FCM Token:", currentToken);
                return currentToken;
            } else {
                console.log("No registration token available. Request permission to generate one.");
            }
        }
    } catch (err) {
        console.log("An error occurred while retrieving token. ", err);
    }
};

export const onMessageListener = (callback: (payload: any) => void) =>
    onMessage(messaging, (payload) => {
        callback(payload);
    });

// Firestore Collections
export const COLLECTIONS = {
    USERS: 'users',
    MARKETPLACE: 'marketplace',
    GUILDS: 'guilds',
    SETTINGS: 'settings',
    TRANSACTIONS: 'transactions' // Sub-collection under user
};
