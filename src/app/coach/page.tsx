"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface SpeechRecResult {
  0: { transcript: string };
  isFinal: boolean;
}
interface SpeechRecEvent {
  results: ArrayLike<SpeechRecResult>;
}
interface SpeechRec {
  lang: string;
  interimResults: boolean;
  onresult: ((e: SpeechRecEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
}
import AppShell from "@/components/AppShell";
import { Ic } from "@/components/ui";
import { findFood, foodTotals } from "@/lib/foods";
import { useApp, useDerived, type MealType } from "@/lib/store";
import type { Food } from "@/lib/foods";

interface Msg {
  id: number;
  role: "user" | "coach";
  text: string | null;
  textKey: string | null;
  vars: Record<string, string | number> | null;
  foodIds: string[];
  createdAt: string;
}

const CHIPS: { intent: string; key: string }[] = [
  { intent: "status", key: "chip_status" },
  { intent: "eat", key: "chip_eat" },
  { intent: "protein", key: "chip_protein" },
  { intent: "water", key: "chip_water" },
  { intent: "motivate", key: "chip_motivate" },
  { intent: "summary", key: "chip_summary" },
  { intent: "tip", key: "chip_tip" },
];

export default function CoachPage() {
  return (
    <AppShell>
      <Coach />
    </AppShell>
  );
}

const LOCALES: Record<string, string> = {
  tr: "tr-TR", en: "en-US", es: "es-ES", pt: "pt-BR", fr: "fr-FR", de: "de-DE",
  it: "it-IT", ru: "ru-RU", ja: "ja-JP", ko: "ko-KR", zh: "zh-CN", hi: "hi-IN",
  ar: "ar-SA", bn: "bn-BD", ur: "ur-PK",
};

function Coach() {
  const { t, lang, toast, addEntry, profile } = useApp();
  const d = useDerived();
  const [listening, setListening] = useState(false);
  const recRef = useRef<{ stop: () => void } | null>(null);
  const speechSupported =
    typeof window !== "undefined" &&
    Boolean(
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition ||
        (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition
    );

  const toggleMic = () => {
    const W = window as unknown as {
      SpeechRecognition?: new () => SpeechRec;
      webkitSpeechRecognition?: new () => SpeechRec;
    };
    const SR = W.SpeechRecognition ?? W.webkitSpeechRecognition;
    if (!SR) return;
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }
    const rec = new SR();
    rec.lang = LOCALES[lang] ?? "en-US";
    rec.interimResults = true;
    rec.onresult = (e) => {
      const text = Array.from(e.results).map((r) => r[0].transcript).join("");
      setInput(text);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  };
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const [added, setAdded] = useState<Set<string>>(new Set());
  const endRef = useRef<HTMLDivElement>(null);
  const tempId = useRef(-1);

  useEffect(() => {
    let alive = true;
    fetch("/api/coach")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { messages: Msg[] }) => {
        if (!alive) return;
        setMessages(data.messages);
        setLoaded(true);
      })
      .catch(() => alive && setLoaded(true));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, typing]);

  const send = useCallback(
    async (textArg?: string, intent?: string) => {
      const text = textArg?.trim();
      if ((!text && !intent) || typing) return;
      setInput("");

      if (text) {
        const temp = {
          id: tempId.current--,
          role: "user" as const,
          text,
          textKey: null,
          vars: null,
          foodIds: [],
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, temp]);
      }

      setTyping(true);
      const started = Date.now();
      try {
        const res = await fetch("/api/coach", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, intent }),
        });
        if (!res.ok) throw new Error("coach failed");
        const data = (await res.json()) as { userMsg: Msg | null; coachMsg: Msg };
        const wait = Math.max(0, 1300 - (Date.now() - started));
        setTimeout(() => {
          setMessages((prev) => {
            const withoutTemp = data.userMsg
              ? prev.map((m) => (m.id < 0 && m.text === data.userMsg!.text ? data.userMsg! : m))
              : prev;
            return [...withoutTemp, data.coachMsg];
          });
          setTyping(false);
        }, wait);
      } catch {
        toast(t("error_generic"), "error");
        setTyping(false);
      }
    },
    [typing, toast, t]
  );

  const addFromCoach = async (food: Food) => {
    if (added.has(food.id)) return;
    const hour = new Date().getHours();
    const meal: MealType = hour < 11 ? "breakfast" : hour < 16 ? "lunch" : hour < 21 ? "dinner" : "snack";
    const totals = foodTotals(food);
    try {
      await addEntry({
        date: new Date().toISOString().slice(0, 10),
        meal,
        name: food.name,
        emoji: "🍽️",
        foodId: food.id,
        portion: "1 serving",
        calories: totals.calories,
        protein: totals.protein,
        carbs: totals.carbs,
        fat: totals.fat,
        healthScore: food.healthScore,
        image: null,
        viaAi: false,
      });
      setAdded((prev) => new Set(prev).add(food.id));
    } catch {
      toast(t("error_generic"), "error");
    }
  };

  const brief = useMemo(() => {
    if (!profile) return [];
    const kcalLeft = profile.dailyCalories - d.totals.calories;
    const proteinLeft = Math.max(0, Math.round(profile.proteinGoal - d.totals.protein));
    const waterLeft = Math.max(0, profile.waterGoalMl - d.waterToday);
    return [
      { icon: "flame", color: "var(--amber)", label: `${d.streak.current}`, sub: t("streak") },
      { icon: "bolt", color: "var(--accent)", label: `${Math.abs(kcalLeft)}`, sub: kcalLeft >= 0 ? t("today_remaining") : "↑" },
      { icon: "dumbbell", color: "var(--coral)", label: `${proteinLeft}g`, sub: t("macro_protein") },
      { icon: "droplet", color: "var(--teal)", label: waterLeft >= 1000 ? `${(waterLeft / 1000).toFixed(1)}L` : `${waterLeft}ml`, sub: t("water_title") },
    ];
  }, [profile, d, t]);

  return (
    <div className="flex flex-col gap-4">
      {/* header */}
      <header className="flex items-center gap-3.5">
        <div className="relative">
          <span
            className="grid h-12 w-12 place-items-center rounded-full text-[var(--accent-ink)]"
            style={{ background: "linear-gradient(135deg, var(--accent), var(--teal))" }}
          >
            <Ic name="sparkle" size={22} strokeWidth={2.2} />
          </span>
          <span className="absolute -bottom-0.5 -end-0.5 h-3.5 w-3.5 rounded-full border-2 border-[var(--bg)] bg-[var(--accent)]" />
        </div>
        <div>
          <h1 className="font-display text-[19px] font-extrabold leading-tight tracking-tight">{t("coach_title")}</h1>
          <p className="flex items-center gap-1.5 text-[11.5px] font-bold text-[var(--muted)]">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--accent)]" />
            {t("coach_online")}
          </p>
        </div>
      </header>

      {/* daily briefing chips */}
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
        {brief.map((b, i) => (
          <div key={i} className="card-flat flex shrink-0 items-center gap-2.5 px-3.5 py-2">
            <Ic name={b.icon} size={16} strokeWidth={2.2} style={{ color: b.color }} />
            <div>
              <p className="num text-[13.5px] font-extrabold leading-none">{b.label}</p>
              <p className="mt-0.5 text-[9.5px] font-bold text-[var(--faint)]">{b.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* chat */}
      <section className="card flex flex-col overflow-hidden" style={{ height: "min(62dvh, 560px)", minHeight: 400 }}>
        <div className="flex-1 space-y-3.5 overflow-y-auto p-4">
          {!loaded && (
            <>
              <div className="shimmer h-14 w-3/4 rounded-2xl" />
              <div className="shimmer ms-auto h-10 w-1/2 rounded-2xl" />
            </>
          )}
          {messages.map((m) => (
            <MessageBubble key={m.id} m={m} t={t} added={added} onAdd={addFromCoach} />
          ))}
          <AnimatePresence>
            {typing && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-end gap-2"
              >
                <CoachAvatar small />
                <div className="rounded-2xl rounded-bl-md border border-[var(--line)] bg-[var(--card)] px-4 py-3">
                  <span className="dot-anim flex gap-1 text-[var(--accent)]">
                    <span className="text-[18px] leading-none">•</span>
                    <span className="text-[18px] leading-none">•</span>
                    <span className="text-[18px] leading-none">•</span>
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={endRef} />
        </div>

        {/* quick chips */}
        <div className="no-scrollbar flex gap-2 overflow-x-auto border-t border-[var(--line)] px-3 py-2.5">
          {CHIPS.map((c) => (
            <button
              key={c.intent}
              onClick={() => void send(t(c.key), c.intent)}
              className="shrink-0 rounded-full border border-[var(--line-strong)] bg-[var(--card2)] px-3.5 py-2 text-[12px] font-bold text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent-strong)] active:scale-95"
            >
              {t(c.key)}
            </button>
          ))}
        </div>

        {/* input */}
        <div className="flex items-center gap-2 border-t border-[var(--line)] p-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void send(input)}
            placeholder={listening ? t("coach_listening") : t("coach_placeholder")}
            className="input min-w-0 flex-1 px-4 py-3 text-[14px] font-semibold"
          />
          {speechSupported && (
            <motion.button
              onClick={toggleMic}
              whileTap={{ scale: 0.9 }}
              animate={listening ? { scale: [1, 1.08, 1] } : { scale: 1 }}
              transition={listening ? { duration: 0.9, repeat: Infinity } : { duration: 0.2 }}
              className={`grid h-[46px] w-[46px] shrink-0 place-items-center rounded-full border transition ${
                listening
                  ? "border-[var(--coral)] bg-[var(--coral-soft)] text-[var(--coral)]"
                  : "border-[var(--line-strong)] text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
              aria-label={t("mic_hint")}
            >
              <Ic name="mic" size={18} strokeWidth={2.1} />
            </motion.button>
          )}
          <button
            onClick={() => void send(input)}
            disabled={!input.trim() || typing}
            className="btn-accent grid h-[46px] w-[46px] shrink-0 place-items-center rounded-full"
            aria-label={t("coach_title")}
          >
            <Ic name="chev" size={19} strokeWidth={2.6} className="rtl:-scale-x-100" />
          </button>
        </div>
      </section>
    </div>
  );
}

function CoachAvatar({ small = false }: { small?: boolean }) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full text-[var(--accent-ink)] ${small ? "h-7 w-7" : "h-8 w-8"}`}
      style={{ background: "linear-gradient(135deg, var(--accent), var(--teal))" }}
    >
      <Ic name="sparkle" size={small ? 13 : 15} strokeWidth={2.4} />
    </span>
  );
}

function MessageBubble({
  m,
  t,
  added,
  onAdd,
}: {
  m: Msg;
  t: (k: string, v?: Record<string, string | number>) => string;
  added: Set<string>;
  onAdd: (f: Food) => Promise<void>;
}) {
  if (m.role === "user") {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
        <div className="max-w-[82%] rounded-2xl rounded-br-md bg-[var(--accent)] px-4 py-2.5 text-[13.5px] font-bold text-[var(--accent-ink)] shadow-[0_4px_18px_var(--accent-soft)]">
          {m.text}
        </div>
      </motion.div>
    );
  }

  const isTip = m.textKey?.startsWith("tip_");
  const content = m.textKey ? t(m.textKey, m.vars ?? undefined) : m.text ?? "";
  const foods = m.foodIds.map((id) => findFood(id)).filter((f): f is Food => Boolean(f));

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-end gap-2">
      <CoachAvatar small />
      <div className="max-w-[84%] space-y-2">
        <div
          className={`rounded-2xl rounded-bl-md border px-4 py-3 text-[13.5px] font-semibold leading-relaxed ${
            isTip ? "border-[var(--teal)]/30 bg-[var(--teal-soft)]" : "border-[var(--line)] bg-[var(--card)]"
          }`}
        >
          {isTip && <span className="mb-0.5 block text-[11px] font-extrabold text-[var(--teal)]">{t("scan_tip")}</span>}
          {content}
        </div>
        {foods.length > 0 && (
          <div className="space-y-1.5">
            {foods.map((f) => {
              const totals = foodTotals(f);
              const isAdded = added.has(f.id);
              return (
                <div
                  key={f.id}
                  className="flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--card)] px-3 py-2.5"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.image} alt="" className="h-10 w-10 shrink-0 rounded-xl border border-[var(--line)] object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-bold">{f.name}</p>
                    <p className="num text-[11px] font-semibold text-[var(--faint)]">
                      {totals.calories} {t("kcal")} · P{totals.protein}g
                    </p>
                  </div>
                  <button
                    onClick={() => void onAdd(f)}
                    disabled={isAdded}
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-full transition active:scale-90 ${
                      isAdded
                        ? "bg-[var(--teal-soft)] text-[var(--teal)]"
                        : "bg-[var(--accent)] text-[var(--accent-ink)] shadow-[0_3px_12px_var(--accent-soft)]"
                    }`}
                    aria-label={t("scan_add_meal")}
                  >
                    <Ic name={isAdded ? "check" : "plus"} size={16} strokeWidth={2.6} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
