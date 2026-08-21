"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { ShareCardButton } from "@/components/ShareCard";
import { Ic, MacroBar, Ring, SectionTitle } from "@/components/ui";
import { foodImageFor, generateMealPlan, type PlanItem } from "@/lib/foods";
import { useApp, useDerived, type MealType } from "@/lib/store";
import { greetingKey } from "@/lib/utils";

const MEAL_ORDER: { id: MealType; key: string; emoji: string }[] = [
  { id: "breakfast", key: "meal_breakfast", emoji: "🌅" },
  { id: "lunch", key: "meal_lunch", emoji: "☀️" },
  { id: "dinner", key: "meal_dinner", emoji: "🌙" },
  { id: "snack", key: "meal_snack", emoji: "🍿" },
];

export default function TodayPage() {
  return (
    <AppShell>
      <Today />
    </AppShell>
  );
}

function Today() {
  const {
    profile, t, lang, entries, days, addEntry, claimQuest, openScan, openScanBarcode,
    addWater, logWeight, removeEntry, toast, celebrate, copyYesterday, freezeStreak, claimChallenge,
  } = useApp();
  const d = useDerived();
  const [weightOpen, setWeightOpen] = useState(false);
  const [weightVal, setWeightVal] = useState("");
  const [plan, setPlan] = useState<PlanItem[] | null>(null);
  const [planBusy, setPlanBusy] = useState(false);
  const [copyBusy, setCopyBusy] = useState(false);

  const recentMeals = useMemo(() => {
    const seen = new Map<string, (typeof entries)[number]>();
    for (const e of entries) {
      if (!seen.has(e.name)) seen.set(e.name, e);
      if (seen.size >= 6) break;
    }
    return Array.from(seen.values());
  }, [entries]);

  const quickAdd = async (src: (typeof entries)[number]) => {
    const hour = new Date().getHours();
    const meal = hour < 11 ? "breakfast" : hour < 16 ? "lunch" : hour < 21 ? "dinner" : "snack";
    try {
      await addEntry({
        date: new Date().toISOString().slice(0, 10),
        meal,
        name: src.name,
        emoji: src.emoji,
        foodId: src.foodId,
        portion: src.portion,
        calories: src.calories,
        protein: src.protein,
        carbs: src.carbs,
        fat: src.fat,
        healthScore: src.healthScore,
        image: null,
        viaAi: false,
      });
    } catch {
      toast(t("error_generic"), "error");
    }
  };

  const localeDate = useMemo(() => {
    try {
      return new Date().toLocaleDateString(lang, { weekday: "long", day: "numeric", month: "long" });
    } catch {
      return "";
    }
  }, [lang]);

  const claimedQuests = (days[d.today]?.quests ?? "").split(",").filter(Boolean);
  const quests = [
    { id: "q_meals", key: "quest_meals", reward: 20, prog: Math.min(d.todayEntries.length, 3), target: 3 },
    { id: "q_scan", key: "quest_scan", reward: 15, prog: Math.min(d.todayEntries.filter((e) => e.viaAi).length, 1), target: 1 },
    { id: "q_water", key: "quest_water", reward: 15, prog: Math.min(d.waterToday, 750), target: 750 },
  ];

  const savePlan = async () => {
    if (!plan || planBusy) return;
    setPlanBusy(true);
    try {
      for (const p of plan) {
        await addEntry(
          {
            date: new Date().toISOString().slice(0, 10),
            meal: p.meal,
            name: p.food.name,
            emoji: "🍽️",
            foodId: p.food.id,
            portion: `${p.scale}× serving`,
            calories: p.calories,
            protein: p.protein,
            carbs: p.carbs,
            fat: p.fat,
            healthScore: p.food.healthScore,
            image: null,
            viaAi: false,
          },
          { silent: true }
        );
      }
      toast(t("plan_added"));
      celebrate();
      setPlan(null);
    } catch {
      toast(t("error_generic"), "error");
    } finally {
      setPlanBusy(false);
    }
  };

  if (!profile) return null;

  const goal = profile.dailyCalories;
  const eaten = d.totals.calories;
  const remaining = goal - eaten;
  const pct = goal > 0 ? Math.min(1, eaten / goal) : 0;
  const over = remaining < 0;

  const coach = coachMessage(d, profile.dailyCalories, profile.proteinGoal, t);

  const glasses = Math.max(1, Math.round(profile.waterGoalMl / 250));
  const filled = Math.min(glasses, Math.floor(d.waterToday / 250));

  const saveWeight = async () => {
    const v = parseFloat(weightVal.replace(",", "."));
    if (!Number.isFinite(v) || v < 20 || v > 400) {
      toast(t("error_generic"), "error");
      return;
    }
    try {
      await logWeight(v);
      setWeightOpen(false);
      setWeightVal("");
      toast("✓");
    } catch {
      toast(t("error_generic"), "error");
    }
  };

  return (
    <div className="space-y-5">
      {/* header */}
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12px] font-bold text-[var(--faint)]">{localeDate}</p>
          <h1 className="mt-0.5 truncate font-display text-[21px] font-extrabold tracking-tight">
            {t(greetingKey())}, {profile.name}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ShareCardButton />
          <span className="flex items-center gap-1.5 rounded-full border border-[var(--amber)]/40 bg-[var(--amber-soft)] px-3 py-1.5">
            <Ic name="flame" size={14} strokeWidth={2.3} className={d.streak.current > 0 ? "text-[var(--amber)]" : "text-[var(--faint)]"} />
            <span className="num text-[13px] font-extrabold text-[var(--amber)]">{d.streak.current}</span>
            {d.frozenToday && <Ic name="snowflake" size={12} className="text-[var(--teal)]" strokeWidth={2.4} />}
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-[var(--line-strong)] bg-[var(--card)] px-3 py-1.5">
            <Ic name="star" size={13} className="text-[var(--accent)]" strokeWidth={2.2} />
            <span className="num text-[13px] font-extrabold">{t("level")} {d.level.level}</span>
          </span>
        </div>
      </header>

      {/* quick actions: copy yesterday + barcode */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            if (copyBusy) return;
            setCopyBusy(true);
            void copyYesterday().finally(() => setCopyBusy(false));
          }}
          disabled={copyBusy || d.yesterdayCount === 0}
          className="card-flat flex flex-1 items-center justify-center gap-2 px-3 py-2.5 text-[12px] font-extrabold text-[var(--muted)] transition active:scale-95 disabled:opacity-40"
        >
          <Ic name="copy" size={14} strokeWidth={2.2} />
          {copyBusy ? t("loading") : t("copy_yesterday")}
          {d.yesterdayCount > 0 && (
            <span className="num rounded-full bg-[var(--accent-soft)] px-1.5 text-[10px] text-[var(--accent-strong)]">
              {d.yesterdayCount}
            </span>
          )}
        </button>
        <button
          onClick={() => openScanBarcode()}
          className="card-flat flex flex-1 items-center justify-center gap-2 px-3 py-2.5 text-[12px] font-extrabold text-[var(--muted)] transition active:scale-95"
        >
          <Ic name="barcode" size={14} strokeWidth={2.2} />
          {t("barcode_title")}
        </button>
      </div>

      {/* quick add strip */}
      {recentMeals.length > 0 && (
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
          {recentMeals.map((r) => (
            <button
              key={r.name}
              onClick={() => void quickAdd(r)}
              className="card-flat flex shrink-0 items-center gap-2 px-2.5 py-2 transition active:scale-95"
            >
              {foodImageFor(r) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={foodImageFor(r)!} alt="" className="h-7 w-7 rounded-full border border-[var(--line)] object-cover" />
              ) : (
                <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--card2)] text-[13px]">{r.emoji}</span>
              )}
              <span className="max-w-[110px] truncate text-[12px] font-bold">{r.name}</span>
              <span className="num text-[11px] font-bold text-[var(--faint)]">{r.calories}</span>
              <span className="grid h-5 w-5 place-items-center rounded-full bg-[var(--accent-soft)] text-[var(--accent-strong)]">
                <Ic name="plus" size={11} strokeWidth={3} />
              </span>
            </button>
          ))}
        </div>
      )}

      {/* calorie ring card */}
      <section className="card relative overflow-hidden p-5">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full"
          style={{ background: "radial-gradient(circle, var(--accent-soft), transparent 70%)" }}
        />
        <div className="relative flex items-center justify-between gap-4">
          <Ring pct={pct} size={164} colors={over ? ["var(--coral)", "var(--amber)"] : undefined}>
            <p className="text-[10.5px] font-bold uppercase text-[var(--faint)]">{over ? t("today_eaten") : t("today_remaining")}</p>
            <p className={`num font-display text-[32px] font-extrabold leading-none ${over ? "text-[var(--coral)]" : ""}`}>
              {Math.abs(remaining).toLocaleString()}
            </p>
            <p className="text-[12px] font-bold text-[var(--muted)]">{t("kcal")}</p>
          </Ring>

          <div className="flex flex-1 flex-col gap-2.5">
            <RingStat label={t("today_eaten")} value={eaten} color="var(--accent)" />
            <RingStat label={t("today_goal")} value={goal} color="var(--teal)" />
            <RingStat label={t("macro_protein")} value={`${Math.round(d.totals.protein)}g`} color="var(--coral)" />
            <button
              onClick={() => openScan()}
              className="btn-accent mt-1 flex items-center justify-center gap-2 py-3 text-[13.5px]"
            >
              <Ic name="camera" size={16} strokeWidth={2.3} />
              {t("scan_now")}
            </button>
          </div>
        </div>

        <div className="relative mt-5 flex gap-4 border-t border-[var(--line)] pt-4">
          <MacroBar label={t("macro_protein")} value={d.totals.protein} goal={profile.proteinGoal} color="var(--coral)" />
          <MacroBar label={t("macro_carbs")} value={d.totals.carbs} goal={profile.carbsGoal} color="var(--amber)" />
          <MacroBar label={t("macro_fat")} value={d.totals.fat} goal={profile.fatGoal} color="var(--teal)" />
        </div>
      </section>

      {/* AI coach */}
      <Link
        href="/coach"
        className="card group flex items-start gap-3.5 p-4 transition hover:border-[var(--teal)]"
        style={{ borderColor: "color-mix(in srgb, var(--teal) 30%, var(--line))" }}
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[var(--teal-soft)] text-[var(--teal)]">
          <Ic name="sparkle" size={19} strokeWidth={2.1} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[12px] font-extrabold text-[var(--teal)]">
            {t("coach_title")}
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--accent)]" />
          </p>
          <p className="mt-0.5 text-[13.5px] font-semibold leading-relaxed text-[var(--ink)]">{coach}</p>
        </div>
        <Ic name="chev" size={16} className="mt-3 shrink-0 text-[var(--faint)] transition group-hover:text-[var(--teal)] rtl:rotate-180" />
      </Link>

      {/* AI meal plan (Pro) */}
      <section
        className="card relative overflow-hidden p-4"
        style={{ borderColor: "color-mix(in srgb, var(--amber) 35%, var(--line))" }}
      >
        <div
          className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full"
          style={{ background: "radial-gradient(circle, var(--amber-soft), transparent 70%)" }}
        />
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[var(--amber-soft)] text-[var(--amber)]">
              <Ic name="utensils" size={18} strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-[13px] font-extrabold">
                {t("plan_title")}
                <Ic name="crown" size={12} strokeWidth={2.4} className="text-[var(--amber)]" />
              </p>
              <p className="truncate text-[11.5px] font-semibold text-[var(--muted)]">
                {t("plan_sub")}
              </p>
            </div>
          </div>
          <button
            onClick={() => setPlan(generateMealPlan(profile.dailyCalories, Date.now() % 9973))}
            className="btn-accent shrink-0 px-4 py-2.5 text-[12px]"
          >
            {t("plan_gen")}
          </button>
        </div>

        {plan && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative mt-3 space-y-1.5">
            {plan.map((p) => (
              <div key={p.meal + p.food.id} className="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--card)] px-3 py-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.food.image} alt="" className="h-10 w-10 shrink-0 rounded-xl border border-[var(--line)] object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-bold">{p.food.name}</p>
                  <p className="text-[10.5px] font-semibold text-[var(--faint)]">
                    {t(`meal_${p.meal}`)} · {p.scale}×
                  </p>
                </div>
                <span className="num shrink-0 text-[12.5px] font-extrabold">{p.calories}</span>
              </div>
            ))}
            <button
              onClick={() => void savePlan()}
              disabled={planBusy}
              className="btn-accent flex w-full items-center justify-center gap-2 py-2.5 text-[12.5px]"
            >
              <Ic name="plus" size={14} strokeWidth={2.6} />
              {planBusy ? t("loading") : t("plan_add")}
            </button>
          </motion.div>
        )}
      </section>

      {/* weekly challenge + streak freeze */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div
          className="card relative overflow-hidden p-4"
          style={{ borderColor: "color-mix(in srgb, var(--coral) 28%, var(--line))" }}
        >
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full"
            style={{ background: "radial-gradient(circle, var(--coral-soft), transparent 70%)" }}
          />
          <div className="relative flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-[var(--coral)]">
                <span>{d.challenge.emoji}</span>
                {t("challenge_title")}
              </p>
              <p className="mt-1 truncate text-[13.5px] font-extrabold">{t(d.challenge.nameKey)}</p>
              <p className="mt-0.5 text-[11px] font-semibold text-[var(--muted)]">{t(d.challenge.descKey)}</p>
            </div>
            <span className="num shrink-0 rounded-full bg-[var(--coral-soft)] px-2 py-1 text-[11px] font-extrabold text-[var(--coral)]">
              {d.challengeProgress}/{d.challenge.target}
            </span>
          </div>
          <div className="track relative mt-3 h-[7px]">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, (d.challengeProgress / d.challenge.target) * 100)}%`,
                background: "linear-gradient(90deg, var(--coral), var(--amber))",
              }}
            />
          </div>
          {d.challengeDone && !d.challengeClaimed ? (
            <button
              onClick={() => void claimChallenge()}
              className="btn-accent mt-3 w-full py-2.5 text-[12px]"
            >
              {t("challenge_claim")} · +{d.challenge.rewardXp} XP
            </button>
          ) : d.challengeClaimed ? (
            <p className="mt-2.5 text-center text-[11px] font-bold text-[var(--accent-strong)]">✓ {t("challenge_done")}</p>
          ) : null}
        </div>

        <div className="card flex flex-col justify-between p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-[13px] font-extrabold">
              <Ic name="shield" size={15} className="text-[var(--teal)]" strokeWidth={2.1} />
              {t("freeze_title")}
            </span>
            <span className="num rounded-full border border-[var(--line)] px-2 py-0.5 text-[11px] font-extrabold text-[var(--muted)]">
              {d.freezesLeft} {t("freeze_left")}
            </span>
          </div>
          <p className="mt-2 text-[11.5px] font-semibold leading-relaxed text-[var(--muted)]">
            {d.frozenToday ? t("freeze_active") : t("freeze_desc")}
          </p>
          <button
            onClick={() => void freezeStreak()}
            disabled={d.frozenToday || d.freezesLeft <= 0}
            className="btn-ghost mt-3 w-full py-2.5 text-[12px] text-[var(--teal)] disabled:opacity-40"
          >
            <span className="inline-flex items-center gap-1.5">
              <Ic name="snowflake" size={13} strokeWidth={2.3} />
              {d.frozenToday ? t("freeze_active") : t("freeze_use")}
            </span>
          </button>
        </div>
      </section>

      {/* daily quests */}
      <section className="card p-4">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-[13px] font-extrabold">
            <Ic name="target" size={15} className="text-[var(--coral)]" strokeWidth={2.1} />
            {t("quests_title")}
          </span>
          <span className="num text-[11px] font-bold text-[var(--faint)]">
            {claimedQuests.length}/{quests.length} ✓
          </span>
        </div>
        <div className="mt-3 space-y-2.5">
          {quests.map((q) => {
            const claimed = claimedQuests.includes(q.id);
            const done = q.prog >= q.target;
            return (
              <div key={q.id} className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className={`truncate text-[12px] font-bold ${claimed ? "text-[var(--faint)] line-through" : ""}`}>
                      {t(q.key)}
                    </p>
                    <span className="num shrink-0 text-[11px] font-bold text-[var(--muted)]">
                      {q.id === "q_water" ? `${q.prog}ml` : `${q.prog}/${q.target}`}
                    </span>
                  </div>
                  <div className="track mt-1.5 h-[6px]">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(q.prog / q.target) * 100}%`,
                        background: done ? "var(--accent)" : "var(--teal)",
                      }}
                    />
                  </div>
                </div>
                {claimed ? (
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--accent-soft)] text-[var(--accent-strong)]">
                    <Ic name="check" size={14} strokeWidth={2.8} />
                  </span>
                ) : (
                  <button
                    onClick={() => void claimQuest(q.id, q.reward)}
                    disabled={!done}
                    className={`num shrink-0 rounded-full px-3 py-1.5 text-[11px] font-extrabold transition active:scale-95 ${
                      done
                        ? "bg-[var(--accent)] text-[var(--accent-ink)] shadow-[0_3px_14px_var(--accent-soft)]"
                        : "border border-[var(--line)] text-[var(--faint)]"
                    }`}
                  >
                    +{q.reward} XP
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* water + weight */}
      <section className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[13px] font-extrabold">
              <Ic name="droplet" size={15} className="text-[var(--teal)]" strokeWidth={2.2} />
              {t("water_title")}
            </span>
            <span className="num text-[12px] font-bold text-[var(--muted)]">
              {d.waterToday >= 1000 ? `${(d.waterToday / 1000).toFixed(1)}L` : `${d.waterToday}ml`}
            </span>
          </div>
          <div className="mt-3 flex gap-1">
            {Array.from({ length: Math.min(glasses, 10) }).map((_, i) => (
              <span
                key={i}
                className="flex-1 rounded-md transition-all duration-300"
                style={{
                  height: 26,
                  background: i < filled ? "var(--teal)" : "var(--surface)",
                  border: "1px solid var(--line)",
                  opacity: i < filled ? 1 : 0.7,
                }}
              />
            ))}
          </div>
          <button
            onClick={() => void addWater(250)}
            className="btn-ghost mt-3 w-full py-2 text-[12.5px] text-[var(--teal)]"
          >
            + {t("water_add").replace("+", "")}
          </button>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[13px] font-extrabold">
              <Ic name="scale" size={15} className="text-[var(--teal)]" strokeWidth={2} />
              {t("check_in_weight")}
            </span>
            {profile.units === "imperial" && d.weightToday ? (
              <span className="num text-[12px] font-bold text-[var(--muted)]">{Math.round(d.weightToday * 2.20462)} lb</span>
            ) : null}
          </div>
          {weightOpen ? (
            <div className="mt-3 flex gap-1.5">
              <input
                value={weightVal}
                onChange={(e) => setWeightVal(e.target.value)}
                placeholder={profile.units === "imperial" ? "lb" : "kg"}
                inputMode="decimal"
                className="input w-full min-w-0 px-3 py-2 text-[14px] font-bold"
                autoFocus
              />
              <button onClick={() => void saveWeight()} className="btn-accent shrink-0 px-3.5 text-[13px]">
                <Ic name="check" size={15} strokeWidth={2.6} />
              </button>
            </div>
          ) : (
            <>
              <p className="num mt-3 font-display text-[23px] font-extrabold leading-none">
                {d.weightToday != null
                  ? profile.units === "imperial"
                    ? `${Math.round(d.weightToday * 2.20462)}`
                    : d.weightToday.toFixed(1)
                  : "—"}
                <span className="ms-1 text-[12px] font-bold text-[var(--faint)]">
                  {profile.units === "imperial" ? "lb" : "kg"}
                </span>
              </p>
              <button onClick={() => setWeightOpen(true)} className="btn-ghost mt-[18px] w-full py-2 text-[12.5px]">
                {t("check_in_weight")}
              </button>
            </>
          )}
        </div>
      </section>

      {/* meals */}
      <section>
        <SectionTitle>{t("meals_title")}</SectionTitle>
        <div className="space-y-3">
          {MEAL_ORDER.map((m) => {
            const items = d.todayEntries.filter((e) => e.meal === m.id);
            const kcal = items.reduce((s, e) => s + e.calories, 0);
            return (
              <div key={m.id} className="card overflow-hidden">
                <div className="flex items-center justify-between px-4 pb-1 pt-3.5">
                  <span className="flex items-center gap-2 text-[13.5px] font-extrabold">
                    <span className="text-[15px]">{m.emoji}</span>
                    {t(m.key)}
                  </span>
                  <div className="flex items-center gap-2.5">
                    {kcal > 0 && <span className="num text-[12.5px] font-bold text-[var(--muted)]">{kcal} {t("kcal")}</span>}
                    <button
                      onClick={() => openScan(m.id)}
                      aria-label={t("scan_now")}
                      className="grid h-7 w-7 place-items-center rounded-full bg-[var(--accent-soft)] text-[var(--accent-strong)] transition active:scale-90"
                    >
                      <Ic name="plus" size={14} strokeWidth={2.6} />
                    </button>
                  </div>
                </div>
                {items.length === 0 ? (
                  <button
                    onClick={() => openScan(m.id)}
                    className="mx-4 mb-3.5 mt-1 flex w-[calc(100%-2rem)] items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--line-strong)] py-2.5 text-[12px] font-bold text-[var(--faint)] transition hover:text-[var(--muted)]"
                  >
                    <Ic name="camera" size={14} />
                    {t("meal_empty")}
                  </button>
                ) : (
                  <div className="px-2.5 pb-2.5">
                    {items.map((e) => (
                      <motion.div
                        key={e.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="group flex items-center gap-3 rounded-xl px-1.5 py-2 transition hover:bg-[var(--card2)]"
                      >
                        {e.image || foodImageFor(e) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={e.image ?? foodImageFor(e)!} alt="" className="h-11 w-11 shrink-0 rounded-xl border border-[var(--line)] object-cover" />
                        ) : (
                          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--card2)] text-[19px]">
                            {e.emoji}
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13.5px] font-bold">{e.name}</p>
                          <p className="truncate text-[11px] font-semibold text-[var(--faint)]">
                            {e.portion} · P{Math.round(e.protein)} C{Math.round(e.carbs)} F{Math.round(e.fat)}
                          </p>
                        </div>
                        <span className="num shrink-0 text-[13.5px] font-extrabold">{e.calories}</span>
                        <button
                          onClick={() => void removeEntry(e.id)}
                          aria-label={t("remove")}
                          className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[var(--faint)] opacity-60 transition hover:bg-[var(--coral-soft)] hover:text-[var(--coral)] group-hover:opacity-100"
                        >
                          <Ic name="trash" size={13.5} />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* level progress */}
      <section className="card p-4">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-[13px] font-extrabold">
            <Ic name="star" size={15} className="text-[var(--amber)]" strokeWidth={2.1} />
            {t("level")} {d.level.level}
          </span>
          <span className="num text-[12px] font-bold text-[var(--muted)]">
            {d.level.into}/{d.level.need} XP
          </span>
        </div>
        <div className="track mt-3 h-[8px]">
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, var(--accent), var(--teal))" }}
            initial={{ width: 0 }}
            animate={{ width: `${d.level.pct}%` }}
            transition={{ type: "spring", stiffness: 60, damping: 20 }}
          />
        </div>
        <p className="mt-2 text-[11.5px] font-bold text-[var(--faint)]">{t("xp_to_level", { n: d.level.need - d.level.into })}</p>
      </section>
    </div>
  );
}

function RingStat({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-[var(--card)] px-3.5 py-2">
      <span className="flex items-center gap-2 text-[12px] font-bold text-[var(--muted)]">
        <span className="h-2 w-2 rounded-full" style={{ background: color }} />
        {label}
      </span>
      <span className="num text-[14px] font-extrabold">{typeof value === "number" ? value.toLocaleString() : value}</span>
    </div>
  );
}

function coachMessage(
  d: ReturnType<typeof useDerived>,
  goal: number,
  proteinGoal: number,
  t: (k: string, v?: Record<string, string | number>) => string
): string {
  if (d.todayEntries.length === 0) return t("coach_empty");
  const remaining = goal - d.totals.calories;
  if (remaining < -50) return t("coach_over", { n: Math.abs(remaining) });
  if (Math.abs(remaining) <= 150) return t("coach_great");
  const proteinLeft = proteinGoal - d.totals.protein;
  if (proteinLeft >= 20) return t("coach_protein_left", { n: Math.round(proteinLeft) });
  if (d.streak.current >= 2) return t("coach_streak", { n: d.streak.current });
  return t("coach_great");
}
