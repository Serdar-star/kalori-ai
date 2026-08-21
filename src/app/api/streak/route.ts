import { db } from "@/db";
import { days, profile } from "@/db/schema";
import { eq } from "drizzle-orm";
import { weekKey } from "@/lib/challenges";
import { ensureProfile, json } from "@/lib/server";
import { todayStr } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** POST { action: "freeze" | "claim_challenge" | "sync_challenge", ... } */
export async function POST(req: Request) {
  try {
    const prof = await ensureProfile();
    const body = (await req.json()) as {
      action?: string;
      challengeId?: string;
      progress?: number;
      rewardXp?: number;
    };
    const action = body.action;
    const wk = weekKey();

    // Auto-refill one freeze each new ISO week
    if (prof.freezeWeek !== wk && (prof.streakFreezes ?? 0) < 1) {
      await db
        .update(profile)
        .set({ streakFreezes: 1, freezeWeek: wk })
        .where(eq(profile.id, 1));
      prof.streakFreezes = 1;
      prof.freezeWeek = wk;
    }

    if (action === "freeze") {
      if ((prof.streakFreezes ?? 0) <= 0) {
        return json({ error: "no_freezes" }, { status: 400 });
      }
      const date = todayStr();
      const existing = await db.select().from(days).where(eq(days.date, date));
      if (existing[0]?.frozen) {
        return json({ error: "already_frozen", day: existing[0], profile: prof }, { status: 400 });
      }

      const day = await db
        .insert(days)
        .values({
          date,
          waterMl: existing[0]?.waterMl ?? 0,
          weightKg: existing[0]?.weightKg ?? null,
          quests: existing[0]?.quests ?? "",
          frozen: true,
        })
        .onConflictDoUpdate({
          target: days.date,
          set: { frozen: true },
        })
        .returning();

      const updated = await db
        .update(profile)
        .set({
          streakFreezes: Math.max(0, (prof.streakFreezes ?? 1) - 1),
          freezeWeek: wk,
          xp: prof.xp + 5,
        })
        .where(eq(profile.id, 1))
        .returning();

      return json({ ok: true, day: day[0], profile: updated[0] });
    }

    if (action === "claim_challenge") {
      if (prof.challengeClaimed) {
        return json({ error: "already_claimed", profile: prof }, { status: 400 });
      }
      const reward = Math.max(20, Math.min(200, Math.round(Number(body.rewardXp ?? 80))));
      const updated = await db
        .update(profile)
        .set({
          challengeClaimed: true,
          xp: prof.xp + reward,
        })
        .where(eq(profile.id, 1))
        .returning();
      return json({ ok: true, profile: updated[0], xpGained: reward });
    }

    if (action === "sync_challenge") {
      const id = typeof body.challengeId === "string" ? body.challengeId.slice(0, 40) : prof.challengeId;
      const progress = Math.max(0, Math.min(30, Math.round(Number(body.progress ?? 0))));
      const switched = prof.challengeId !== id || prof.freezeWeek !== wk;
      const updated = await db
        .update(profile)
        .set({
          challengeId: id,
          challengeProgress: progress,
          challengeClaimed: switched ? false : prof.challengeClaimed,
          freezeWeek: wk,
        })
        .where(eq(profile.id, 1))
        .returning();
      return json({ ok: true, profile: updated[0] });
    }

    return json({ error: "bad action" }, { status: 400 });
  } catch (err) {
    console.error("streak error", err);
    return json({ error: "failed" }, { status: 500 });
  }
}
