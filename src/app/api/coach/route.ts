import { asc, desc } from "drizzle-orm";
import { db } from "@/db";
import { coachMessages, days, entries } from "@/db/schema";
import type { Entry } from "@/db/schema";
import { buildReply, detectIntent, tryGeminiCoach, type CoachCtx, type Intent } from "@/lib/coach";
import { ensureProfile, json } from "@/lib/server";
import { computeStreak, shiftDate, todayStr, totalsFor } from "@/lib/utils";

export const dynamic = "force-dynamic";

const VALID_INTENTS = new Set<Intent>(["status", "eat", "protein", "motivate", "water", "summary", "tip"]);

async function buildCtx() {
  const prof = await ensureProfile();
  const today = todayStr();
  const all = await db.select().from(entries).orderBy(desc(entries.id)).limit(800);
  const todayEntries = all.filter((e) => e.date === today);
  const totals = totalsFor(todayEntries);

  const dayRows = await db.select().from(days);
  const waterMl = dayRows.find((d) => d.date === today)?.waterMl ?? 0;

  const streak = computeStreak(new Set(all.map((e) => e.date)));

  // week stats
  const weekDates: string[] = [];
  for (let i = 0; i < 7; i++) weekDates.push(shiftDate(today, -i));
  const weekSet = new Set(weekDates);
  const weekEntries = all.filter((e) => weekSet.has(e.date));
  const byDay = new Map<string, number>();
  for (const e of weekEntries) byDay.set(e.date, (byDay.get(e.date) ?? 0) + e.calories);
  const logged = Array.from(byDay.values()).filter((v) => v > 0);
  const weekAvg = logged.length ? Math.round(logged.reduce((a, b) => a + b, 0) / logged.length) : 0;

  const ctx: CoachCtx = {
    profile: prof,
    todayEntries,
    totals,
    waterMl,
    streakCurrent: streak.current,
    weekLogs: weekEntries.length,
    weekAvg,
  };
  return { ctx, allEntries: all };
}

function serialize(m: typeof coachMessages.$inferSelect) {
  return {
    id: m.id,
    role: m.role,
    text: m.text,
    textKey: m.textKey,
    vars: m.vars,
    foodIds: m.foodIds ? m.foodIds.split(",").filter(Boolean) : [],
    createdAt: m.createdAt,
  };
}

export async function GET() {
  try {
    const prof = await ensureProfile();
    let msgs = await db.select().from(coachMessages).orderBy(asc(coachMessages.id)).limit(200);
    if (msgs.length === 0) {
      const seeded = await db
        .insert(coachMessages)
        .values({ role: "coach", textKey: "r_greeting", vars: { name: prof.name } })
        .returning();
      msgs = seeded;
    }
    return json({ messages: msgs.map(serialize) });
  } catch (err) {
    console.error("coach GET error", err);
    return json({ error: "failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { text?: string; intent?: string };
    const text = typeof body.text === "string" ? body.text.trim().slice(0, 400) : "";
    const explicit = typeof body.intent === "string" && VALID_INTENTS.has(body.intent as Intent)
      ? (body.intent as Intent)
      : undefined;

    const { ctx } = await buildCtx();

    let userMsg = null;
    if (text) {
      const inserted = await db.insert(coachMessages).values({ role: "user", text }).returning();
      userMsg = inserted[0];
    }

    const countRow = await db.select().from(coachMessages).orderBy(desc(coachMessages.id)).limit(1);
    const seed = (countRow[0]?.id ?? 0) + (text.length || 1);

    // Free Gemini coach when key is present and user typed free-form text
    if (text && !explicit) {
      const live = await tryGeminiCoach(text, ctx);
      if (live) {
        const coachMsg = await db
          .insert(coachMessages)
          .values({ role: "coach", text: live.text })
          .returning();
        return json({ userMsg: userMsg ? serialize(userMsg) : null, coachMsg: serialize(coachMsg[0]) });
      }
    }

    const intent = explicit ?? (text ? detectIntent(text) : "fallback");
    const reply = buildReply(intent, ctx, seed);

    const coachMsg = await db
      .insert(coachMessages)
      .values({
        role: "coach",
        textKey: reply.textKey,
        vars: reply.vars ?? null,
        foodIds: reply.foodIds?.join(",") ?? null,
      })
      .returning();

    return json({ userMsg: userMsg ? serialize(userMsg) : null, coachMsg: serialize(coachMsg[0]) });
  } catch (err) {
    console.error("coach POST error", err);
    return json({ error: "failed" }, { status: 500 });
  }
}
