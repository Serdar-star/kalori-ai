"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { InstallPrompt } from "@/components/InstallPrompt";
import { LoginScreen } from "@/components/LoginScreen";
import { Onboarding } from "@/components/Onboarding";
import ScanSheet from "@/components/ScanSheet";
import { Ic, ToastHost } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useApp, useDerived } from "@/lib/store";

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-[13px] bg-[var(--accent)] shadow-[0_4px_18px_rgba(160,230,60,0.35)]">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-ink)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 21c-4.4 0-8-3.1-8-7.4C4 8.5 8 4.5 12 3c4 1.5 8 5.5 8 10.6 0 4.3-3.6 7.4-8 7.4z" />
          <path d="M12 21v-7.5M12 13.5c0-2.5 1.8-4.3 4-4.5" />
        </svg>
      </span>
      {!compact && (
        <span className="font-display text-[17px] font-extrabold tracking-tight">
          Kalora
        </span>
      )}
    </div>
  );
}

const NAV = [
  { href: "/", icon: "home", key: "nav_today" },
  { href: "/stats", icon: "chart", key: "nav_stats" },
  { href: "/coach", icon: "sparkle", key: "nav_coach" },
  { href: "/profile", icon: "user", key: "nav_profile" },
] as const;

export default function AppShell({ children }: { children: ReactNode }) {
  const { status, profile, openScan, t, refresh, updateProfile, celebrate } = useApp();
  const { streak, level } = useDerived();
  const { status: authStatus, user, realMode } = useAuth();
  const pathname = usePathname();
  const syncingUid = useRef<string | null>(null);
  const [welcome, setWelcome] = useState(false);
  const prevAuth = useRef<string | null>(null);

  // celebratory takeover right after a successful sign-in
  useEffect(() => {
    const was = prevAuth.current;
    prevAuth.current = authStatus;
    if (was === "signedOut" && authStatus === "signedIn") {
      setWelcome(true);
      celebrate(true);
      const tm = setTimeout(() => setWelcome(false), 1700);
      return () => clearTimeout(tm);
    }
  }, [authStatus, celebrate]);

  // Tie the local profile to the signed-in account (server resets data on account change)
  useEffect(() => {
    if (!user || !profile || profile.uid === user.uid) return;
    if (syncingUid.current === user.uid) return;
    syncingUid.current = user.uid;
    void updateProfile({
      uid: user.uid,
      email: user.email,
      photoUrl: user.photo ?? "",
      ...(profile.name === "Guest" ? { name: user.name } : {}),
    })
      .then(() => refresh())
      .finally(() => {
        syncingUid.current = null;
      });
  }, [user, profile, updateProfile, refresh]);

  if (authStatus === "loading" || status === "loading") {
    return (
      <div className="relative z-10 grid min-h-dvh place-items-center">
        <div className="flex flex-col items-center gap-4">
          <SplashLogo />
          <p className="text-[12px] font-bold text-[var(--muted)]">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (realMode && (authStatus === "signedOut" || !user)) {
    return (
      <>
        <ToastHost />
        <LoginScreen />
      </>
    );
  }

  // Demo mode always has a user; if somehow missing, recover instantly
  if (!user) {
    return (
      <>
        <ToastHost />
        <LoginScreen />
      </>
    );
  }

  if (status === "error" || !profile) {
    return (
      <div className="relative z-10 grid min-h-dvh place-items-center px-6">
        <div className="card w-full max-w-sm p-6 text-center">
          <p className="text-[30px]">🥲</p>
          <p className="mt-2 text-[14px] font-bold">{t("error_generic")}</p>
          <button onClick={() => void refresh()} className="btn-accent mt-4 px-6 py-2.5 text-[13px]">
            ↻
          </button>
          <button
            onClick={() => {
              try {
                localStorage.removeItem("kalora_demo_user");
              } catch {
                /* ignore */
              }
              window.location.reload();
            }}
            className="btn-ghost mt-2 w-full py-2.5 text-[13px]"
          >
            Reset session
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <ToastHost />
      <ScanSheet />

      {/* sign-in welcome takeover */}
      <AnimatePresence>
        {welcome && (
          <motion.div
            className="fixed inset-0 z-[96] grid place-items-center bg-[var(--bg)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex flex-col items-center gap-5">
              <motion.span
                initial={{ scale: 0.2, rotate: -40 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 240, damping: 15 }}
                className="grid h-[92px] w-[92px] place-items-center rounded-[28px] bg-[var(--accent)] shadow-[0_20px_70px_rgba(160,230,60,0.5)]"
              >
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent-ink)" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 21c-4.4 0-8-3.1-8-7.4C4 8.5 8 4.5 12 3c4 1.5 8 5.5 8 10.6 0 4.3-3.6 7.4-8 7.4z" />
                  <path d="M12 21v-7.5M12 13.5c0-2.5 1.8-4.3 4-4.5" />
                </svg>
              </motion.span>
              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, type: "spring", stiffness: 200, damping: 20 }}
                className="font-display text-[24px] font-extrabold tracking-tight"
              >
                Kalora
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!profile.onboarded && <Onboarding />}

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-[1060px]">
        {/* -------- desktop sidebar -------- */}
        <aside className="sticky top-0 hidden h-dvh w-[228px] shrink-0 flex-col justify-between p-5 md:flex">
          <div>
            <Logo />
            <nav className="mt-8 space-y-1.5">
              {NAV.map((n) => {
                const active = pathname === n.href;
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    className={`flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-[13.5px] font-bold transition ${
                      active
                        ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                        : "text-[var(--muted)] hover:bg-[var(--card)] hover:text-[var(--ink)]"
                    }`}
                  >
                    <Ic name={n.icon} size={18} strokeWidth={2.1} />
                    {t(n.key)}
                  </Link>
                );
              })}
              <button
                onClick={() => openScan()}
                className="btn-accent mt-3 flex w-full items-center justify-center gap-2 py-3 text-[13.5px]"
              >
                <Ic name="camera" size={17} strokeWidth={2.3} />
                {t("scan_now")}
              </button>
            </nav>
          </div>

          <div className="space-y-3">
            <div className="card-flat p-3.5">
              <div className="flex items-center gap-2.5">
                <Ic name="flame" size={19} strokeWidth={2.2} className="text-[var(--amber)]" />
                <div>
                  <p className="num text-[17px] font-extrabold leading-none">{streak.current}</p>
                  <p className="text-[11px] font-bold text-[var(--muted)]">{t("streak")}</p>
                </div>
                <div className="ms-auto text-end">
                  <p className="num text-[17px] font-extrabold leading-none">{level.level}</p>
                  <p className="text-[11px] font-bold text-[var(--muted)]">{t("level")}</p>
                </div>
              </div>
              <div className="track mt-3 h-[6px]">
                <div
                  className="h-full rounded-full bg-[var(--accent)] transition-all duration-500"
                  style={{ width: `${level.pct}%` }}
                />
              </div>
            </div>
            <div className="card-flat flex w-full items-center gap-2.5 p-3.5 text-start">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--teal-soft)] text-[var(--teal)]">
                <Ic name="check" size={16} strokeWidth={2.4} />
              </span>
              <div className="min-w-0">
                <p className="text-[12.5px] font-extrabold">{t("scan_free_badge").split("·")[0]?.trim() || "Free"}</p>
                <p className="truncate text-[11px] font-semibold text-[var(--muted)]">USDA · Offline</p>
              </div>
            </div>
          </div>
        </aside>

        {/* -------- main column -------- */}
        <main className="min-w-0 flex-1 pb-32 md:pb-12">
          <div className="safe-top mx-auto w-full max-w-[600px] px-4 pt-5 md:px-6 md:pt-8 xl:max-w-[720px]">
            {children}
          </div>
        </main>
      </div>

      <InstallPrompt />

      {/* -------- mobile bottom nav -------- */}
      <nav className="fixed inset-x-3 z-40 md:hidden" style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}>
        <div className="bottom-nav-bar card flex items-center justify-between px-3 py-2.5 !rounded-[26px]">
          {NAV.slice(0, 2).map((n) => (
            <MobileTab key={n.href} href={n.href} icon={n.icon} label={t(n.key)} active={pathname === n.href} />
          ))}
          <button
            onClick={() => openScan()}
            aria-label={t("scan_now")}
            className="nav-fab relative -mt-8 grid h-[58px] w-[58px] place-items-center rounded-full bg-[var(--accent)] text-[var(--accent-ink)] shadow-[0_10px_28px_rgba(160,230,60,0.4)] transition active:scale-90"
          >
            <Ic name="camera" size={25} strokeWidth={2.2} />
            <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-[var(--accent)] opacity-20" style={{ animationDuration: "2.6s" }} />
          </button>
          {NAV.slice(2).map((n) => (
            <MobileTab key={n.href} href={n.href} icon={n.icon} label={t(n.key)} active={pathname === n.href} />
          ))}
        </div>
      </nav>
    </>
  );
}

function MobileTab({ href, icon, label, active }: { href: string; icon: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`flex w-[52px] flex-col items-center gap-1 rounded-2xl py-1 transition ${
        active ? "text-[var(--accent-strong)]" : "text-[var(--faint)]"
      }`}
    >
      <Ic name={icon} size={21} strokeWidth={active ? 2.3 : 1.9} />
      <span className="text-[9.5px] font-extrabold">{label}</span>
    </Link>
  );
}

function SplashLogo() {
  return (
    <div className="pop grid h-14 w-14 place-items-center rounded-[18px] bg-[var(--accent)] shadow-[0_8px_30px_rgba(160,230,60,0.4)]">
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--accent-ink)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 21c-4.4 0-8-3.1-8-7.4C4 8.5 8 4.5 12 3c4 1.5 8 5.5 8 10.6 0 4.3-3.6 7.4-8 7.4z" />
        <path d="M12 21v-7.5M12 13.5c0-2.5 1.8-4.3 4-4.5" />
      </svg>
    </div>
  );
}
