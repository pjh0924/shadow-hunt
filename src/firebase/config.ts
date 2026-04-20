/**
 * firebase/config.ts
 * --------------------------------------------------------------
 * Firebase 연결 설정.
 *
 * **config 가 없으면 런타임 safe no-op.**
 *   - `.env.local` 에 `VITE_FIREBASE_API_KEY` 가 있으면 실 연결 시도
 *   - 없으면 `firebaseApp` / `db` 가 null → FirestoreRemoteGhostSource
 *     내부에서 null 체크 → NoopRemoteGhostSource 로 폴백
 *
 * 사용자가 할 일: `.env.local` 에 아래 키를 채움
 *   VITE_FIREBASE_API_KEY=AIza...
 *   VITE_FIREBASE_AUTH_DOMAIN=YOUR.firebaseapp.com
 *   VITE_FIREBASE_PROJECT_ID=YOUR
 *   VITE_FIREBASE_STORAGE_BUCKET=YOUR.appspot.com
 *   VITE_FIREBASE_MESSAGING_SENDER_ID=...
 *   VITE_FIREBASE_APP_ID=...
 */
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as
    | string
    | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as
    | string
    | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
};

export const firebaseEnabled = Boolean(cfg.apiKey && cfg.projectId);

export let firebaseApp: FirebaseApp | null = null;
export let db: Firestore | null = null;

if (firebaseEnabled) {
  try {
    firebaseApp = initializeApp({
      apiKey: cfg.apiKey!,
      authDomain: cfg.authDomain,
      projectId: cfg.projectId!,
      storageBucket: cfg.storageBucket,
      messagingSenderId: cfg.messagingSenderId,
      appId: cfg.appId,
    });
    db = getFirestore(firebaseApp);
    console.info('[firebase] connected:', cfg.projectId);
  } catch (e) {
    console.warn('[firebase] init failed — fallback to noop:', e);
    firebaseApp = null;
    db = null;
  }
} else if (import.meta.env.DEV) {
  console.info(
    '[firebase] disabled (env vars missing) — using NoopRemoteGhostSource'
  );
}
