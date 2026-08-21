import { db } from "@/db";
import { entries, profile } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ensureProfile, json } from "@/lib/server";

export const dynamic = "force-dynamic";

const MEALS = new Set(["breakfast", "lunch", "dinner", "snack"]);

export async function GET() {
  try {
    const all = await db.select().from(entries).orderBy(entries.id);
    return json({ entries: all });
  } catch (err) {
    console.error(err);
    return json({ error: "failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const prof = await ensureProfile();
    const body = (await req.json()) as Record<string, unknown>;

    const meal = MEALS.has(String(body.meal)) ? String(body.meal) : "snack";
    const name = String(body.name ?? "").slice(0, 80);
    if (!name) return json({ error: "name required" }, { status: 400 });

    const insert = await db
      .insert(entries)
      .values({
        date: String(body.date ?? new Date().toISOString().slice(0, 10)),
        meal,
        name,
        emoji: String(body.emoji ?? "🍽️").slice(0, 8),
        portion: String(body.portion ?? "1 serving").slice(0, 40),
        calories: Math.max(0, Math.min(4000, Math.round(Number(body.calories ?? 0)))),
        protein: Math.max(0, Math.round(Number(body.protein ?? 0) * 10) / 10),
        carbs: Math.max(0, Math.round(Number(body.carbs ?? 0) * 10) / 10),
        fat: Math.max(0, Math.round(Number(body.fat ?? 0) * 10) / 10),
        healthScore: Math.max(0, Math.min(100, Math.round(Number(body.healthScore ?? 70)))),
        image: typeof body.image === "string" && body.image.length < 900_000 ? body.image : null,
        foodId: typeof body.foodId === "string" && body.foodId.length < 40 ? body.foodId : null,
        viaAi: Boolean(body.viaAi),
      })
      .returning();

    const newEntry = insert[0];
    const updatedProf = await db
      .update(profile)
      .set({ xp: prof.xp + 12 })
      .where(eq(profile.id, 1))
      .returning();

    return json({ entry: newEntry, profile: updatedProf[0] });
  } catch (err) {
    console.error("entry create error", err);
    return json({ error: "create failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = Number(url.searchParams.get("id"));
    if (!Number.isFinite(id)) return json({ error: "bad id" }, { status: 400 });
    await db.delete(entries).where(eq(entries.id, id));
    return json({ ok: true });
  } catch (err) {
    console.error(err);
    return json({ error: "delete failed" }, { status: 500 });
  }
}
