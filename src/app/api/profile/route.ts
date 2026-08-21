import { db } from "@/db";
import { days, entries, profile } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ensureProfile, json } from "@/lib/server";

export const dynamic = "force-dynamic";

const ALLOWED = new Set([
  "name", "avatar", "goal", "dailyCalories", "proteinGoal", "carbsGoal", "fatGoal",
  "waterGoalMl", "units", "lang", "theme", "notifications", "reminders", "pro", "onboarded",
  "uid", "email", "photoUrl", "plan",
  "streakFreezes", "freezeWeek", "challengeId", "challengeProgress", "challengeClaimed",
]);

export async function POST(req: Request) {
  try {
    const prof = await ensureProfile();
    const body = (await req.json()) as Record<string, unknown>;
    const patch: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(body)) {
      if (ALLOWED.has(k) && v !== undefined) patch[k] = v;
    }
    if (typeof patch.dailyCalories === "number") {
      patch.dailyCalories = Math.min(6000, Math.max(800, Math.round(patch.dailyCalories)));
    }
    if (typeof patch.proteinGoal === "number") patch.proteinGoal = Math.min(400, Math.max(20, Math.round(patch.proteinGoal)));
    if (typeof patch.carbsGoal === "number") patch.carbsGoal = Math.min(700, Math.max(30, Math.round(patch.carbsGoal)));
    if (typeof patch.fatGoal === "number") patch.fatGoal = Math.min(250, Math.max(15, Math.round(patch.fatGoal)));
    if (typeof patch.waterGoalMl === "number") patch.waterGoalMl = Math.min(6000, Math.max(500, Math.round(patch.waterGoalMl)));

    if (Object.keys(patch).length === 0) return json({ profile: prof });

    // A different account signed in on this device → wipe the previous user's data
    const newUid = typeof patch.uid === "string" ? patch.uid : undefined;
    if (newUid && prof.uid && prof.uid !== newUid) {
      await db.delete(entries);
      await db.delete(days);
      patch.xp = 0;
      patch.pro = false;
      patch.onboarded = false;
    }

    const updated = await db.update(profile).set(patch).where(eq(profile.id, 1)).returning();
    return json({ profile: updated[0] });
  } catch (err) {
    console.error("profile update error", err);
    return json({ error: "update failed" }, { status: 500 });
  }
}
