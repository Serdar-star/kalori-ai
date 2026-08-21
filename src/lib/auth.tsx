"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  firebaseEmailSignIn,
  firebaseEnabled,
  firebaseOnAuthChanged,
  firebaseSignIn,
  firebaseSignOut,
} from "@/lib/firebase";

export interface AuthUser {
  uid: string;
  name: string;
  email: string;
  photo: string | null;
  provider: "google" | "apple" | "email";
}

/**
 * realMode = Firebase is fully live.
 * While NEXT_PUBLIC_AUTH_MODE is "demo", every button signs in instantly
 * (simulated account) so the flow is frictionless; switch to "firebase"
 * at launch and the same code talks to the real backend.
 */
export const realMode =
  firebaseEnabled && (process.env.NEXT_PUBLIC_AUTH_MODE ?? "firebase") !== "demo";

type AuthStatus = "loading" | "signedIn" | "signedOut";

interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  firebaseEnabled: boolean;
  realMode: boolean;
  busy: boolean;
  signIn: (provider: "google" | "apple") => Promise<void>;
  signInEmail: (email: string, password: string, mode: "in" | "up") => Promise<void>;
  signInDemo: () => void;
  signOutUser: () => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}

const DEMO_KEY = "kalora_demo_user";

function readDemoUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(DEMO_KEY);
    if (!raw) return null;
    const u = JSON.parse(raw) as AuthUser;
    return u && u.uid ? u : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [busy, setBusy] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    if (realMode) {
      const unsub = firebaseOnAuthChanged((fu) => {
        if (fu) {
          const providerApple = fu.providerData.some((p) => p.providerId === "apple.com");
          setUser({
            uid: fu.uid,
            name: fu.displayName ?? "Kalora User",
            email: fu.email ?? "",
            photo: fu.photoURL ?? null,
            provider: providerApple ? "apple" : "google",
          });
          setStatus("signedIn");
        } else {
          setUser(null);
          setStatus("signedOut");
        }
      });
      return unsub;
    }

    const demo = readDemoUser();
    setUser(demo);
    setStatus(demo ? "signedIn" : "signedOut");
  }, []);

  const applyDemoUser = useCallback((provider: "google" | "apple") => {
    const demo: AuthUser =
      provider === "google"
        ? { uid: "demo-google", name: "Demo User", email: "demo@gmail.com", photo: null, provider }
        : { uid: "demo-apple", name: "Demo User", email: "demo@icloud.com", photo: null, provider };
    try {
      localStorage.setItem(DEMO_KEY, JSON.stringify(demo));
    } catch {
      // storage unavailable
    }
    setUser(demo);
    setStatus("signedIn");
  }, []);

  const signIn = useCallback(
    async (provider: "google" | "apple") => {
      setBusy(true);
      try {
        if (realMode) {
          await firebaseSignIn(provider);
          // state arrives via onAuthStateChanged
        } else {
          applyDemoUser(provider);
        }
      } finally {
        setBusy(false);
      }
    },
    [applyDemoUser]
  );

  const signInEmail = useCallback(
    async (email: string, password: string, mode: "in" | "up") => {
      setBusy(true);
      try {
        if (realMode) {
          await firebaseEmailSignIn(email, password, mode);
          // state arrives via onAuthStateChanged
        } else {
          const clean = email.trim().toLowerCase();
          const raw = clean.split("@")[0].replace(/[._-]+/g, " ").trim() || "Kalora User";
          const name = raw.charAt(0).toUpperCase() + raw.slice(1);
          const demo: AuthUser = {
            uid: `mail-${clean}`,
            name,
            email: clean,
            photo: null,
            provider: "email",
          };
          try {
            localStorage.setItem(DEMO_KEY, JSON.stringify(demo));
          } catch {
            // storage unavailable
          }
          setUser(demo);
          setStatus("signedIn");
        }
      } finally {
        setBusy(false);
      }
    },
    []
  );

  // Escape hatch: enter the app without Firebase (preview / blocked popups)
  const signInDemo = useCallback(() => applyDemoUser("google"), [applyDemoUser]);

  const signOutUser = useCallback(async () => {
    try {
      await firebaseSignOut();
    } catch {
      // ignore
    }
    try {
      localStorage.removeItem(DEMO_KEY);
    } catch {
      // ignore
    }
    setUser(null);
    setStatus("signedOut");
  }, []);

  return (
    <Ctx.Provider
      value={{ status, user, firebaseEnabled, realMode, busy, signIn, signInEmail, signInDemo, signOutUser }}
    >
      {children}
    </Ctx.Provider>
  );
}
