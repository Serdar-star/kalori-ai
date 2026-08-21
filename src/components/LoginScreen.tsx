"use client";

import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useState, type ReactNode } from "react";
import { Ic } from "@/components/ui";
import { useApp } from "@/lib/store";
import { useAuth } from "@/lib/auth";

/* ---------- brand marks ---------- */

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.97 10.71A5.41 5.41 0 0 1 3.68 9c0-.6.1-1.17.28-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.04l3.01-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg width="16" height="19" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

function GmailMark() {
  return (
    <svg width="17" height="14" viewBox="0 0 24 18" fill="none" aria-hidden>
      <rect x="1.6" y="1.6" width="20.8" height="14.8" rx="3.2" stroke="#EA4335" strokeWidth="2.1" />
      <path d="m3.4 4 8.6 6.6L20.6 4" stroke="#EA4335" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Spinner() {
  return (
    <motion.span
      className="inline-block h-4 w-4 rounded-full border-2 border-current border-t-transparent"
      animate={{ rotate: 360 }}
      transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
    />
  );
}

/* ---------- ambient scene ---------- */

const BUBBLES = [
  { left: "5%", dur: 17, delay: 0, size: 26, c: "var(--accent)" },
  { left: "15%", dur: 21, delay: 4, size: 38, c: "var(--teal)" },
  { left: "28%", dur: 19, delay: 9, size: 22, c: "var(--amber)" },
  { left: "44%", dur: 23, delay: 2, size: 30, c: "var(--coral)" },
  { left: "60%", dur: 18, delay: 7, size: 24, c: "var(--teal)" },
  { left: "74%", dur: 22, delay: 12, size: 34, c: "var(--accent)" },
  { left: "86%", dur: 20, delay: 5, size: 20, c: "var(--amber)" },
  { left: "94%", dur: 24, delay: 15, size: 26, c: "var(--coral)" },
];

function Scene() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="orb-a absolute -left-28 top-6 h-80 w-80 rounded-full blur-3xl" style={{ background: "var(--glow-a)" }} />
      <div className="orb-b absolute -right-24 bottom-10 h-96 w-96 rounded-full blur-3xl" style={{ background: "var(--glow-b)" }} />
      {BUBBLES.map((b, i) => (
        <span
          key={i}
          className="bubble rounded-full"
          style={{
            left: b.left,
            width: b.size,
            height: b.size,
            background: b.c,
            filter: "blur(6px)",
            animationDuration: `${b.dur}s`,
            animationDelay: `${b.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ---------- shared pieces ---------- */

function ProviderButton({
  onClick,
  disabled,
  className,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  className: string;
  children: ReactNode;
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={`flex w-full items-center justify-center gap-3 rounded-2xl py-[13px] text-[13.5px] font-extrabold shadow-md disabled:opacity-60 ${className}`}
    >
      {children}
    </motion.button>
  );
}

/* ---------- main ---------- */

export function LoginScreen() {
  const { t } = useApp();
  const { signIn, signInEmail, signInDemo, busy, realMode } = useAuth();
  const [mode, setMode] = useState<"in" | "up">("up");
  const [gmailOpen, setGmailOpen] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [formErr, setFormErr] = useState(false);
  const [shake, setShake] = useState(0);
  const [error, setError] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  // gentle parallax (no preserve-3d, no nesting risks)
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const px = useSpring(useTransform(mx, [0, 1], [7, -7]), { stiffness: 90, damping: 16 });
  const py = useSpring(useTransform(my, [0, 1], [6, -6]), { stiffness: 90, damping: 16 });

  const go = async (provider: "google" | "apple") => {
    setError(false);
    setErrorCode(null);
    try {
      await signIn(provider);
    } catch (err) {
      setError(true);
      const code = (err as { code?: string })?.code;
      setErrorCode(typeof code === "string" ? code : null);
    }
  };

  const submitEmail = async () => {
    const clean = email.trim();
    if (!/.+@.+\..+/.test(clean) || password.length < 6) {
      setFormErr(true);
      setShake((s) => s + 1);
      return;
    }
    setFormErr(false);
    setError(false);
    setErrorCode(null);
    try {
      await signInEmail(clean, password, mode);
    } catch (err) {
      setError(true);
      const code = (err as { code?: string })?.code;
      setErrorCode(typeof code === "string" ? code : null);
    }
  };

  const errorMessage = () => {
    if (!errorCode) return t("login_err_help");
    if (errorCode.includes("popup-closed") || errorCode.includes("popup-blocked") || errorCode.includes("cancelled")) return t("login_err_popup");
    if (errorCode.includes("operation-not-allowed")) return t("login_err_provider");
    if (errorCode.includes("email-already")) return t("login_err_exists");
    if (errorCode.includes("invalid-credential") || errorCode.includes("wrong-password") || errorCode.includes("user-not-found")) return t("login_err_badcred");
    return t("login_err_help");
  };

  const stagger = {
    hidden: { opacity: 0, y: 22 },
    show: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: 0.08 * i, type: "spring" as const, stiffness: 220, damping: 24 },
    }),
  };

  return (
    <div
      className="relative z-10 grid min-h-dvh place-items-center overflow-hidden px-5 py-10"
      onMouseMove={(e) => {
        mx.set(e.clientX / window.innerWidth);
        my.set(e.clientY / window.innerHeight);
      }}
    >
      <Scene />

      <div className="relative w-full max-w-[400px]">
        {/* ---------- brand ---------- */}
        <motion.div variants={stagger} initial="hidden" animate="show" custom={0} className="flex flex-col items-center text-center">
          <motion.div style={{ x: px, y: py }} className="relative">
            <div className="relative grid h-[86px] w-[86px] place-items-center">
              <span className="halo" />
              <span className="absolute inset-0 rounded-[26px] bg-[var(--accent)] shadow-[0_18px_60px_rgba(160,230,60,0.45)]" />
              <motion.span
                className="relative"
                animate={{ rotate: [0, -3, 3, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              >
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--accent-ink)" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 21c-4.4 0-8-3.1-8-7.4C4 8.5 8 4.5 12 3c4 1.5 8 5.5 8 10.6 0 4.3-3.6 7.4-8 7.4z" />
                  <path d="M12 21v-7.5M12 13.5c0-2.5 1.8-4.3 4-4.5" />
                </svg>
              </motion.span>
            </div>
          </motion.div>

          <h1 className="mt-5 font-display text-[30px] font-extrabold tracking-tight">Kalora</h1>
          <p className="mt-1 text-[13px] font-semibold text-[var(--muted)]">{t("onb_sub")}</p>
        </motion.div>

        {/* ---------- panel ---------- */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          custom={1}
          className="card mt-7 overflow-hidden"
        >
          <div className="p-6">
            {/* mode switch */}
            <div className="relative grid grid-cols-2 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-1">
              {(["in", "up"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`relative z-10 rounded-xl py-2.5 text-[13px] font-extrabold transition-colors ${
                    mode === m ? "text-[var(--accent-ink)]" : "text-[var(--muted)] hover:text-[var(--ink)]"
                  }`}
                >
                  {mode === m && (
                    <motion.span
                      layoutId="loginModeThumb"
                      className="absolute inset-0 rounded-xl bg-[var(--accent)] shadow-[0_4px_18px_var(--accent-soft)]"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span className="relative z-10">{m === "in" ? t("login_mode_in") : t("login_mode_up")}</span>
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.h2
                key={mode}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.16 }}
                className="mt-5 text-center font-display text-[18px] font-extrabold tracking-tight"
              >
                {mode === "in" ? t("login_title_in") : t("login_title_up")}
              </motion.h2>
            </AnimatePresence>

            {/* social providers */}
            <div className="mt-5 space-y-2.5">
              <ProviderButton onClick={() => void go("google")} disabled={busy} className="bg-white text-[#1f1f1f]">
                {busy ? <Spinner /> : <GoogleMark />}
                {t("continue_google")}
              </ProviderButton>

              <ProviderButton onClick={() => void go("apple")} disabled={busy} className="bg-black text-white">
                {busy ? <Spinner /> : <AppleMark />}
                {t("continue_apple")}
              </ProviderButton>
            </div>

            {/* divider */}
            <div className="my-4 flex items-center gap-3">
              <span className="h-px flex-1 bg-[var(--line)]" />
              <span className="text-[10.5px] font-extrabold uppercase tracking-wide text-[var(--faint)]">
                {t("login_divider")}
              </span>
              <span className="h-px flex-1 bg-[var(--line)]" />
            </div>

            {/* gmail toggle */}
            <ProviderButton
              onClick={() => {
                setGmailOpen((v) => !v);
                setFormErr(false);
              }}
              disabled={busy}
              className="border border-[var(--line-strong)] bg-[var(--card2)] text-[var(--ink)]"
            >
              <span className="grid h-6 w-6 place-items-center rounded-lg bg-white shadow-sm">
                <GmailMark />
              </span>
              {t("continue_gmail")}
              <motion.span animate={{ rotate: gmailOpen ? 180 : 0 }} className="ms-0.5 text-[var(--faint)]">
                <Ic name="chev" size={14} strokeWidth={2.6} className="rotate-90" />
              </motion.span>
            </ProviderButton>

            {/* gmail form */}
            <AnimatePresence initial={false}>
              {gmailOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 30 }}
                  className="overflow-hidden"
                >
                  <motion.div
                    key={shake}
                    animate={formErr ? { x: [0, -9, 9, -6, 6, 0] } : { x: 0 }}
                    transition={{ duration: 0.45 }}
                    className="mt-3 space-y-2.5 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4"
                  >
                    <div className="relative">
                      <Ic name="mail" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--faint)]" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setFormErr(false);
                        }}
                        placeholder="ornek@gmail.com"
                        className="input w-full py-3 pl-10 pr-4 text-[13.5px] font-semibold"
                        autoFocus
                      />
                    </div>
                    <div className="relative">
                      <Ic name="lock2" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--faint)]" />
                      <input
                        type={showPw ? "text" : "password"}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setFormErr(false);
                        }}
                        onKeyDown={(e) => e.key === "Enter" && void submitEmail()}
                        placeholder={`${t("gmail_password")} · min. 6`}
                        className="input w-full py-3 pl-10 pr-11 text-[13.5px] font-semibold"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((v) => !v)}
                        aria-label={showPw ? t("close") : t("gmail_password")}
                        className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-[var(--faint)] transition hover:text-[var(--ink)]"
                      >
                        <Ic name={showPw ? "eyeoff" : "eye"} size={16} />
                      </button>
                    </div>

                    {formErr && (
                      <p className="flex items-center gap-1.5 text-[11.5px] font-bold text-[var(--coral)]">
                        <Ic name="x" size={11} strokeWidth={2.8} />
                        {t("login_err_form")}
                      </p>
                    )}

                    <motion.button
                      onClick={() => void submitEmail()}
                      disabled={busy}
                      whileTap={{ scale: 0.97 }}
                      className="btn-accent group flex w-full items-center justify-center gap-2 py-3 text-[13.5px]"
                    >
                      {busy ? t("loading") : mode === "in" ? t("login_mode_in") : t("login_mode_up")}
                      <motion.span className="transition group-hover:translate-x-0.5 rtl:-scale-x-100">
                        <Ic name="chev" size={15} strokeWidth={2.8} />
                      </motion.span>
                    </motion.button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* error banner */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 rounded-2xl border border-[var(--coral)]/30 bg-[var(--coral-soft)] px-4 py-3">
                    <p className="flex items-center gap-2 text-[12px] font-extrabold text-[var(--coral)]">
                      <Ic name="x" size={13} strokeWidth={2.8} />
                      {t("error_generic")}
                    </p>
                    <p className="mt-1.5 text-[11px] font-semibold leading-relaxed text-[var(--muted)]">{errorMessage()}</p>
                    {errorCode && (
                      <p className="mt-1.5 inline-block rounded-lg bg-black/20 px-2 py-0.5 font-mono text-[10px] font-bold text-[var(--faint)]">
                        {errorCode}
                      </p>
                    )}
                    <button onClick={() => signInDemo()} className="btn-ghost mt-2.5 w-full py-2 text-[12px]">
                      🧪 {t("login_demo_enter")}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <p className="mt-4 text-center text-[10.5px] font-semibold leading-relaxed text-[var(--faint)]">
              {t("login_auto_note")}
            </p>
          </div>
        </motion.div>

        {/* trust chips */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          custom={2}
          className="mt-5 flex justify-center gap-2"
        >
          {[
            { icon: "camera", label: t("scan_now") },
            { icon: "sparkle", label: t("coach_title") },
            { icon: "globe", label: "15" },
          ].map((c) => (
            <span
              key={c.label}
              className="flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--card)] px-3 py-1.5 text-[10.5px] font-extrabold text-[var(--muted)]"
            >
              <Ic name={c.icon} size={12} strokeWidth={2.4} className="text-[var(--accent)]" />
              {c.label}
            </span>
          ))}
        </motion.div>

        {!realMode && (
          <motion.div variants={stagger} initial="hidden" animate="show" custom={3} className="mt-4 flex justify-center">
            <span className="flex items-center gap-2 rounded-full border border-[var(--amber)]/30 bg-[var(--amber-soft)] px-4 py-2">
              <span className="text-[12px]">🧪</span>
              <span className="text-[10.5px] font-bold text-[var(--amber)]">{t("login_demo_note")}</span>
            </span>
          </motion.div>
        )}
      </div>
    </div>
  );
}
