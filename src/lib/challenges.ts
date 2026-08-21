import { shiftDate, todayStr } from "@/lib/utils";

/** ISO-ish week key: YYYY-Www (Mon-start) */
export function weekKey(d = new Date()): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export interface ChallengeDef {
  id: string;
  nameKey: string;
  descKey: string;
  target: number;
  rewardXp: number;
  emoji: string;
  /** How to score progress from app state */
  kind: "protein_days" | "water_days" | "scan_count" | "under_goal" | "log_days";
}

/** Rotate challenges by week so it feels fresh */
export const CHALLENGES: ChallengeDef[] = [
  {
    id: "protein5",
    nameKey: "ch_protein_name",
    descKey: "ch_protein_desc",
    target: 5,
    rewardXp: 80,
    emoji: "💪",
    kind: "protein_days",
  },
  {
    id: "hydrate5",
    nameKey: "ch_water_name",
    descKey: "ch_water_desc",
    target: 5,
    rewardXp: 70,
    emoji: "💧",
    kind: "water_days",
  },
  {
    id: "scan3",
    nameKey: "ch_scan_name",
    descKey: "ch_scan_desc",
    target: 3,
    rewardXp: 60,
    emoji: "📸",
    kind: "scan_count",
  },
  {
    id: "under4",
    nameKey: "ch_goal_name",
    descKey: "ch_goal_desc",
    target: 4,
    rewardXp: 90,
    emoji: "🎯",
    kind: "under_goal",
  },
  {
    id: "log6",
    nameKey: "ch_log_name",
    descKey: "ch_log_desc",
    target: 6,
    rewardXp: 75,
    emoji: "🔥",
    kind: "log_days",
  },
];

export function challengeForWeek(key = weekKey()): ChallengeDef {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return CHALLENGES[h % CHALLENGES.length];
}

export interface ChallengeCtx {
  /** map date -> calories */
  byDate: Map<string, number>;
  /** map date -> water ml */
  waterByDate: Map<string, number>;
  /** entries with viaAi */
  aiCountThisWeek: number;
  /** dates with any entry this week */
  loggedDates: Set<string>;
  /** dates protein total >= proteinGoal */
  proteinHitDates: Set<string>;
  dailyCalories: number;
  proteinGoal: number;
  waterGoalMl: number;
}

export function weekDates(today = todayStr()): string[] {
  // last 7 days including today
  const out: string[] = [];
  for (let i = 6; i >= 0; i--) out.push(shiftDate(today, -i));
  return out;
}

export function computeChallengeProgress(def: ChallengeDef, ctx: ChallengeCtx): number {
  const dates = weekDates();
  switch (def.kind) {
    case "protein_days":
      return dates.filter((d) => ctx.proteinHitDates.has(d)).length;
    case "water_days":
      return dates.filter((d) => (ctx.waterByDate.get(d) ?? 0) >= ctx.waterGoalMl).length;
    case "scan_count":
      return Math.min(def.target, ctx.aiCountThisWeek);
    case "under_goal":
      return dates.filter((d) => {
        const c = ctx.byDate.get(d) ?? 0;
        return c > 0 && c <= ctx.dailyCalories;
      }).length;
    case "log_days":
      return dates.filter((d) => ctx.loggedDates.has(d)).length;
    default:
      return 0;
  }
}
