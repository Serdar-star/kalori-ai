"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Ic, Sheet } from "@/components/ui";
import { useApp } from "@/lib/store";

export const PLANS = [
  { id: "monthly", monthly: 9.99, billed: 9.99, save: 0, trial: false },
  { id: "six", monthly: 6.99, billed: 41.94, save: 30, trial: false },
  { id: "yearly", monthly: 4.17, billed: 49.99, save: 58, trial: true },
] as const;

export type PlanId = (typeof PLANS)[number]["id"];

const FEATURES = ["pay_f1", "pay_f2", "pay_f3", "pay_f4"] as const;

export function Paywall({
  open,
  onClose,
  limitReason = false,
}: {
  open: boolean;
  onClose: () => void;
  limitReason?: boolean;
}) {
  const { t, updateProfile, toast, celebrate } = useApp();
  const [selected, setSelected] = useState<PlanId>("yearly");
  const [busy, setBusy] = useState(false);

  const plan = PLANS.find((p) => p.id === selected) ?? PLANS[2];

  const subscribe = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await updateProfile({ pro: true, plan: selected });
      onClose();
      celebrate(true);
      toast(t("toast_pro"));
    } catch {
      toast(t("error_generic"), "error");
    } finally {
      setBusy(false);
    }
  };

  const money = (n: number) => `$${n.toFixed(2)}`;

  return (
    <Sheet open={open} onClose={onClose} maxW="max-w-md">
      <div className="p-5 pb-6">
        {/* header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--amber-soft)] text-[var(--amber)] shadow-[0_0_30px_var(--amber-soft)]">
              <Ic name="crown" size={23} strokeWidth={2} />
            </span>
            <div>
              <h3 className="font-display text-[19px] font-extrabold tracking-tight">{t("pro_title")}</h3>
              <p className="text-[11.5px] font-semibold text-[var(--muted)]">{t("pay_sub")}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full border border-[var(--line)] text-[var(--muted)]"
            aria-label={t("close")}
          >
            <Ic name="x" size={15} />
          </button>
        </div>

        {limitReason && (
          <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-[var(--amber)]/40 bg-[var(--amber-soft)] px-4 py-3">
            <Ic name="lock" size={15} className="mt-0.5 shrink-0 text-[var(--amber)]" strokeWidth={2.2} />
            <div>
              <p className="text-[12.5px] font-extrabold text-[var(--amber)]">{t("limit_title")}</p>
              <p className="mt-0.5 text-[11.5px] font-semibold leading-relaxed text-[var(--muted)]">{t("limit_text")}</p>
            </div>
          </div>
        )}

        {/* features */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className="flex items-start gap-2 rounded-2xl border border-[var(--line)] bg-[var(--card)] px-3 py-2.5"
            >
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[var(--accent-soft)] text-[var(--accent-strong)]">
                <Ic name="check" size={11} strokeWidth={3} />
              </span>
              <span className="text-[11.5px] font-bold leading-snug">{t(f)}</span>
            </motion.div>
          ))}
        </div>

        {/* plans */}
        <div className="mt-4 space-y-2.5">
          {PLANS.map((p) => {
            const active = selected === p.id;
            const nameKey = p.id === "monthly" ? "pay_monthly" : p.id === "six" ? "pay_6m" : "pay_yearly";
            return (
              <button
                key={p.id}
                onClick={() => setSelected(p.id)}
                className={`relative w-full rounded-2xl border p-4 text-start transition active:scale-[0.99] ${
                  active ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--line)] bg-[var(--card)]"
                }`}
                style={
                  p.id === "yearly"
                    ? { boxShadow: active ? undefined : "0 4px 24px var(--accent-soft)" }
                    : undefined
                }
              >
                {p.id === "yearly" && (
                  <span className="absolute -top-2.5 end-4 rounded-full bg-[var(--accent)] px-2.5 py-0.5 text-[9.5px] font-extrabold text-[var(--accent-ink)] shadow">
                    {t("pay_best")}
                  </span>
                )}
                <div className="flex items-center gap-3">
                  <span
                    className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition ${
                      active ? "border-[var(--accent)]" : "border-[var(--line-strong)]"
                    }`}
                  >
                    {active && <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-[14px] font-extrabold">
                      {t(nameKey)}
                      {p.save > 0 && (
                        <span className="rounded-full bg-[var(--teal-soft)] px-2 py-0.5 text-[9.5px] font-extrabold text-[var(--teal)]">
                          {t("pay_save", { pct: p.save })}
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-[11px] font-semibold text-[var(--muted)]">
                      {t("pay_billed", { price: money(p.billed) })}
                      {p.trial ? ` · ${t("pay_trial")}` : ""}
                    </p>
                  </div>
                  <div className="text-end">
                    <p className="num font-display text-[19px] font-extrabold leading-none">{money(p.monthly)}</p>
                    <p className="text-[10px] font-bold text-[var(--faint)]">{t("pay_per_month")}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* sticky CTA — always visible even on short screens */}
        <div className="sticky -bottom-5 -mx-5 mt-4 border-t border-[var(--line)] bg-[var(--surface)] px-5 pb-4 pt-3">
          <button onClick={() => void subscribe()} disabled={busy} className="btn-accent w-full py-3.5 text-[15px]">
            {busy ? t("loading") : plan.trial ? t("pay_cta") : `${t("pay_continue")} · ${money(plan.billed)}`}
          </button>
          <p className="mt-2.5 text-center text-[10.5px] font-semibold leading-relaxed text-[var(--faint)]">
            {t("pay_note")}
          </p>
        </div>
      </div>
    </Sheet>
  );
}
