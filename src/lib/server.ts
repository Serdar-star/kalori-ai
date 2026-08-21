import { db } from "@/db";
import { profile } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function ensureProfile() {
  const rows = await db.select().from(profile).where(eq(profile.id, 1));
  if (rows.length > 0) return rows[0];
  const created = await db.insert(profile).values({ id: 1 }).returning();
  return created[0];
}

export function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
}
