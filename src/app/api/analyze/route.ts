import { analyzeWithOpenAI } from "@/lib/ai";
import { alternativesFor, findFood, foodTotals, pickFoodFromSeed } from "@/lib/foods";
import { json } from "@/lib/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { seed?: string; hint?: string; image?: string };
    const seed = typeof body.seed === "string" ? body.seed : "kalora";
    const image = typeof body.image === "string" && body.image.length < 2_500_000 ? body.image : undefined;

    // 1) Real vision AI when a key is configured and an image is available
    if (process.env.OPENAI_API_KEY && image) {
      const real = await analyzeWithOpenAI(image);
      if (real) {
        return json({
          ...real,
          alternatives: alternativesFor(real.food.id),
          engine: "gpt",
        });
      }
    }

    // 2) Local demo engine (deterministic, no key needed)
    let result: ReturnType<typeof pickFoodFromSeed>;
    const hinted = typeof body.hint === "string" ? findFood(body.hint) : undefined;
    if (hinted) {
      result = { food: hinted, scale: 1, confidence: 0.96 };
    } else {
      result = pickFoodFromSeed(seed);
    }

    const totals = foodTotals(result.food, result.scale);
    const alternatives = alternativesFor(result.food.id).map((f) => ({
      id: f.id,
      name: f.name,
      image: f.image,
      calories: foodTotals(f).calories,
    }));

    let h = 0;
    for (let i = 0; i < Math.min(seed.length, 200); i++) h = (h * 31 + seed.charCodeAt(i)) % 100000;
    const tipIndex = h % 6;

    return json({
      food: {
        id: result.food.id,
        name: result.food.name,
        image: result.food.image,
        healthScore: result.food.healthScore,
        portionScale: Math.round(result.scale * 100) / 100,
        portion: result.scale > 1.05 ? "large portion" : result.scale < 0.92 ? "small portion" : "1 serving",
      },
      items: result.food.items,
      totals,
      confidence: Math.round(result.confidence * 100) / 100,
      alternatives,
      tipIndex,
      engine: "local",
    });
  } catch (err) {
    console.error("analyze error", err);
    return json({ error: "analysis failed" }, { status: 500 });
  }
}
