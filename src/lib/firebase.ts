"use client";

import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";
import {
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore";

export const USE_EMULATOR = process.env.NEXT_PUBLIC_USE_EMULATOR === "1";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** true khi đã điền cấu hình Firebase (hoặc đang chạy thử với emulator). */
export const FIREBASE_CONFIGURED = USE_EMULATOR || Boolean(config.apiKey && config.projectId);

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

function getApp(): FirebaseApp {
  if (!app) {
    app =
      getApps()[0] ??
      initializeApp(
        USE_EMULATOR ? { apiKey: "demo-key", projectId: "demo-lopvan", authDomain: "localhost" } : config,
      );
  }
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getApp());
    auth.languageCode = "vi";
    if (USE_EMULATOR) connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  }
  return auth;
}

export function getDb(): Firestore {
  if (!db) {
    // Lưu bộ nhớ đệm trên máy: mở app khi mạng yếu vẫn xem được, ghi xong tự đồng bộ.
    db = initializeFirestore(getApp(), {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
      ignoreUndefinedProperties: true,
    });
    if (USE_EMULATOR) connectFirestoreEmulator(db, "127.0.0.1", 8080);
  }
  return db;
}
