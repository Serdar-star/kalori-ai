"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Ic } from "@/components/ui";
import { useApp } from "@/lib/store";
import { detectPlatform } from "@/lib/utils";

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "kalora_install_dismissed";

export function InstallPrompt() {
  const { t } = useApp();
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISS_KEY)) return;
    } catch {
      // storage blocked
    }
    const standalone =
      (typeof window !== "undefined" && window.matchMedia("(display-mode: standalone)").matches) ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) return;

    if (detectPlatform() === "ios") {
      setIsIos(true);
      setVisible(true);
      return;
    }
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore
    }
  };

  const install = async () => {
    if (deferred) {
      await deferred.prompt();
      dismiss();
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="fixed inset-x-4 z-50 mx-auto max-w-[400px] md:inset-x-auto md:end-5"
          style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 104px)" }}
        >
          <div className="card flex items-start gap-3 p-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[var(--accent)] shadow-[0_6px_20px_var(--accent-soft)]">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent-ink)" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 21c-4.4 0-8-3.1-8-7.4C4 8.5 8 4.5 12 3c4 1.5 8 5.5 8 10.6 0 4.3-3.6 7.4-8 7.4z" />
                <path d="M12 21v-7.5M12 13.5c0-2.5 1.8-4.3 4-4.5" />
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-extrabold">{t("install_title")}</p>
              <p className="mt-1 text-[12px] font-semibold leading-relaxed text-[var(--muted)]">
                {isIos ? t("install_ios_text") : t("install_text")}
              </p>
              <div className="mt-3 flex gap-2">
                {!isIos && (
                  <button onClick={() => void install()} className="btn-accent flex items-center gap-1.5 px-4 py-2 text-[12px]">
                    <Ic name="download" size={13} strokeWidth={2.4} />
                    {t("install_cta")}
                  </button>
                )}
                <button onClick={dismiss} className={`btn-ghost px-4 py-2 text-[12px] ${isIos ? "" : "opacity-80"}`}>
                  {isIos ? t("close") : t("install_later")}
                </button>
              </div>
            </div>
            <button onClick={dismiss} className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[var(--faint)] transition hover:text-[var(--ink)]" aria-label={t("close")}>
              <Ic name="x" size={13} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
