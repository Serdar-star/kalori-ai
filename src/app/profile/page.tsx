"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";
import { Paywall } from "@/components/Paywall";
import { Ic, SectionTitle, Sheet, Toggle } from "@/components/ui";
import { LANGS, type LangCode } from "@/lib/translations";
import { useAuth } from "@/lib/auth";
import { useApp, useDerived } from "@/lib/store";

export default function ProfilePage() {
  return (
    <AppShell>
      <Profile />
    </AppShell>
  );
}

function Profile() {
  const app = useApp();
  const { profile, t, lang, updateProfile, setLang, toast, resetAll, entries, days } = app;
  const { signOutUser, user: authUser } = useAuth();
  const d = useDerived();
  const [langOpen, setLangOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [paywall, setPaywall] = useState(false);
  const [nameEdit, setNameEdit] = useState(false);
  const [nameVal, setNameVal] = useState("");

  if (!profile) return null;

  const currentMeta = LANGS.find((l) => l.code === lang) ?? LANGS[0];

  const exportData = () => {
    try {
      const blob = new Blob([JSON.stringify({ profile, entries, days }, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kalora-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast(t("toast_exported"));
    } catch {
      toast(t("error_generic"), "error");
    }
  };

  const memberSince = new Date(profile.createdAt).toLocaleDateString(lang, {
    month: "short",
    year: "numeric",
  });

  return (
    <div className="space-y-5">
      <h1 className="font-display text-[21px] font-extrabold tracking-tight">{t("profile_title")}</h1>

      {/* identity card */}
      <section className="card relative overflow-hidden p-5">
        <div
          className="pointer-events-none absolute -left-12 -top-12 h-40 w-40 rounded-full"
          style={{ background: "radial-gradient(circle, var(--accent-soft), transparent 70%)" }}
        />
        <div className="relative flex items-center gap-4">
          {profile.photoUrl || profile.avatar.startsWith("http") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.photoUrl || profile.avatar}
              alt=""
              referrerPolicy="no-referrer"
              className="h-[68px] w-[68px] rounded-[22px] border border-[var(--line-strong)] object-cover"
            />
          ) : (
            <span className="grid h-[68px] w-[68px] place-items-center rounded-[22px] border border-[var(--line-strong)] bg-[var(--card2)] font-display text-[26px] font-extrabold text-[var(--accent-strong)] shadow-inner">
              {profile.name.slice(0, 1).toUpperCase()}
            </span>
          )}
          <div className="min-w-0 flex-1">
            {nameEdit ? (
              <input
                value={nameVal}
                onChange={(e) => setNameVal(e.target.value)}
                maxLength={24}
                autoFocus
                onBlur={() => {
                  setNameEdit(false);
                  const v = nameVal.trim();
                  if (v && v !== profile.name) void updateProfile({ name: v });
                }}
                onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                className="input w-full max-w-[200px] px-3 py-1.5 text-[16px] font-extrabold"
              />
            ) : (
              <button
                onClick={() => {
                  setNameVal(profile.name);
                  setNameEdit(true);
                }}
                className="group flex items-center gap-2"
              >
                <span className="truncate font-display text-[18px] font-extrabold">{profile.name}</span>
                <Ic name="pencil" size={13} className="text-[var(--faint)] transition group-hover:text-[var(--accent)]" />
              </button>
            )}
            <p className="mt-0.5 text-[12px] font-semibold text-[var(--muted)]">
              {t("member_since")} {memberSince}
            </p>
            {(profile.email || authUser?.email) && (
              <p className="mt-0.5 flex items-center gap-1.5 text-[11px] font-bold text-[var(--faint)]">
                <span
                  className="grid h-4 w-4 place-items-center rounded-full text-[8px] font-extrabold"
                  style={{ background: "var(--card2)", border: "1px solid var(--line)" }}
                >
                  {(profile.email || authUser?.email || "?").slice(0, 1).toUpperCase()}
                </span>
                {profile.email || authUser?.email}
              </p>
            )}
            <div className="mt-1.5 flex items-center gap-2">
              <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-0.5 text-[11px] font-extrabold text-[var(--accent-strong)]">
                {t("level")} {d.level.level} · {profile.xp} XP
              </span>
              {profile.pro && (
                <span className="flex items-center gap-1 rounded-full bg-[var(--amber-soft)] px-2.5 py-0.5 text-[11px] font-extrabold text-[var(--amber)]">
                  <Ic name="crown" size={11} strokeWidth={2.6} />
                  PRO · {t(profile.plan === "monthly" ? "pay_monthly" : profile.plan === "six" ? "pay_6m" : "pay_yearly")}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* pro upsell */}
      {!profile.pro ? (
        <section
          className="relative overflow-hidden rounded-[22px] border p-5"
          style={{
            background: "linear-gradient(135deg, color-mix(in srgb, var(--amber) 16%, var(--card)), var(--card))",
            borderColor: "color-mix(in srgb, var(--amber) 35%, var(--line))",
          }}
        >
          <div className="flex items-start gap-3.5">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[var(--amber-soft)] text-[var(--amber)] shadow-[0_0_24px_var(--amber-soft)]">
              <Ic name="crown" size={21} strokeWidth={2.1} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-[16px] font-extrabold">{t("pro_title")}</p>
              <p className="mt-0.5 text-[12.5px] font-semibold leading-relaxed text-[var(--muted)]">{t("pro_desc")}</p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="num text-[15px] font-extrabold">{t("pro_month")}</span>
                <button
                  onClick={() => setPaywall(true)}
                  className="btn-accent px-4 py-2.5 text-[12.5px]"
                >
                  {t("pro_cta")}
                </button>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* goals */}
      <section>
        <SectionTitle>{t("your_goals")}</SectionTitle>
        <div className="card divide-y divide-[var(--line)] px-5">
          <GoalRow label={t("daily_calories")} unit={t("kcal")} value={profile.dailyCalories} step={50} min={800} max={4500} onChange={(v) => void updateProfile({ dailyCalories: v })} />
          <GoalRow label={t("protein_goal")} unit="g" value={profile.proteinGoal} step={5} min={20} max={400} onChange={(v) => void updateProfile({ proteinGoal: v })} accent="var(--coral)" />
          <GoalRow label={t("carbs_goal")} unit="g" value={profile.carbsGoal} step={10} min={30} max={700} onChange={(v) => void updateProfile({ carbsGoal: v })} accent="var(--amber)" />
          <GoalRow label={t("fat_goal")} unit="g" value={profile.fatGoal} step={5} min={15} max={250} onChange={(v) => void updateProfile({ fatGoal: v })} accent="var(--teal)" />
          <GoalRow label={t("water_goal")} unit="ml" value={profile.waterGoalMl} step={250} min={500} max={6000} onChange={(v) => void updateProfile({ waterGoalMl: v })} accent="var(--teal)" />
        </div>
      </section>

      {/* settings */}
      <section>
        <SectionTitle>{t("settings_label")}</SectionTitle>
        <div className="card divide-y divide-[var(--line)] px-5">
          {/* language */}
          <button onClick={() => setLangOpen(true)} className="flex w-full items-center gap-3.5 py-4 text-start">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--card2)] text-[var(--muted)]">
              <Ic name="globe" size={17} strokeWidth={2} />
            </span>
            <span className="flex-1 text-[13.5px] font-bold">{t("language_label")}</span>
            <span className="flex items-center gap-2 text-[13px] font-bold text-[var(--muted)]">
              <span>{currentMeta.flag}</span>
              {currentMeta.native}
              <Ic name="chev" size={15} className="text-[var(--faint)] rtl:rotate-180" />
            </span>
          </button>

          {/* units */}
          <div className="flex items-center gap-3.5 py-4">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--card2)] text-[var(--muted)]">
              <Ic name="scale" size={17} strokeWidth={2} />
            </span>
            <span className="flex-1 text-[13.5px] font-bold">{t("units_label")}</span>
            <div className="seg">
              <button
                className={profile.units === "metric" ? "active" : ""}
                onClick={() => void updateProfile({ units: "metric" })}
              >
                kg
              </button>
              <button
                className={profile.units === "imperial" ? "active" : ""}
                onClick={() => void updateProfile({ units: "imperial" })}
              >
                lb
              </button>
            </div>
          </div>

          {/* theme */}
          <div className="flex items-center gap-3.5 py-4">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--card2)] text-[var(--muted)]">
              <Ic name={profile.theme === "dark" ? "moon" : "sun"} size={17} strokeWidth={2} />
            </span>
            <span className="flex-1 text-[13.5px] font-bold">{t("theme_label")}</span>
            <div className="seg">
              <button
                className={profile.theme === "dark" ? "active" : ""}
                onClick={() => void updateProfile({ theme: "dark" })}
              >
                <Ic name="moon" size={14} className="inline" />
              </button>
              <button
                className={profile.theme === "light" ? "active" : ""}
                onClick={() => void updateProfile({ theme: "light" })}
              >
                <Ic name="sun" size={14} className="inline" />
              </button>
            </div>
          </div>

          {/* notifications */}
          <div className="flex items-center gap-3.5 py-4">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--card2)] text-[var(--muted)]">
              <Ic name="bell" size={17} strokeWidth={2} />
            </span>
            <span className="flex-1 text-[13.5px] font-bold">{t("notifications_label")}</span>
            <Toggle checked={profile.notifications} onChange={(v) => void updateProfile({ notifications: v })} />
          </div>

          {/* reminders */}
          <div className="flex items-center gap-3.5 py-4">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--card2)] text-[var(--muted)]">
              <Ic name="clock" size={17} strokeWidth={2} />
            </span>
            <span className="flex-1 text-[13.5px] font-bold">{t("reminders_label")}</span>
            <Toggle checked={profile.reminders} onChange={(v) => void updateProfile({ reminders: v })} />
          </div>
        </div>
      </section>

      {/* data */}
      <section>
        <SectionTitle>{t("data_label")}</SectionTitle>
        <div className="card divide-y divide-[var(--line)] px-5">
          <button onClick={exportData} className="flex w-full items-center gap-3.5 py-4 text-start">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--card2)] text-[var(--muted)]">
              <Ic name="download" size={17} strokeWidth={2} />
            </span>
            <span className="flex-1 text-[13.5px] font-bold">{t("export_data")}</span>
            <Ic name="chev" size={15} className="text-[var(--faint)] rtl:rotate-180" />
          </button>
          <button onClick={() => setResetOpen(true)} className="flex w-full items-center gap-3.5 py-4 text-start">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--coral-soft)] text-[var(--coral)]">
              <Ic name="trash" size={17} strokeWidth={2} />
            </span>
            <span className="flex-1 text-[13.5px] font-bold text-[var(--coral)]">{t("reset_data")}</span>
          </button>
          <button onClick={() => void signOutUser()} className="flex w-full items-center gap-3.5 py-4 text-start">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--card2)] text-[var(--muted)]">
              <Ic name="logout" size={17} strokeWidth={2} />
            </span>
            <span className="flex-1 text-[13.5px] font-bold">{t("sign_out")}</span>
            <Ic name="chev" size={15} className="text-[var(--faint)] rtl:rotate-180" />
          </button>
        </div>
      </section>

      {/* about */}
      <section className="pb-2 text-center">
        <p className="text-[12px] font-bold text-[var(--faint)]">
          Kalora · {t("version")} 1.0.0 · {t("about_label")}
        </p>
      </section>

      {/* ---- language sheet ---- */}
      <Sheet open={langOpen} onClose={() => setLangOpen(false)}>
        <div className="sticky top-0 flex items-center justify-between border-b border-[var(--line)] bg-[var(--surface)] px-5 py-4">
          <h3 className="font-display text-[16px] font-bold">{t("language_label")}</h3>
          <button
            onClick={() => setLangOpen(false)}
            className="grid h-9 w-9 place-items-center rounded-full border border-[var(--line)] text-[var(--muted)]"
            aria-label={t("close")}
          >
            <Ic name="x" size={15} />
          </button>
        </div>
        <div className="p-3">
          {LANGS.map((l) => (
            <button
              key={l.code}
              onClick={() => {
                void setLang(l.code as LangCode);
                setLangOpen(false);
              }}
              className={`flex w-full items-center gap-3.5 rounded-2xl px-3.5 py-3 text-start transition ${
                lang === l.code ? "bg-[var(--accent-soft)]" : "hover:bg-[var(--card)]"
              }`}
            >
              <span className="text-[22px]">{l.flag}</span>
              <span className="flex-1">
                <span className="block text-[14px] font-extrabold">{l.native}</span>
                <span className="block text-[11px] font-semibold text-[var(--faint)]">{l.english}</span>
              </span>
              {lang === l.code && <Ic name="check" size={17} className="text-[var(--accent-strong)]" strokeWidth={2.8} />}
            </button>
          ))}
        </div>
      </Sheet>

      {/* ---- reset confirm ---- */}
      <Sheet open={resetOpen} onClose={() => setResetOpen(false)} maxW="max-w-sm">
        <div className="p-6 text-center">
          <span className="grid mx-auto h-14 w-14 place-items-center rounded-full bg-[var(--coral-soft)] text-[var(--coral)]">
            <Ic name="trash" size={24} />
          </span>
          <h3 className="mt-4 font-display text-[18px] font-extrabold">{t("reset_title")}</h3>
          <p className="mt-1.5 text-[13px] font-semibold leading-relaxed text-[var(--muted)]">{t("reset_text")}</p>
          <div className="mt-5 flex gap-2.5">
            <button onClick={() => setResetOpen(false)} className="btn-ghost flex-1 py-3 text-[13.5px]">
              {t("cancel")}
            </button>
            <button
              onClick={() => {
                setResetOpen(false);
                void resetAll();
              }}
              className="flex-1 rounded-full bg-[var(--coral)] py-3 text-[13.5px] font-extrabold text-white transition active:scale-95"
            >
              {t("confirm")}
            </button>
          </div>
        </div>
      </Sheet>

      {/* ---- paywall ---- */}
      <Paywall open={paywall} onClose={() => setPaywall(false)} />
    </div>
  );
}

function GoalRow({
  label,
  unit,
  value,
  step,
  min,
  max,
  accent,
  onChange,
}: {
  label: string;
  unit: string;
  value: number;
  step: number;
  min: number;
  max: number;
  accent?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3.5">
      <span className="flex items-center gap-2 text-[13.5px] font-bold">
        <span className="h-2 w-2 rounded-full" style={{ background: accent ?? "var(--accent)" }} />
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onChange(Math.max(min, value - step))}
          className="grid h-8 w-8 place-items-center rounded-full border border-[var(--line-strong)] text-[15px] font-bold text-[var(--muted)] transition active:scale-90"
        >
          −
        </button>
        <span className="num min-w-[64px] text-center text-[14px] font-extrabold">
          {value.toLocaleString()}
          <span className="ms-0.5 text-[10px] font-bold text-[var(--faint)]">{unit}</span>
        </span>
        <button
          onClick={() => onChange(Math.min(max, value + step))}
          className="grid h-8 w-8 place-items-center rounded-full border border-[var(--line-strong)] text-[15px] font-bold text-[var(--muted)] transition active:scale-90"
        >
          +
        </button>
      </div>
    </div>
  );
}
