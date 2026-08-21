"use client";

import confetti from "canvas-confetti";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Day, Entry, Profile } from "@/db/schema";
import { LANGS, isLangCode, translate, type LangCode } from "@/lib/translations";
import {
  ACHIEVEMENTS,
  computeStreak,
  levelFromXp,
  todayStr,
  totalsFor,
} from "@/lib/utils";

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface Toast {
  id: number;
  msg: string;
  type: "success" | "error" | "info";
}

interface ScanState {
  open: boolean;
  meal: MealType;
}

interface AppState {
  status: "loading" | "ready" | "error";
  profile: Profile | null;
  entries: Entry[];
  days: Record<string, Day>;
  lang: LangCode;
  scan: ScanState;
  toasts: Toast[];
  t: (key: string, vars?: Record<string, string | number>) => string;
  openScan: (meal?: MealType) => void;
  closeScan: () => void;
  addEntry: (e: Omit<Entry, "id" | "createdAt">, opts?: { silent?: boolean }) => Promise<void>;
  removeEntry: (id: number) => Promise<void>;
  addWater: (ml: number) => Promise<void>;
  logWeight: (kg: number) => Promise<void>;
  claimQuest: (id: string, reward: number) => Promise<void>;
  updateProfile: (patch: Partial<Profile>) => Promise<void>;
  setLang: (lang: LangCode) => Promise<void>;
  resetAll: () => Promise<void>;
  toast: (msg: string, type?: Toast["type"]) => void;
  celebrate: (big?: boolean) => void;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AppState | null>(null);

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp must be used inside AppProvider");
  return v;
}

const CONFETTI_COLORS = ["#B9F253", "#FFC24B", "#4FD8C4", "#FF7A59", "#F2F5EC"];

