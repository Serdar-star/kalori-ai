import { analyzeMealImage, type RealAnalysis } from "@/lib/ai";
import { alternativesFor, findFood, foodTotals, pickFoodFromSeed } from "@/lib/foods";
import { analyzeTextOffline, groundAnalysis, groundItem, type GroundedAnalysis } from "@/lib/nutrition-ground";
import { json } from "@/lib/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function toClientPayload(g: GroundedAnalysis, extraFood?: Record<string, unknown>) {
  return {
    food: { ...g.food, ...extraFood },
    items: g.items.map((i) => ({
      name: i.name,
      emoji: i.emoji,
      portion: i.portion,
      grams: i.grams,
      calories: i.calories,
      protein: i.protein,
      carbs: i.carbs,
      fat: i.fat,
      source: i.source,
      dbId: i.dbId,
    })),
    totals: g.totals,
    confidence: g.confidence,
    tipIndex: g.tipIndex,
    alternatives: alternativesFor(
      g.food.id === "ai" || g.food.id === "offline" ? "poke" : g.food.id
    ).map((f) => ({
      id: f.id,
      name: f.name,
      image: f.image,
      calories: foodTotals(f).calories,
    })),
    engine: g.engine,
    verified: g.verified,
    groundedRatio: Math.round(g.groundedRatio * 100),
  };
}

function finalizeFromVision(real: RealAnalysis) {
  const groundedItems = real.items.map((i) =>
    groundItem({
      name: i.name,
      emoji: i.emoji,
      portion: i.portion,
      grams: i.grams,
      calories: i.calories,
      protein: i.protein,
      carbs: i.carbs,
      fat: i.fat,
    })
  );

  const items = groundedItems.filter(
    (i) => i.calories > 0 || i.grams >= 1 || i.source === "usda_local"
  );

  const totals = {
    calories: items.reduce((s, i) => s + i.calories, 0),
    protein: Math.round(items.reduce((s, i) => s + i.protein, 0) * 10) / 10,
    carbs: Math.round(items.reduce((s, i) => s + i.carbs, 0) * 10) / 10,
    fat: Math.round(items.reduce((s, i) => s + i.fat, 0) * 10) / 10,
  };

  const groundedCount = items.filter((i) => i.source === "usda_local").length;
  const groundedRatio = items.length ? groundedCount / items.length : 0;
  const conf = Math.min(0.98, Math.round((real.confidence * 0.55 + groundedRatio * 0.45) * 100) / 100);

  const g: GroundedAnalysis = {
    food: real.food,
    items,
    totals,
    confidence: conf,
    tipIndex: real.tipIndex,
    engine: real.engine ?? "gemini",
    groundedRatio,
    verified: groundedRatio >= 0.5,
  };
  return g;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { seed?: string; hint?: string; image?: string; text?: string };
    const seed = typeof body.seed === "string" ? body.seed : "kalora";
    const image = typeof body.image === "string" && body.image.length < 2_500_000 ? body.image : undefined;
    const text = typeof body.text === "string" ? body.text.trim().slice(0, 200) : undefined;

    // 1) Real vision → ground macros on free USDA-style DB
    if (image && (process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY)) {
      const real = await analyzeMealImage(image);
      if (real) {
        return json(toClientPayload(finalizeFromVision(real)));
      }
    }

    // 2) Free-text ingredients (no image) — fully offline DB
    if (text) {
      const offline = analyzeTextOffline(text);
      if (offline) return json(toClientPayload(offline));
    }

    // 3) Local catalog demo (seed / hint) — still ground items
    let result: ReturnType<typeof pickFoodFromSeed>;
    const hinted = typeof body.hint === "string" ? findFood(body.hint) : undefined;
    if (hinted) {
      result = { food: hinted, scale: 1, confidence: 0.96 };
    } else {
      result = pickFoodFromSeed(seed);
    }

    const totals = foodTotals(result.food, result.scale);
    const fake: RealAnalysis = {
      food: {
        id: result.food.id,
        name: result.food.name,
        emoji: "🍽️",
        healthScore: result.food.healthScore,
        portion:
          result.scale > 1.05 ? "large portion" : result.scale < 0.92 ? "small portion" : "1 serving",
      },
      items: result.food.items.map((i) => ({
        name: i.name,
        emoji: "🍽️",
        portion: i.portion,
        calories: Math.round(i.calories * result.scale),
        protein: Math.round(i.protein * result.scale * 10) / 10,
        carbs: Math.round(i.carbs * result.scale * 10) / 10,
        fat: Math.round(i.fat * result.scale * 10) / 10,
      })),
      totals: {
        calories: totals.calories,
        protein: totals.protein,
        carbs: totals.carbs,
        fat: totals.fat,
      },
      confidence: Math.round(result.confidence * 100) / 100,
      tipIndex: 0,
    };

    const grounded = groundAnalysis(fake, "local");
    return json(
      toClientPayload(grounded, {
        id: result.food.id,
        image: result.food.image,
        healthScore: result.food.healthScore,
      })
    );
  } catch (err) {
    console.error("analyze error", err);
    return json({ error: "analysis failed" }, { status: 500 });
  }
}
