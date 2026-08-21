"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { FOODS, findFood, foodTotals, type Food } from "@/lib/foods";
import { useApp, useDerived, type MealType } from "@/lib/store";
import { compressImage, healthColor, imageFingerprint } from "@/lib/utils";
import { HealthPill, Ic, Sheet } from "@/components/ui";
import { Paywall } from "@/components/Paywall";

export const FREE_SCAN_LIMIT = 3;

interface AnalyzeResult {
  food: { id: string; name: string; emoji?: string; image?: string; healthScore: number; portion: string };
  items: { name: string; emoji?: string; portion: string; calories: number; protein?: number; carbs?: number; fat?: number }[];
  totals: { calories: number; protein: number; carbs: number; fat: number };
  confidence: number;
  alternatives: { id: string; name: string; image?: string; emoji?: string; calories: number }[];
  tipIndex: number;
  engine?: "gpt" | "local";
}

const SAMPLES: { url: string; hint: string; label: string }[] = [
  {
    url: "https://images.pexels.com/photos/4770328/pexels-photo-4770328.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    hint: "poke",
    label: "🍣",
  },
  {
    url: "https://images.pexels.com/photos/29253300/pexels-photo-29253300.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    hint: "mediterranean",
    label: "🫓",
  },
  {
    url: "https://images.pexels.com/photos/13950821/pexels-photo-13950821.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    hint: "oatmeal",
    label: "🥣",
  },
  {
    url: "https://images.pexels.com/photos/10831651/pexels-photo-10831651.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    hint: "burger",
    label: "🍔",
  },
  {
    url: "https://images.pexels.com/photos/27590337/pexels-photo-27590337.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    hint: "avo-toast",
    label: "🥑",
  },
  {
    url: "https://images.pexels.com/photos/19130868/pexels-photo-19130868.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    hint: "smoothie-bowl",
    label: "🍓",
  },
];

const MEALS: { id: MealType; key: string; emoji: string }[] = [
  { id: "breakfast", key: "meal_breakfast", emoji: "🌅" },
  { id: "lunch", key: "meal_lunch", emoji: "☀️" },
  { id: "dinner", key: "meal_dinner", emoji: "🌙" },
  { id: "snack", key: "meal_snack", emoji: "🍿" },
];

type Step = "source" | "analyzing" | "result" | "manual";

