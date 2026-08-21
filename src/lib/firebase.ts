import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  GoogleAuthProvider,
  OAuthProvider,
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type Auth,
  type User,
} from "firebase/auth";

/**
 * Firebase Auth (client SDK). The NEXT_PUBLIC keys are safe to expose —
 * security is enforced by Firebase project settings + authorized domains.
 *
 * When keys are missing the app runs in demo mode (simulated sign-in),
 * so the preview stays fully usable until a real project is connected.
 */

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseEnabled = Boolean(config.apiKey && config.projectId && config.appId);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

if (firebaseEnabled) {
  app = getApps()[0] ?? initializeApp(config);
  auth = getAuth(app);
}

export function firebaseSignIn(provider: "google" | "apple"): Promise<User> {
  if (!auth) return Promise.reject(new Error("firebase not configured"));
  const p = provider === "google" ? new GoogleAuthProvider() : new OAuthProvider("apple.com");
  return signInWithPopup(auth, p).then((res) => res.user);
}

export function firebaseSignOut(): Promise<void> {
  if (!auth) return Promise.resolve();
  return signOut(auth);
}

export async function firebaseEmailSignIn(email: string, password: string, mode: "in" | "up"): Promise<User> {
  if (!auth) throw new Error("firebase not configured");
  const cred =
    mode === "up"
      ? await createUserWithEmailAndPassword(auth, email, password)
      : await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export function firebaseOnAuthChanged(cb: (user: User | null) => void): () => void {
  if (!auth) {
    cb(null);
    return () => undefined;
  }
  return onAuthStateChanged(auth, cb);
}
