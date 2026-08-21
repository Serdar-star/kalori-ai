import type { Entry, Profile } from "@/db/schema";

export function todayStr(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function shiftDate(base: string, days: number): string {
  const [y, m, d] = base.split("-").map(Number);
  const dt = new Date(y, m - 1, d + days);
  return todayStr(dt);
}

export function greetingKey(): string {
  const h = new Date().getHours();
  if (h < 12) return "greet_morning";
  if (h < 18) return "greet_afternoon";
  return "greet_evening";
}

export function levelFromXp(xp: number): { level: number; into: number; need: number; pct: number } {
  // Each level needs a bit more: 60 + level*40 XP
  let level = 1;
  let rest = xp;
  let need = 100;
  while (rest >= need) {
    rest -= need;
    level += 1;
    need = 60 + level * 40;
  }
  return { level, into: rest, need, pct: Math.min(100, Math.round((rest / need) * 100)) };
}

/** Consecutive days (ending today or yesterday) with at least one entry. */
export function computeStreak(dates: Set<string>): { current: number; best: number } {
  let best = 0;
  // best streak across history
  const sorted = Array.from(dates).sort();
  let run = 0;
  let prev: string | null = null;
  for (const d of sorted) {
    if (prev && shiftDate(prev, 1) === d) run += 1;
    else run = 1;
    best = Math.max(best, run);
    prev = d;
  }
  // current streak ending today (or yesterday if today not logged yet)
  let current = 0;
  let cursor = todayStr();
  if (!dates.has(cursor)) cursor = shiftDate(cursor, -1);
  while (dates.has(cursor)) {
    current += 1;
    cursor = shiftDate(cursor, -1);
  }
  return { current, best: Math.max(best, current) };
}

export function totalsFor(entries: Entry[]) {
  return entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      protein: acc.protein + e.protein,
      carbs: acc.carbs + e.carbs,
      fat: acc.fat + e.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

export interface AchievementDef {
  id: string;
  emoji: string;
  nameKey: string;
  test: (ctx: AchievementCtx) => boolean;
}

export interface AchievementCtx {
  entries: Entry[];
  streak: { current: number; best: number };
  waterToday: number;
  profile: Profile;
  totalsToday: { calories: number; protein: number };
  daysUnderGoal: number;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "first", emoji: "🍽️", nameKey: "ach_first", test: (c) => c.entries.length >= 1 },
  { id: "streak3", emoji: "🔥", nameKey: "ach_streak3", test: (c) => c.streak.best >= 3 },
  { id: "streak7", emoji: "🚀", nameKey: "ach_streak7", test: (c) => c.streak.best >= 7 },
  { id: "streak30", emoji: "💎", nameKey: "ach_streak30", test: (c) => c.streak.best >= 30 },
  { id: "clean", emoji: "🥗", nameKey: "ach_clean", test: (c) => c.entries.some((e) => e.healthScore >= 85) },
  { id: "water", emoji: "💧", nameKey: "ach_water", test: (c) => c.waterToday >= c.profile.waterGoalMl },
  { id: "protein", emoji: "💪", nameKey: "ach_protein", test: (c) => c.totalsToday.protein >= c.profile.proteinGoal },
  { id: "photo10", emoji: "📸", nameKey: "ach_photo10", test: (c) => c.entries.filter((e) => e.viaAi).length >= 10 },
  { id: "goal3", emoji: "🎯", nameKey: "ach_goal3", test: (c) => c.daysUnderGoal >= 3 },
  { id: "hundred", emoji: "👑", nameKey: "ach_100", test: (c) => c.entries.length >= 100 },
];

export function healthColor(score: number): string {
  if (score >= 80) return "#B9F253";
  if (score >= 60) return "#FFC24B";
  return "#FF7A59";
}

export type Platform = "ios" | "android" | "desktop";

export function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) {
    return "ios";
  }
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

export function compressImage(dataUrl: string, maxSize: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(dataUrl);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => reject(new Error("image load failed"));
    img.src = dataUrl;
  });
}

/** Tiny fingerprint of an image so the same photo yields the same AI result. */
export function imageFingerprint(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 12;
        canvas.height = 12;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(String(dataUrl.length));
        ctx.drawImage(img, 0, 0, 12, 12);
        const { data } = ctx.getImageData(0, 0, 12, 12);
        const parts: number[] = [];
        for (let i = 0; i < data.length; i += 16) parts.push(data[i]);
        resolve(parts.join(","));
      } catch {
        resolve(String(dataUrl.length));
      }
    };
    img.onerror = () => resolve(String(dataUrl.length));
    img.src = dataUrl;
  });
}
