/**
 * Real vision AI analysis via OpenAI (used when OPENAI_API_KEY is set).
 * Falls back gracefully — the caller decides what to do when this returns null.
 */

export interface RealAnalysis {
  food: { id: string; name: string; emoji: string; healthScore: number; portion: string };
  items: { name: string; emoji: string; portion: string; calories: number; protein: number; carbs: number; fat: number }[];
  totals: { calories: number; protein: number; carbs: number; fat: number };
  confidence: number;
  tipIndex: number;
}

const SYSTEM_PROMPT = `You are a nutrition AI inside a calorie-tracking app.
Analyze the meal photo and respond with STRICT JSON only (no markdown), exactly this shape:
{
  "name": "short dish name (max 4 words)",
  "emoji": "one single emoji for the dish",
  "healthScore": integer 0-100 (100 = extremely healthy),
  "confidence": number 0-1 (how sure you are about the identification),
  "tipIndex": integer 0-5 (pick any),
  "items": [{ "name": "ingredient name", "emoji": "one emoji", "portion": "e.g. 150 g / 2 slices", "calories": number, "protein": grams, "carbs": grams, "fat": grams }]
Rules:
- 2 to 7 items, estimate realistic portions from the photo.
- Nutrition values are per item, for the visible portion.
- Use best nutritional knowledge when the dish is unknown.`;

interface OpenAIJson {
  name?: string;
  emoji?: string;
  healthScore?: number;
  confidence?: number;
  tipIndex?: number;
  items?: {
    name?: string;
    emoji?: string;
    portion?: string;
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  }[];
}

const clamp = (n: unknown, min: number, max: number, fallback = 0) => {
  const v = Number(n);
  return Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;
};

export async function analyzeWithOpenAI(imageUrl: string): Promise<RealAnalysis | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key || !imageUrl) return null;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30_000);

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        max_tokens: 900,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this meal photo." },
              { type: "image_url", image_url: { url: imageUrl, detail: "low" } },
            ],
          },
        ],
      }),
    });
    clearTimeout(timer);

    if (!res.ok) {
      console.error("OpenAI error", res.status);
      return null;
    }

    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = data.choices?.[0]?.message?.content ?? "";
    const parsed = JSON.parse(content.replace(/```json|```/g, "").trim()) as OpenAIJson;

    const items = (parsed.items ?? [])
      .slice(0, 8)
      .filter((i) => i && typeof i.name === "string" && i.name.trim().length > 0)
      .map((i) => ({
        name: String(i.name).slice(0, 60),
        emoji: typeof i.emoji === "string" && i.emoji.length <= 8 ? i.emoji : "🍽️",
        portion: String(i.portion ?? "—").slice(0, 40),
        calories: Math.round(clamp(i.calories, 0, 2500)),
        protein: Math.round(clamp(i.protein, 0, 200) * 10) / 10,
        carbs: Math.round(clamp(i.carbs, 0, 400) * 10) / 10,
        fat: Math.round(clamp(i.fat, 0, 200) * 10) / 10,
      }));

    if (items.length === 0) return null;

    const totals = {
      calories: items.reduce((s, i) => s + i.calories, 0),
      protein: Math.round(items.reduce((s, i) => s + i.protein, 0) * 10) / 10,
      carbs: Math.round(items.reduce((s, i) => s + i.carbs, 0) * 10) / 10,
      fat: Math.round(items.reduce((s, i) => s + i.fat, 0) * 10) / 10,
    };

    return {
      food: {
        id: "ai",
        name: String(parsed.name ?? "Meal").slice(0, 60),
        emoji: typeof parsed.emoji === "string" && parsed.emoji.length <= 8 ? parsed.emoji : "🍽️",
        healthScore: Math.round(clamp(parsed.healthScore, 5, 100, 60)),
        portion: "1 serving",
      },
      items,
      totals,
      confidence: Math.round(clamp(parsed.confidence, 0.5, 0.99, 0.85) * 100) / 100,
      tipIndex: Math.round(clamp(parsed.tipIndex, 0, 5)) % 6,
    };
  } catch (err) {
    console.error("OpenAI analysis failed, falling back to local engine", err);
    return null;
  }
}
