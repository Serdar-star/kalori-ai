/**
 * Ground vision / free-text food detections against the free offline nutrition DB.
 * AI is only trusted for identity + portion size; macros come from USDA-style table.
 */

import type { RealAnalysis } from "@/lib/ai";
import {
  findNutri,
  macrosForGrams,
  parsePortionGrams,
  type NutriFood,
} from "@/lib/nutrition-db";

export interface GroundedItem {
  name: string;
  emoji: string;
  portion: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  /** matched DB food id, or null if unmatched */
  dbId: string | null;
  /** match confidence 0-100 */
  matchScore: number;
  source: "usda_local" | "model_estimate";
}

export interface GroundedAnalysis {
  food: RealAnalysis["food"];
  items: GroundedItem[];
  totals: RealAnalysis["totals"];
  confidence: number;
  tipIndex: number;
  engine: RealAnalysis["engine"] | "local";
  /** share of items grounded in real DB */
  groundedRatio: number;
  verified: boolean;
}

function defaultGramsForCategory(food: NutriFood | null, name: string): number {
  const n = name.toLowerCase();
  if (/oil|yağ|dressing|sos|sauce|vinegar/.test(n)) return 12;
  if (/herb|basil|parsley|mint|dill|cilantro|spice|ot|fesleğen|maydanoz|nane|kekik|sprinkle|pinch|leaf|yaprak/.test(n))
    return 3;
  if (/seed|tohum|chia|sesame|susam/.test(n)) return 10;
  if (/nut|almond|walnut|peanut|badem|ceviz|fıstık/.test(n)) return 20;
  if (/egg|yumurta/.test(n)) return 50;
  if (/bread|toast|ekmek|slice/.test(n)) return 35;
  if (/rice|pasta|noodle|pirinç|makarna/.test(n)) return 150;
  if (/chicken|beef|fish|salmon|meat|tavuk|et|somon/.test(n)) return 120;
  if (/salad|lettuce|greens|salata|marul/.test(n)) return 80;
  if (food?.category === "herb" || food?.category === "spice") return 2;
  if (food?.category === "fat") return 10;
  if (food?.category === "drink") return 250;
  if (food?.category === "condiment") return 15;
  return 80;
}

export function groundItem(raw: {
  name: string;
  emoji?: string;
  portion?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  grams?: number;
}): GroundedItem {
  const match = findNutri(raw.name);
  const food = match?.food ?? null;
  const score = match?.score ?? 0;

  let grams =
    typeof raw.grams === "number" && raw.grams > 0
      ? raw.grams
      : parsePortionGrams(raw.portion ?? "", 0);

  if (!grams || grams <= 0) {
    grams = defaultGramsForCategory(food, raw.name);
  }

  // Cap ridiculous herb portions from bad AI
  if (food && (food.category === "herb" || food.category === "spice") && grams > 30) {
    grams = Math.min(grams, 15);
  }

  if (food && score >= 45) {
    const m = macrosForGrams(food, grams);
    return {
      name: food.name,
      emoji: raw.emoji && raw.emoji.length <= 8 ? raw.emoji : food.emoji,
      portion: `${m.grams} g`,
      grams: m.grams,
      calories: m.calories,
      protein: m.protein,
      carbs: m.carbs,
      fat: m.fat,
      dbId: food.id,
      matchScore: score,
      source: "usda_local",
    };
  }

  // Unmatched — keep model numbers but clamp, mark as estimate
  const kcal = Math.max(0, Math.min(2500, Math.round(Number(raw.calories) || 0)));
  return {
    name: String(raw.name).slice(0, 60),
    emoji: raw.emoji && raw.emoji.length <= 8 ? raw.emoji : "🍽️",
    portion: raw.portion ? String(raw.portion).slice(0, 40) : `${Math.round(grams)} g`,
    grams: Math.round(grams * 10) / 10,
    calories: kcal,
    protein: Math.round((Number(raw.protein) || 0) * 10) / 10,
    carbs: Math.round((Number(raw.carbs) || 0) * 10) / 10,
    fat: Math.round((Number(raw.fat) || 0) * 10) / 10,
    dbId: null,
    matchScore: score,
    source: "model_estimate",
  };
}

export function groundAnalysis(
  analysis: RealAnalysis,
  engine: GroundedAnalysis["engine"] = analysis.engine ?? "gemini"
): GroundedAnalysis {
  const items = analysis.items.map((i) =>
    groundItem({
      name: i.name,
      emoji: i.emoji,
      portion: i.portion,
      calories: i.calories,
      protein: i.protein,
      carbs: i.carbs,
      fat: i.fat,
    })
  );

  // Drop empty zero-noise items
  const cleaned = items.filter((i) => i.calories > 0 || i.grams >= 1 || i.source === "usda_local");

  const totals = {
    calories: cleaned.reduce((s, i) => s + i.calories, 0),
    protein: Math.round(cleaned.reduce((s, i) => s + i.protein, 0) * 10) / 10,
    carbs: Math.round(cleaned.reduce((s, i) => s + i.carbs, 0) * 10) / 10,
    fat: Math.round(cleaned.reduce((s, i) => s + i.fat, 0) * 10) / 10,
  };

  const groundedCount = cleaned.filter((i) => i.source === "usda_local").length;
  const groundedRatio = cleaned.length ? groundedCount / cleaned.length : 0;
  const avgHealth =
    cleaned.length > 0
      ? Math.round(
          cleaned.reduce((s, i) => {
            const f = i.dbId ? findNutri(i.name)?.food : null;
            return s + (f?.healthScore ?? analysis.food.healthScore);
          }, 0) / cleaned.length
        )
      : analysis.food.healthScore;

  // Boost confidence when most items are DB-grounded
  const conf = Math.min(
    0.98,
    Math.round((analysis.confidence * 0.55 + groundedRatio * 0.45) * 100) / 100
  );

  return {
    food: {
      ...analysis.food,
      healthScore: avgHealth,
      portion: "1 serving",
    },
    items: cleaned,
    totals,
    confidence: conf,
    tipIndex: analysis.tipIndex,
    engine,
    groundedRatio,
    verified: groundedRatio >= 0.5,
  };
}

/** Pure offline path: match free-text / seed against DB without vision */
export function analyzeTextOffline(text: string): GroundedAnalysis | null {
  const parts = text
    .split(/,|and|&|\+|\/|;|\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1)
    .slice(0, 8);
  if (parts.length === 0) return null;

  // Let groundItem pick category-aware default grams (herbs 3g, oil 12g, protein 120g…)
  const items = parts.map((p) => groundItem({ name: p }));
  const matched = items.filter((i) => i.source === "usda_local");
  if (matched.length === 0) return null;

  const totals = {
    calories: matched.reduce((s, i) => s + i.calories, 0),
    protein: Math.round(matched.reduce((s, i) => s + i.protein, 0) * 10) / 10,
    carbs: Math.round(matched.reduce((s, i) => s + i.carbs, 0) * 10) / 10,
    fat: Math.round(matched.reduce((s, i) => s + i.fat, 0) * 10) / 10,
  };

  return {
    food: {
      id: "offline",
      name: matched
        .slice(0, 3)
        .map((i) => i.name.split(",")[0])
        .join(" · ")
        .slice(0, 48),
      emoji: matched[0]?.emoji ?? "🍽️",
      healthScore: 75,
      portion: "1 serving",
    },
    items: matched,
    totals,
    confidence: 0.82,
    tipIndex: 0,
    engine: "local",
    groundedRatio: 1,
    verified: true,
  };
}