export default function ScanSheet() {
  const app = useApp();
  const { scan, closeScan, t, addEntry, celebrate, profile } = app;
  const d = useDerived();
  const aiUsed = d.todayEntries.filter((e) => e.viaAi).length;
  const aiLeft = Math.max(0, FREE_SCAN_LIMIT - aiUsed);
  const [paywall, setPaywall] = useState(false);

  const [step, setStep] = useState<Step>("source");
  const [img, setImg] = useState<string | null>(null);
  const [imgToStore, setImgToStore] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [activeFoodId, setActiveFoodId] = useState<string | null>(null);
  const [portion, setPortion] = useState(1);
  const [meal, setMeal] = useState<MealType>(scan.meal);
  const [busy, setBusy] = useState(false);
  const [statusIdx, setStatusIdx] = useState(0);
  const [query, setQuery] = useState("");

  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scan.open) {
      setStep("source");
      setImg(null);
      setImgToStore(null);
      setResult(null);
      setActiveFoodId(null);
      setPortion(1);
      setMeal(scan.meal);
      setBusy(false);
      setStatusIdx(0);
      setQuery("");
    }
  }, [scan.open, scan.meal]);

  useEffect(() => {
    if (step !== "analyzing") return;
    const iv = setInterval(() => setStatusIdx((i) => (i + 1) % 3), 950);
    return () => clearInterval(iv);
  }, [step]);

  const runAnalysis = async (
    payload: { seed?: string; hint?: string; image?: string },
    display: string,
    store: string | null
  ) => {
    // Pro gating: free accounts get FREE_SCAN_LIMIT AI scans per day
    if (profile && !profile.pro && aiLeft <= 0) {
      setPaywall(true);
      return;
    }
    const animated = display.length > 0;
    if (animated) {
      setImg(display);
      setImgToStore(store);
      setStep("analyzing");
    }
    const started = Date.now();
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("analyze failed");
      const data = (await res.json()) as AnalyzeResult;
      const elapsed = Date.now() - started;
      const wait = animated ? Math.max(0, 2700 - elapsed) : 0;
      setTimeout(() => {
        setResult(data);
        setActiveFoodId(data.food.id);
        setPortion(1);
        setStep("result");
      }, wait);
    } catch {
      app.toast(t("error_generic"), "error");
      setStep(animated ? "source" : "manual");
    }
  };

  const onFile = async (file: File | undefined | null) => {
    if (!file) return;
    try {
      const raw = await new Promise<string>((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(String(fr.result));
        fr.onerror = reject;
        fr.readAsDataURL(file);
      });
      const display = await compressImage(raw, 900, 0.82);
      const store = await compressImage(raw, 420, 0.6);
      const seed = await imageFingerprint(display);
      await runAnalysis({ seed, image: display }, display, store);
    } catch {
      app.toast(t("error_generic"), "error");
    }
  };

  // Works for both local food-db results and real-AI (synthetic) detections
  const activeView = useMemo(() => {
    if (!result) return null;
    const local = activeFoodId ? findFood(activeFoodId) : undefined;
    if (local) {
      const totals =
        activeFoodId === result.food.id && portion === 1 ? result.totals : foodTotals(local, portion);
      return { name: local.name, image: local.image as string | null, healthScore: local.healthScore, totals };
    }
    const r1 = (n: number) => Math.round(n * portion * 10) / 10;
    return {
      name: result.food.name,
      image: (result.food as { image?: string }).image ?? null,
      healthScore: result.food.healthScore,
      totals: {
        calories: Math.round(result.totals.calories * portion),
        protein: r1(result.totals.protein),
        carbs: r1(result.totals.carbs),
        fat: r1(result.totals.fat),
      },
    };
  }, [result, activeFoodId, portion]);

  const save = async () => {
    if (!result || !activeView || busy) return;
    setBusy(true);
    try {
      await addEntry({
        date: new Date().toISOString().slice(0, 10),
        meal,
        name: activeView.name,
        emoji: "🍽️",
        foodId: activeFoodId && findFood(activeFoodId) ? activeFoodId : null,
        portion: portion === 1 ? result.food.portion : `${portion}× serving`,
        calories: activeView.totals.calories,
        protein: activeView.totals.protein,
        carbs: activeView.totals.carbs,
        fat: activeView.totals.fat,
        healthScore: activeView.healthScore,
        image: imgToStore,
        viaAi: true,
      });
      closeScan();
      if (activeView.healthScore >= 80) celebrate();
    } catch {
      app.toast(t("error_generic"), "error");
    } finally {
      setBusy(false);
    }
  };

  const manualMatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FOODS.slice(0, 8);
    return FOODS.filter(
      (f) => f.name.toLowerCase().includes(q) || f.tags.some((tag) => tag.includes(q))
    );
  }, [query]);

  const statusLines = [t("scan_analyzing_1"), t("scan_analyzing_2"), t("scan_analyzing_3")];

  return (
    <Sheet open={scan.open} onClose={closeScan} maxW="max-w-lg">
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => void onFile(e.target.files?.[0])}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void onFile(e.target.files?.[0])}
      />

      {/* header */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--line)] bg-[var(--surface)]/95 px-5 py-4 backdrop-blur">
        <div>
          <h3 className="font-display text-[16px] font-bold tracking-tight">
            {step === "manual" ? t("scan_manual") : step === "result" ? t("scan_detected") : t("scan_title")}
          </h3>
          {step === "source" && (
            <p className="text-[12px] font-semibold text-[var(--muted)]">{t("scan_subtitle")}</p>
          )}
        </div>
        <button
          onClick={closeScan}
          className="grid h-9 w-9 place-items-center rounded-full border border-[var(--line)] text-[var(--muted)] transition hover:text-[var(--ink)]"
          aria-label={t("close")}
        >
          <Ic name="x" size={16} />
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* ---------- SOURCE ---------- */}
        {step === "source" && (
          <motion.div key="source" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-4 p-5">
            <button
              onClick={() => cameraRef.current?.click()}
              className="group relative flex w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-[24px] border border-dashed border-[var(--accent)] bg-[var(--accent-soft)] py-10 transition active:scale-[0.99]"
            >
              <span className="grid h-16 w-16 place-items-center rounded-full bg-[var(--accent)] text-[var(--accent-ink)] shadow-lg transition group-hover:scale-105">
                <Ic name="camera" size={28} strokeWidth={2.1} />
              </span>
              <span className="text-[15px] font-extrabold">{t("scan_camera")}</span>
            </button>

            <button
              onClick={() => galleryRef.current?.click()}
              className="btn-ghost flex w-full items-center justify-center gap-2 py-3.5 text-[14px]"
            >
              <Ic name="image" size={17} />
              {t("scan_upload")}
            </button>

            <div>
              <p className="mb-2 text-[12px] font-bold text-[var(--muted)]">{t("scan_samples")}</p>
              <div className="grid grid-cols-3 gap-2.5">
                {SAMPLES.map((s) => (
                  <button
                    key={s.hint}
                    onClick={() => void runAnalysis({ hint: s.hint, image: s.url }, s.url, s.url)}
                    className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-[var(--line)] transition active:scale-95"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.url} alt="" loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                    <span className="absolute bottom-1.5 start-1.5 rounded-full bg-black/55 px-2 py-0.5 text-[13px] backdrop-blur-sm">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep("manual")}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-[var(--line)] py-3 text-[13px] font-bold text-[var(--muted)] transition hover:text-[var(--ink)]"
            >
              <Ic name="pencil" size={15} />
              {t("scan_manual")}
            </button>

            {profile && !profile.pro && (
              <div className="flex items-center justify-between rounded-2xl border border-[var(--amber)]/30 bg-[var(--amber-soft)] px-4 py-2.5">
                <span className="flex items-center gap-2 text-[11.5px] font-extrabold text-[var(--amber)]">
                  <Ic name="camera" size={13} strokeWidth={2.4} />
                  {t("limit_counter", { left: aiLeft, total: FREE_SCAN_LIMIT })}
                </span>
                <button
                  onClick={() => setPaywall(true)}
                  className="flex items-center gap-1 text-[11px] font-extrabold text-[var(--amber)] underline underline-offset-2"
                >
                  <Ic name="crown" size={12} strokeWidth={2.4} />
                  {t("limit_cta")}
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* ---------- ANALYZING ---------- */}
        {step === "analyzing" && (
          <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-5">
            <div className="relative overflow-hidden rounded-[24px] border border-[var(--line-strong)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img ?? ""} alt="" className="aspect-[4/3] w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />
              {/* scan line */}
              <div className="scan-line absolute inset-x-4 h-[3px] rounded-full bg-[var(--accent)] shadow-[0_0_24px_4px_var(--accent)]" />
              {/* corner brackets */}
              <div className="absolute inset-5">
                <span className="absolute left-0 top-0 h-6 w-6 rounded-tl-lg border-l-[3px] border-t-[3px] border-[var(--accent)]" />
                <span className="absolute right-0 top-0 h-6 w-6 rounded-tr-lg border-r-[3px] border-t-[3px] border-[var(--accent)]" />
                <span className="absolute bottom-0 left-0 h-6 w-6 rounded-bl-lg border-b-[3px] border-l-[3px] border-[var(--accent)]" />
                <span className="absolute bottom-0 right-0 h-6 w-6 rounded-br-lg border-b-[3px] border-r-[3px] border-[var(--accent)]" />
              </div>
            </div>

            <div className="mt-5 flex flex-col items-center gap-3">
              <div className="flex items-center gap-2 text-[14px] font-bold text-[var(--ink)]">
                <Ic name="sparkle" size={16} className="text-[var(--accent)]" />
                {statusLines[statusIdx]}
                <span className="dot-anim inline-flex gap-0.5 text-[var(--accent)]">
                  <span>•</span>
                  <span>•</span>
                  <span>•</span>
                </span>
              </div>
              <div className="flex w-full gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-1 flex-1 overflow-hidden rounded-full"
                    style={{ background: "var(--card2)" }}
                  >
                    <motion.div
                      className="h-full rounded-full bg-[var(--accent)]"
                      initial={{ width: 0 }}
                      animate={{ width: statusIdx >= i ? "100%" : "0%" }}
                      transition={{ duration: 0.9 }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ---------- RESULT ---------- */}
        {step === "result" && result && activeView && (
          <motion.div key="result" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-5">
            <div className="relative overflow-hidden rounded-[24px] border border-[var(--line-strong)]">
              {img ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={img} alt="" className="aspect-[16/9] w-full object-cover" />
              ) : activeView?.image ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={activeView.image} alt="" className="aspect-[16/9] w-full object-cover" />
              ) : (
                <div className="grid aspect-[16/9] w-full place-items-center" style={{ background: "var(--card2)" }} />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute inset-x-4 bottom-3.5 flex items-end justify-between gap-2">
                <div className="pop">
                  <div className="flex items-center gap-2">
                    <div>
                      <p className="font-display text-[15.5px] font-bold leading-tight text-white drop-shadow">
                        {activeView?.name}
                      </p>
                      <p className="flex items-center gap-1.5 text-[11px] font-bold text-white/75">
                        {Math.round(result.confidence * 100)}% {t("scan_confidence")}
                        {result.engine === "gpt" && (
                          <span className="rounded-full bg-[var(--accent)] px-1.5 py-px text-[9px] font-extrabold text-[var(--accent-ink)]">
                            GPT-4o
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
                <HealthPill score={activeView.healthScore} />
              </div>
            </div>

            {/* totals */}
            <div className="mt-4 flex items-center justify-between rounded-2xl border border-[var(--line)] bg-[var(--card)] px-4 py-3">
              <div>
                <p className="num font-display text-[23px] font-extrabold leading-none">
                  {activeView.totals.calories}
                  <span className="ml-1 text-[13px] font-bold text-[var(--muted)]">{t("kcal")}</span>
                </p>
                <p className="mt-1 text-[11px] font-semibold text-[var(--faint)]">
                  {t("macro_protein")} {activeView.totals.protein}g · {t("macro_carbs")} {activeView.totals.carbs}g ·{" "}
                  {t("macro_fat")} {activeView.totals.fat}g
                </p>
              </div>
              {/* portion stepper */}
              <div className="flex items-center gap-1 rounded-full border border-[var(--line-strong)] p-1">
                <button
                  onClick={() => setPortion((p) => Math.max(0.5, Math.round((p - 0.25) * 100) / 100))}
                  className="grid h-8 w-8 place-items-center rounded-full text-[var(--muted)] transition hover:bg-[var(--card2)]"
                >
                  −
                </button>
                <span className="num min-w-10 text-center text-[13px] font-extrabold">{portion}×</span>
                <button
                  onClick={() => setPortion((p) => Math.min(2.5, Math.round((p + 0.25) * 100) / 100))}
                  className="grid h-8 w-8 place-items-center rounded-full text-[var(--muted)] transition hover:bg-[var(--card2)]"
                >
                  +
                </button>
              </div>
            </div>

            {/* detected items */}
            <div className="mt-4">
              <p className="mb-2 text-[12px] font-bold text-[var(--muted)]">{t("scan_items")}</p>
              <div className="space-y-1.5">
                {result.items.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-[var(--card)] px-3.5 py-2.5"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--accent)]" />
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-bold">{item.name}</p>
                        <p className="text-[11px] font-semibold text-[var(--faint)]">{item.portion}</p>
                      </div>
                    </div>
                    <span className="num text-[13px] font-bold text-[var(--muted)]">{item.calories}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* alternatives */}
            <div className="mt-4">
              <p className="mb-2 text-[12px] font-bold text-[var(--muted)]">{t("scan_alternatives")}</p>
              <div className="flex flex-wrap gap-2">
                {result.alternatives.map((alt) => (
                  <button
                    key={alt.id}
                    onClick={() => {
                      setActiveFoodId(alt.id);
                      setPortion(1);
                    }}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-bold transition active:scale-95 ${
                      activeFoodId === alt.id
                        ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                        : "border-[var(--line-strong)] text-[var(--muted)] hover:text-[var(--ink)]"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {alt.image && <img src={alt.image} alt="" className="h-5 w-5 rounded-full object-cover" />}
                    {alt.name}
                    <span className="text-[var(--faint)]">· {alt.calories}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* coach tip */}
            <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-[var(--teal)]/30 bg-[var(--teal-soft)] px-4 py-3">
              <Ic name="sparkle" size={16} className="mt-0.5 shrink-0 text-[var(--teal)]" />
              <p className="text-[12.5px] font-semibold leading-relaxed">
                <span className="font-extrabold text-[var(--teal)]">{t("scan_tip")}: </span>
                {t(`tip_${result.tipIndex}`)}
              </p>
            </div>

            {/* meal selector */}
            <div className="mt-4 grid grid-cols-4 gap-2">
              {MEALS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMeal(m.id)}
                  className={`flex flex-col items-center gap-1 rounded-2xl border py-2.5 text-[11px] font-bold transition ${
                    meal === m.id
                      ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                      : "border-[var(--line)] text-[var(--muted)]"
                  }`}
                >
                  <span className="text-[16px]">{m.emoji}</span>
                  {t(m.key)}
                </button>
              ))}
            </div>

            <div className="mt-5 flex gap-2.5">
              <button onClick={() => setStep("source")} className="btn-ghost px-5 py-3.5 text-[13px]">
                {t("scan_retake")}
              </button>
              <button onClick={() => void save()} disabled={busy} className="btn-accent flex-1 py-3.5 text-[15px]">
                {busy ? t("loading") : `${t("scan_add_meal")} · ${activeView.totals.calories} ${t("kcal")}`}
              </button>
            </div>
          </motion.div>
        )}

        {/* paywall (scan limit) */}
        <Paywall open={paywall} onClose={() => setPaywall(false)} limitReason={profile ? !profile.pro && aiLeft <= 0 : false} />

        {/* ---------- MANUAL ---------- */}
        {step === "manual" && (
          <motion.div key="manual" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-5">
            <div className="relative">
              <Ic name="search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--faint)]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("scan_search_ph")}
                className="input w-full py-3 pl-10 pr-4 text-[14px] font-semibold"
                autoFocus
              />
            </div>
            <div className="mt-3 space-y-1.5">
              {manualMatches.length === 0 && (
                <p className="py-8 text-center text-[13px] font-semibold text-[var(--faint)]">{t("scan_no_results")}</p>
              )}
              {manualMatches.map((f) => {
                const totals = foodTotals(f);
                return (
                  <button
                    key={f.id}
                    onClick={() =>
                      void runAnalysis({ hint: f.id }, "", null).catch(() => undefined)
                    }
                    className="flex w-full items-center justify-between rounded-xl border border-[var(--line)] bg-[var(--card)] px-3.5 py-3 text-start transition hover:border-[var(--line-strong)] active:scale-[0.99]"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={f.image} alt="" className="h-10 w-10 shrink-0 rounded-xl border border-[var(--line)] object-cover" />
                      <div className="min-w-0">
                        <p className="truncate text-[13.5px] font-bold">{f.name}</p>
                        <p className="text-[11px] font-semibold text-[var(--faint)]">
                          P {foodTotals(f).protein}g · C {foodTotals(f).carbs}g · F {foodTotals(f).fat}g
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="num text-[13.5px] font-extrabold">{totals.calories}</span>
                      <span className="h-2 w-2 rounded-full" style={{ background: healthColor(f.healthScore) }} />
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Sheet>
  );
}
