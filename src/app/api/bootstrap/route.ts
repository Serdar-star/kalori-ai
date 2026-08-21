import { db } from "@/db";
import { days, entries } from "@/db/schema";
import { desc } from "drizzle-orm";
import { ensureProfile, json } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const prof = await ensureProfile();
    const allEntries = await db.select().from(entries).orderBy(desc(entries.id)).limit(800);
    const allDays = await db.select().from(days);
    return json({ profile: prof, entries: allEntries, days: allDays });
  } catch (err) {
    console.error("bootstrap error", err);
    return json({ error: "bootstrap failed" }, { status: 500 });
  }
}
