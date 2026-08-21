import type { Entry, Profile } from "@/db/schema";
import { FOODS, foodTotals, type Food } from "@/lib/foods";

export interface CoachCtx {
  profile: Profile;
  todayEntries: Entry[];
  totals: { calories: number; protein: number; carbs: number; fat: number };
  waterMl: number;
  streakCurrent: number;
  weekLogs: number;
  weekAvg: number;
}

/** Optional free Gemini reply when key is set; falls back to local intents. */
export async function tryGeminiCoach(
  userText: string,
  ctx: CoachCtx
): Promise<{ text: string } | null> {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key || !userText.trim()) return null;

  const left = ctx.profile.dailyCalories - ctx.totals.calories;
  const prompt = `You are Kalora, a friendly free nutrition coach. Be concise (2-4 short sentences).
User profile: goal=${ctx.profile.goal}, daily kcal target=${ctx.profile.dailyCalories}, protein goal=${ctx.profile.proteinGoal}g.
Today: eaten ${ctx.totals.calories} kcal (P${Math.round(ctx.totals.protein)} C${Math.round(ctx.totals.carbs)} F${Math.round(ctx.totals.fat)}), remaining ~${left} kcal, water ${ctx.waterMl}ml / ${ctx.profile.waterGoalMl}ml, streak ${ctx.streakCurrent} days.
Meals today: ${ctx.todayEntries.map((e) => e.name).slice(0, 8).join(", ") || "none yet"}.
User says: "${userText.slice(0, 300)}"
Reply in the same language as the user. No medical claims. Suggest practical food ideas that fit remaining macros.`;

  try {
    const model = (process.env.GEMINI_MODEL || "gemini-2.0-flash").trim();
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12_000);
    const res = await fetch(endpoint, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.6, maxOutputTokens: 280 },
      }),
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("").trim();
    if (!text || text.length < 8) return null;
    return { text: text.slice(0, 900) };
  } catch {
    return null;
  }
}

export type Intent =
  | "status"
  | "eat"
  | "protein"
  | "motivate"
  | "water"
  | "summary"
  | "tip"
  | "fallback";

const KEYWORDS: Partial<Record<Intent, string[]>> = {
  status: [
    "how am i", "how's my day", "hows my day", "nasıl gidiyor", "nasil gidiyor", "günüm nasıl",
    "cómo voy", "como voy", "comment ça va", "wie läuft", "come va", "как дела", "как мой день",
    "どう？", "어때", "怎么样", "कैसा", "কেমন", "کیسا",
  ],
  eat: [
    "what should i eat", "ne yemeli", "ne yesem", "qué como", "que comer", "je mange quoi",
    "was soll ich essen", "cosa mangio", "что поесть", "что мне есть", "何を食べ", "뭐 먹",
    "吃什么", "क्या खा", "কী খাব", "کیا کھا",
  ],
  protein: [
    "protein", "proteína", "protéine", "eiweiß", "белок", "белка", "タンパク", "단백", "蛋白质",
    "प्रोटीन", "بروتين", "প্রোটিন", "پروٹین",
  ],
  motivate: [
    "motiv", "мотив", "поддерж", "やる気", "モチベ", "동기", "힘내", "动力", "加油",
    "प्रेरणा", "تحفيز", "حوصلہ",
  ],
  water: [
    "water", "agua", "água", "eau", "wasser", "acqua", "вода", "水", "물", "पानी",
    "ماء", "পানি", "پانی", "hidrat",
  ],
  summary: [
    "özet", "summary", "resumen", "résumé", "bilan", "zusammenfassung", "riassunto",
    "итог", "итоги", "要約", "요약", "总结", "सारांश", "ملخص", "সারাংশ", "خلاصہ",
  ],
};

const TIP_RE = /tip|ipucu|consejo|conseil|tipp|consiglio|совет|ヒント|팁|建议|सुझाव|نصيحة|পরামর্শ|مشورہ/;
const WATER_TR_RE = /(^|[^a-zçğıöşü])su(m|yum|mu|durum)?([^a-zçğıöşü]|$)/;

export function detectIntent(raw: string): Intent {
  const text = raw.toLowerCase();
  const order: Intent[] = ["summary", "protein", "motivate", "water", "eat", "status"];
  for (const intent of order) {
    const words = KEYWORDS[intent] ?? [];
    if (words.some((k) => text.includes(k))) return intent;
  }
  if (WATER_TR_RE.test(text)) return "water";
  if (TIP_RE.test(text)) return "tip";
  return "fallback";
}

export interface CoachReply {
  textKey: string;
  vars?: Record<string, string | number>;
  foodIds?: string[];
}

export function buildReply(intent: Intent, ctx: CoachCtx, seed: number): CoachReply {
  const p = ctx.profile;
  const eaten = ctx.totals.calories;
  const left = p.dailyCalories - eaten;

  switch (intent) {
    case "status": {
      if (ctx.todayEntries.length === 0) return { textKey: "r_status_empty" };
      if (left < -50) return { textKey: "r_status_over", vars: { eaten, over: Math.abs(left) } };
      if (Math.abs(left) <= 150) return { textKey: "r_status_great", vars: { eaten, left } };
      return {
        textKey: "r_status_ok",
        vars: { eaten, left, protein: Math.round(ctx.totals.protein), pgoal: p.proteinGoal },
      };
    }
    case "eat":
      return { textKey: "r_eat", foodIds: pickFoods(ctx, "balanced") };
    case "protein":
      return { textKey: "r_protein", foodIds: pickFoods(ctx, "protein") };
    case "motivate":
      return { textKey: `r_motivate_${(seed % 3) + 1}` };
    case "water": {
      const remaining = Math.max(0, p.waterGoalMl - ctx.waterMl);
      return { textKey: "r_water", vars: { had: ctx.waterMl, goal: p.waterGoalMl, left: remaining } };
    }
    case "summary":
      return { textKey: "r_summary", vars: { logs: ctx.weekLogs, avg: ctx.weekAvg, streak: ctx.streakCurrent } };
    case "tip":
      return { textKey: `tip_${seed % 6}` };
    default:
      return { textKey: "r_fallback" };
  }
}

function pickFoods(ctx: CoachCtx, mode: "balanced" | "protein"): string[] {
  const remainingKcal = Math.max(140, ctx.profile.dailyCalories - ctx.totals.calories);
  const proteinLeft = ctx.profile.proteinGoal - ctx.totals.protein;

  const fits = FOODS.filter((f) => foodTotals(f).calories <= remainingKcal);
  const pool = fits.length >= 3 ? fits : [...FOODS].sort((a, b) => foodTotals(a).calories - foodTotals(b).calories).slice(0, 3);

  const score = (f: Food) => {
    const t = foodTotals(f);
    if (mode === "protein") return t.protein * 3 - t.calories / 40;
    return t.protein * (proteinLeft > 25 ? 2.6 : 1) + f.healthScore / 6 - Math.abs(t.calories - remainingKcal / 2) / 80;
  };

  return [...pool]
    .sort((a, b) => score(b) - score(a))
    .slice(0, 3)
    .map((f) => f.id);
}
