import { initializeApp, getApps, getApp } from "firebase/app";
// @ts-ignore - getReactNativePersistence is not exported in the web types but is available in the React Native version of the SDK
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
} from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
} from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? "",
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID ?? "",
};

if (__DEV__ && !firebaseConfig.apiKey) {
  console.warn("[Firebase] Missing credentials in .env");
}

// ── Initialize Firebase (guarded against hot-reload double-init) ───────────────
const appAlreadyExists = getApps().length > 0;
export const app = appAlreadyExists ? getApp() : initializeApp(firebaseConfig);

// ── Firestore (with persistent local cache for offline + faster reads) ────────
export const db = appAlreadyExists
  ? getFirestore(app)
  : initializeFirestore(app, {
      localCache: persistentLocalCache(),
    });

// ── Analytics (only in environments that support it) ──────────────────────────
export const analytics = isSupported().then((yes) =>
  yes ? getAnalytics(app) : null,
);

// ── Auth (initializeAuth must only be called once; getAuth() reuses it) ───────
export const auth = appAlreadyExists
  ? getAuth(app)
  : initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
