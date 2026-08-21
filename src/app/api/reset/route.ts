import { db } from "@/db";
import { days, entries, profile } from "@/db/schema";
import { ensureProfile, json } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await db.delete(entries);
    await db.delete(days);
    await db.update(profile).set({ xp: 0, pro: false });
    const prof = await ensureProfile();
    return json({ profile: prof });
  } catch (err) {
    console.error("reset error", err);
    return json({ error: "reset failed" }, { status: 500 });
  }
}
