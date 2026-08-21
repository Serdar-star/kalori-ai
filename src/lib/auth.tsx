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
 * Preview / sandbox always uses demo auth so the UI never hangs on OAuth.
 */
const forceDemo =
  (process.env.NEXT_PUBLIC_AUTH_MODE ?? "").toLowerCase() === "demo" || !firebaseEnabled;

export const realMode = firebaseEnabled && !forceDemo;

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

const DEFAULT_DEMO: AuthUser = {
  uid: "demo-google",
  name: "Serdar",
  email: "demo@kalora.app",
  photo: null,
  provider: "google",
};

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

function writeDemoUser(user: AuthUser) {
  try {
    localStorage.setItem(DEMO_KEY, JSON.stringify(user));
  } catch {
    // storage unavailable (private mode / iframe) — keep in memory only
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Demo/preview: start already signed-in so the splash never hangs on first paint
  const [status, setStatus] = useState<AuthStatus>(realMode ? "loading" : "signedIn");
  const [user, setUser] = useState<AuthUser | null>(realMode ? null : DEFAULT_DEMO);
  const [busy, setBusy] = useState(false);
  const started = useRef(false);

  const applyDemoUser = useCallback((provider: "google" | "apple" | "email" = "google", override?: Partial<AuthUser>) => {
    const demo: AuthUser = {
      ...DEFAULT_DEMO,
      provider: provider === "email" ? "email" : provider,
      ...override,
      uid: override?.uid ?? (provider === "apple" ? "demo-apple" : provider === "email" ? "demo-email" : "demo-google"),
    };
    writeDemoUser(demo);
    setUser(demo);
    setStatus("signedIn");
  }, []);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    // Never leave the splash forever — hard fallback after 1.2s
    const failSafe = window.setTimeout(() => {
      setStatus((s) => {
        if (s !== "loading") return s;
        // Auto-enter demo so the app is usable immediately in preview
        const existing = readDemoUser() ?? DEFAULT_DEMO;
        writeDemoUser(existing);
        setUser(existing);
        return "signedIn";
      });
    }, 1200);

    if (realMode) {
      try {
        const unsub = firebaseOnAuthChanged((fu) => {
          window.clearTimeout(failSafe);
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
        return () => {
          window.clearTimeout(failSafe);
          unsub();
        };
      } catch {
        window.clearTimeout(failSafe);
        applyDemoUser("google");
        return () => undefined;
      }
    }

    // Demo mode: restore session or auto-enter so preview is never stuck
    try {
      const demo = readDemoUser() ?? DEFAULT_DEMO;
      writeDemoUser(demo);
      setUser(demo);
      setStatus("signedIn");
    } catch {
      applyDemoUser("google");
    }
    window.clearTimeout(failSafe);
    return () => window.clearTimeout(failSafe);
  }, [applyDemoUser]);

  const signIn = useCallback(
    async (provider: "google" | "apple") => {
      setBusy(true);
      try {
        if (realMode) {
          await firebaseSignIn(provider);
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
        } else {
          const clean = email.trim().toLowerCase();
          const raw = clean.split("@")[0].replace(/[._-]+/g, " ").trim() || "Kalora User";
          const name = raw.charAt(0).toUpperCase() + raw.slice(1);
          applyDemoUser("email", { uid: `mail-${clean}`, name, email: clean });
        }
      } finally {
        setBusy(false);
      }
    },
    [applyDemoUser]
  );

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
    // In demo preview, signing out still leaves a guest so UI stays usable
    if (!realMode) {
      applyDemoUser("google", { name: "Guest", email: "guest@kalora.app", uid: "demo-guest" });
      return;
    }
    setUser(null);
    setStatus("signedOut");
  }, [applyDemoUser]);

  return (
    <Ctx.Provider
      value={{ status, user, firebaseEnabled, realMode, busy, signIn, signInEmail, signInDemo, signOutUser }}
    >
      {children}
    </Ctx.Provider>
  );
}
