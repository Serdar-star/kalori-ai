"use client";

import { useRef, useState } from "react";
import { Ic, Sheet } from "@/components/ui";
import { useApp, useDerived } from "@/lib/store";

export function ShareCardButton() {
  const { t, profile, toast } = useApp();
  const d = useDerived();
  const [open, setOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  if (!profile) return null;

  const remaining = profile.dailyCalories - d.totals.calories;
  const pct = Math.min(100, Math.round((d.totals.calories / Math.max(1, profile.dailyCalories)) * 100));

  const shareText = () => {
    const text = `Kalora 🥑 · ${profile.name}\n🔥 ${d.streak.current} ${t("streak")}\n⚡ ${d.totals.calories}/${profile.dailyCalories} ${t("kcal")} (${pct}%)\n💪 P${Math.round(d.totals.protein)} · C${Math.round(d.totals.carbs)} · F${Math.round(d.totals.fat)}\n#Kalora #nutrition`;
    return text;
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareText());
      toast(t("copied"));
    } catch {
      toast(t("error_generic"), "error");
    }
  };

  const nativeShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: "Kalora", text: shareText() });
      } else {
        await copy();
      }
    } catch {
      // user cancelled
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="grid h-9 w-9 place-items-center rounded-full border border-[var(--line-strong)] bg-[var(--card)] text-[var(--muted)] transition active:scale-90"
        aria-label={t("share_title")}
      >
        <Ic name="share" size={15} strokeWidth={2.1} />
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} maxW="max-w-sm">
        <div className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-display text-[16px] font-extrabold">{t("share_title")}</p>
            <button
              onClick={() => setOpen(false)}
              className="grid h-8 w-8 place-items-center rounded-full border border-[var(--line)] text-[var(--muted)]"
              aria-label={t("close")}
            >
              <Ic name="x" size={14} />
            </button>
          </div>

          {/* story card */}
          <div
            ref={cardRef}
            className="relative overflow-hidden rounded-[24px] border p-5"
            style={{
              aspectRatio: "9/14",
              background:
                "linear-gradient(160deg, color-mix(in srgb, var(--accent) 18%, #0b0e09), #0b0e09 55%, color-mix(in srgb, var(--teal) 14%, #0b0e09))",
              borderColor: "color-mix(in srgb, var(--accent) 30%, var(--line))",
            }}
          >
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-[12px] bg-[var(--accent)] text-[var(--accent-ink)]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 21c-4.4 0-8-3.1-8-7.4C4 8.5 8 4.5 12 3c4 1.5 8 5.5 8 10.6 0 4.3-3.6 7.4-8 7.4z" />
                  <path d="M12 21v-7.5M12 13.5c0-2.5 1.8-4.3 4-4.5" />
                </svg>
              </span>
              <div>
                <p className="font-display text-[15px] font-extrabold text-white">Kalora</p>
                <p className="text-[11px] font-bold text-white/60">{profile.name}</p>
              </div>
            </div>

            <div className="mt-10 text-center">
              <p className="text-[12px] font-extrabold uppercase tracking-wide text-white/50">{t("today_eaten")}</p>
              <p className="num mt-1 font-display text-[56px] font-extrabold leading-none text-white">
                {d.totals.calories}
              </p>
              <p className="mt-1 text-[13px] font-bold text-white/55">
                / {profile.dailyCalories} {t("kcal")}
              </p>
            </div>

            <div className="mx-auto mt-6 h-2 w-full max-w-[200px] overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${pct}%`,
                  background: remaining < 0 ? "var(--coral)" : "linear-gradient(90deg, var(--accent), var(--teal))",
                }}
              />
            </div>

            <div className="mt-8 grid grid-cols-3 gap-2">
              {[
                { l: "P", v: `${Math.round(d.totals.protein)}g`, c: "var(--coral)" },
                { l: "C", v: `${Math.round(d.totals.carbs)}g`, c: "var(--amber)" },
                { l: "F", v: `${Math.round(d.totals.fat)}g`, c: "var(--teal)" },
              ].map((m) => (
                <div key={m.l} className="rounded-2xl border border-white/10 bg-white/5 py-3 text-center">
                  <p className="text-[10px] font-extrabold text-white/45">{m.l}</p>
                  <p className="num mt-0.5 text-[15px] font-extrabold text-white">{m.v}</p>
                </div>
              ))}
            </div>

            <div className="absolute inset-x-5 bottom-5 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[13px] font-extrabold text-[var(--amber)]">
                🔥 {d.streak.current}
              </span>
              <span className="text-[11px] font-bold text-white/40">kalora.app</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button onClick={() => void copy()} className="btn-ghost flex items-center justify-center gap-2 py-3 text-[13px]">
              <Ic name="copy" size={15} />
              {t("copy_summary")}
            </button>
            <button onClick={() => void nativeShare()} className="btn-accent flex items-center justify-center gap-2 py-3 text-[13px]">
              <Ic name="share" size={15} />
              {t("share_cta")}
            </button>
          </div>
        </div>
      </Sheet>
    </>
  );
}