function unlockedSet(entries: Entry[], days: Record<string, Day>, profile: Profile | null): Set<string> {
  if (!profile) return new Set();
  const today = todayStr();
  const todayEntries = entries.filter((e) => e.date === today);
  const totals = totalsFor(todayEntries);
  const streak = computeStreak(new Set(entries.map((e) => e.date)));
  const waterToday = days[today]?.waterMl ?? 0;
  const byDate = new Map<string, number>();
  for (const e of entries) byDate.set(e.date, (byDate.get(e.date) ?? 0) + e.calories);
  let daysUnderGoal = 0;
  for (const [d, cal] of byDate) {
    if (d !== today && cal > 0 && cal <= profile.dailyCalories) daysUnderGoal += 1;
  }
  const ctx = { entries, streak, waterToday, profile, totalsToday: totals, daysUnderGoal };
  return new Set(ACHIEVEMENTS.filter((a) => a.test(ctx)).map((a) => a.id));
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AppState["status"]>("loading");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [days, setDays] = useState<Record<string, Day>>({});
  const [lang, setLangState] = useState<LangCode>("en");
  const [scan, setScan] = useState<ScanState>({ open: false, meal: "lunch" });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);
  const hydrated = useRef(false);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => translate(lang, key, vars),
    [lang]
  );

  const toast = useCallback((msg: string, type: Toast["type"] = "success") => {
    const id = ++toastId.current;
    setToasts((prev) => [...prev.slice(-2), { id, msg, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 2600);
  }, []);

  const celebrate = useCallback((big = false) => {
    try {
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(big ? [18, 40, 28] : 12);
      }
    } catch {
      // haptics not available
    }
    const fire = (x: number, angle: number) =>
      confetti({
        particleCount: big ? 90 : 45,
        spread: big ? 100 : 60,
        startVelocity: big ? 42 : 30,
        origin: { x, y: 0.85 },
        angle,
        colors: CONFETTI_COLORS,
        scalar: big ? 1 : 0.85,
        zIndex: 9999,
      });
    if (big) {
      fire(0.2, 60);
      fire(0.8, 120);
      setTimeout(() => fire(0.5, 90), 180);
    } else {
      fire(0.5, 90);
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/bootstrap");
      if (!res.ok) throw new Error("bootstrap failed");
      const data = (await res.json()) as { profile: Profile; entries: Entry[]; days: Day[] };
      setProfile(data.profile);
      setEntries(data.entries);
      const map: Record<string, Day> = {};
      for (const d of data.days) map[d.date] = d;
      setDays(map);
      if (isLangCode(data.profile.lang)) setLangState(data.profile.lang);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    if (!hydrated.current) {
      hydrated.current = true;
      void refresh();
    }
  }, [refresh]);

  // Apply language / direction / theme to document
  useEffect(() => {
    const meta = LANGS.find((l) => l.code === lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = meta?.rtl ? "rtl" : "ltr";
  }, [lang]);

  useEffect(() => {
    document.documentElement.dataset.theme = profile?.theme ?? "dark";
  }, [profile?.theme]);

  const openScan = useCallback((meal?: MealType) => {
    const hour = new Date().getHours();
    const fallback: MealType = hour < 11 ? "breakfast" : hour < 16 ? "lunch" : hour < 21 ? "dinner" : "snack";
    setScan({ open: true, meal: meal ?? fallback });
  }, []);

  const closeScan = useCallback(() => setScan((s) => ({ ...s, open: false })), []);

  const addEntry = useCallback(
    async (e: Omit<Entry, "id" | "createdAt">, opts?: { silent?: boolean }) => {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(e),
      });
      if (!res.ok) throw new Error("add failed");
      const data = (await res.json()) as { entry: Entry; profile: Profile };
      const nextEntries = [data.entry, ...entries];
      setEntries(nextEntries);
      setProfile(data.profile);
      if (!opts?.silent) toast(translate(lang, "toast_saved"));

      // level-up moment
      const prevLevel = levelFromXp(profile?.xp ?? 0).level;
      const nextLevel = levelFromXp(data.profile.xp).level;
      if (nextLevel > prevLevel) {
        celebrate(true);
        toast(`${translate(lang, "level_up")} ${nextLevel}`);
      }

      // freshly unlocked achievements
      const before = unlockedSet(entries, days, profile);
      const after = unlockedSet(nextEntries, days, data.profile);
      const fresh = ACHIEVEMENTS.filter((a) => after.has(a.id) && !before.has(a.id)).slice(0, 2);
      if (fresh.length > 0) {
        celebrate();
        for (const a of fresh) toast(`${translate(lang, a.nameKey)} · ${translate(lang, "ach_unlocked")}`);
      }
    },
    [lang, toast, entries, days, profile, celebrate]
  );

  const removeEntry = useCallback(
    async (id: number) => {
      const res = await fetch(`/api/entries?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
      setEntries((prev) => prev.filter((e) => e.id !== id));
      toast(translate(lang, "toast_deleted"), "info");
    },
    [lang, toast]
  );

  const addWater = useCallback(async (ml: number) => {
    const date = todayStr();
    const res = await fetch("/api/day", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, waterDelta: ml }),
    });
    if (!res.ok) throw new Error("water failed");
    const data = (await res.json()) as { day: Day; crossed: boolean };
    const nextDays = { ...days, [date]: data.day };
    setDays(nextDays);
    if (data.crossed) {
      toast(translate(lang, "toast_water_goal"));
      celebrate();
    }
    const before = unlockedSet(entries, days, profile);
    const after = unlockedSet(entries, nextDays, profile);
    const fresh = ACHIEVEMENTS.filter((a) => after.has(a.id) && !before.has(a.id)).slice(0, 1);
    for (const a of fresh) {
      celebrate();
      toast(`${translate(lang, a.nameKey)} · ${translate(lang, "ach_unlocked")}`);
    }
  }, [lang, toast, celebrate, days, entries, profile]);

  const claimQuest = useCallback(
    async (id: string, reward: number) => {
      const date = todayStr();
      const res = await fetch("/api/day", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, claimQuest: { id, reward } }),
      });
      if (!res.ok) throw new Error("quest failed");
      const data = (await res.json()) as { day: Day; profile: Profile; xpGained: number };
      setDays((prev) => ({ ...prev, [date]: data.day }));
      if (data.profile) setProfile(data.profile);
      if (data.xpGained > 0) {
        celebrate();
        toast(`+${data.xpGained} XP`);
      }
    },
    [celebrate, toast]
  );

  const logWeight = useCallback(async (kg: number) => {
    const date = todayStr();
    const res = await fetch("/api/day", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, weightKg: kg }),
    });
    if (!res.ok) throw new Error("weight failed");
    const data = (await res.json()) as { day: Day };
    setDays((prev) => ({ ...prev, [date]: data.day }));
  }, []);

  const updateProfile = useCallback(async (patch: Partial<Profile>) => {
    setProfile((prev) => (prev ? { ...prev, ...patch } : prev));
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error("profile update failed");
    const data = (await res.json()) as { profile: Profile };
    setProfile(data.profile);
  }, []);

  const setLang = useCallback(
    async (code: LangCode) => {
      setLangState(code);
      await updateProfile({ lang: code });
      toast(translate(code, "toast_lang"));
    },
    [updateProfile, toast]
  );

  const resetAll = useCallback(async () => {
    const res = await fetch("/api/reset", { method: "POST" });
    if (!res.ok) throw new Error("reset failed");
    const data = (await res.json()) as { profile: Profile };
    setEntries([]);
    setDays({});
    setProfile(data.profile);
    toast(translate(lang, "toast_reset_done"), "info");
  }, [lang, toast]);

  const value = useMemo<AppState>(
    () => ({
      status,
      profile,
      entries,
      days,
      lang,
      scan,
      toasts,
      t,
      openScan,
      closeScan,
      addEntry,
      removeEntry,
      addWater,
      logWeight,
      claimQuest,
      updateProfile,
      setLang,
      resetAll,
      toast,
      celebrate,
      refresh,
    }),
    [status, profile, entries, days, lang, scan, toasts, t, openScan, closeScan, addEntry, removeEntry, addWater, logWeight, claimQuest, updateProfile, setLang, resetAll, toast, celebrate, refresh]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/* ---------- derived helpers ---------- */

export function useDerived() {
  const { entries, days, profile } = useApp();
  return useMemo(() => {
    const today = todayStr();
    const todayEntries = entries.filter((e) => e.date === today);
    const totals = totalsFor(todayEntries);
    const dateSet = new Set(entries.map((e) => e.date));
    const streak = computeStreak(dateSet);
    const level = levelFromXp(profile?.xp ?? 0);
    const waterToday = days[today]?.waterMl ?? 0;
    const weightToday = days[today]?.weightKg ?? null;

    // days fully under calorie goal
    const byDate = new Map<string, number>();
    for (const e of entries) byDate.set(e.date, (byDate.get(e.date) ?? 0) + e.calories);
    let daysUnderGoal = 0;
    if (profile) {
      for (const [d, cal] of byDate) {
        if (d !== today && cal > 0 && cal <= profile.dailyCalories) daysUnderGoal += 1;
      }
    }

    const ctx = profile
      ? { entries, streak, waterToday, profile, totalsToday: totals, daysUnderGoal }
      : null;
    const unlockedIds = new Set(
      ctx ? ACHIEVEMENTS.filter((a) => a.test(ctx)).map((a) => a.id) : []
    );

    return {
      today,
      todayEntries,
      totals,
      streak,
      level,
      waterToday,
      weightToday,
      unlockedIds,
      byDate,
      daysUnderGoal,
    };
  }, [entries, days, profile]);
}
