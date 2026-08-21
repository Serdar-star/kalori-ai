import { db } from "@/db";
import { days, profile } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ensureProfile, json } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const prof = await ensureProfile();
    const body = (await req.json()) as {
      date?: string;
      waterDelta?: number;
      weightKg?: number;
      claimQuest?: { id?: string; reward?: number };
    };
    const date = String(body.date ?? "").slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return json({ error: "bad date" }, { status: 400 });

    const existing = await db.select().from(days).where(eq(days.date, date));
    const prevWater = existing[0]?.waterMl ?? 0;
    const prevQuests = existing[0]?.quests ?? "";

    let waterMl = prevWater;
    if (typeof body.waterDelta === "number") {
      waterMl = Math.max(0, Math.min(8000, prevWater + Math.round(body.waterDelta)));
    }
    const weightKg =
      typeof body.weightKg === "number" && body.weightKg >= 20 && body.weightKg <= 400
        ? Math.round(body.weightKg * 10) / 10
        : existing[0]?.weightKg ?? null;

    // quest claiming
    let quests = prevQuests;
    let xpGained = 0;
    let nextProfile = prof;
    const cq = body.claimQuest;
    if (cq && typeof cq.id === "string" && /^q_[a-z]+$/.test(cq.id)) {
      const claimed = prevQuests.split(",").filter(Boolean);
      if (!claimed.includes(cq.id)) {
        const reward = Math.max(0, Math.min(100, Math.round(Number(cq.reward ?? 0))));
        quests = [...claimed, cq.id].join(",");
        xpGained = reward;
        if (reward > 0) {
          const upd = await db
            .update(profile)
            .set({ xp: prof.xp + reward })
            .where(eq(profile.id, 1))
            .returning();
          nextProfile = upd[0];
        }
      }
    }

    const frozen = existing[0]?.frozen ?? false;
    const upserted = await db
      .insert(days)
      .values({ date, waterMl, weightKg, quests, frozen })
      .onConflictDoUpdate({ target: days.date, set: { waterMl, weightKg, quests } })
      .returning();

    const day = upserted[0];
    return json({
      day,
      profile: nextProfile,
      xpGained,
      crossed: prevWater < prof.waterGoalMl && day.waterMl >= prof.waterGoalMl,
    });
  } catch (err) {
    console.error("day update error", err);
    return json({ error: "failed" }, { status: 500 });
  }
}
