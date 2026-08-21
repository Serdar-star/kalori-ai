import { db } from "@/db";
import { entries, profile } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ensureProfile, json } from "@/lib/server";

export const dynamic = "force-dynamic";

const MEALS = new Set(["breakfast", "lunch", "dinner", "snack"]);

export async function POST(req: Request) {
  try {
    const prof = await ensureProfile();
    const body = (await req.json()) as {
      items?: Array<Record<string, unknown>>;
      silent?: boolean;
    };
    const items = Array.isArray(body.items) ? body.items.slice(0, 40) : [];
    if (items.length === 0) return json({ error: "no items" }, { status: 400 });

    const created = [];
    for (const bodyItem of items) {
      const meal = MEALS.has(String(bodyItem.meal)) ? String(bodyItem.meal) : "snack";
      const name = String(bodyItem.name ?? "").slice(0, 80);
      if (!name) continue;
      const insert = await db
        .insert(entries)
        .values({
          date: String(bodyItem.date ?? new Date().toISOString().slice(0, 10)).slice(0, 10),
          meal,
          name,
          emoji: String(bodyItem.emoji ?? "🍽️").slice(0, 8),
          portion: String(bodyItem.portion ?? "1 serving").slice(0, 40),
          calories: Math.max(0, Math.min(4000, Math.round(Number(bodyItem.calories ?? 0)))),
          protein: Math.max(0, Math.round(Number(bodyItem.protein ?? 0) * 10) / 10),
          carbs: Math.max(0, Math.round(Number(bodyItem.carbs ?? 0) * 10) / 10),
          fat: Math.max(0, Math.round(Number(bodyItem.fat ?? 0) * 10) / 10),
          healthScore: Math.max(0, Math.min(100, Math.round(Number(bodyItem.healthScore ?? 70)))),
          image: typeof bodyItem.image === "string" && bodyItem.image.length < 900_000 ? bodyItem.image : null,
          foodId: typeof bodyItem.foodId === "string" && bodyItem.foodId.length < 40 ? bodyItem.foodId : null,
          viaAi: Boolean(bodyItem.viaAi),
        })
        .returning();
      created.push(insert[0]);
    }

    const xpGain = Math.min(80, created.length * 8);
    const updatedProf = await db
      .update(profile)
      .set({ xp: prof.xp + xpGain })
      .where(eq(profile.id, 1))
      .returning();

    return json({ entries: created, profile: updatedProf[0], xpGain });
  } catch (err) {
    console.error("bulk entry error", err);
    return json({ error: "create failed" }, { status: 500 });
  }
}
