/**
 * Vision AI for meal photos (identity + portion only).
 * Macros are grounded afterwards against the free offline USDA-style DB
 * so values stay real even when the model hallucinates calories.
 *
 * Priority: Gemini (free tier) → OpenAI → caller uses local engine.
 */

export interface RealAnalysis {
  food: { id: string; name: string; emoji: string; healthScore: number; portion: string };
  items: {
    name: string;
    emoji: string;
    portion: string;
    grams?: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }[];
  totals: { calories: number; protein: number; carbs: number; fat: number };
  confidence: number;
  tipIndex: number;
  engine?: "gemini" | "gpt";
}

/**
 * Critical: ask for IDENTITY + GRAMS, not invented nutrition.
 * Nutrition is filled from our free DB after this returns.
 */
const SYSTEM_PROMPT = `You are a professional nutrition vision model inside a calorie-tracking app.
Identify EVERY visible edible item in the photo — including tiny herbs, spices, seeds, oil drizzle, sauces, and garnishes (e.g. basil leaf, parsley, chili flake, sesame seed).

Respond with STRICT JSON only (no markdown), exactly this shape:
{
  "name": "short dish name (max 5 words)",
  "emoji": "one single emoji for the dish",
  "healthScore": integer 0-100,
  "confidence": number 0-1,
  "tipIndex": integer 0-5,
  "items": [
    {
      "name": "specific ingredient name in English (e.g. 'Fresh basil', 'Grilled chicken breast', 'Olive oil')",
      "emoji": "one emoji",
      "portion": "human readable, e.g. '120 g' or '1 tbsp' or '3 leaves'",
      "grams": number (estimated edible weight in grams for the VISIBLE amount),
      "calories": number (rough estimate ok — will be recalculated),
      "protein": number,
      "carbs": number,
      "fat": number
    }
  ]
}

Rules:
- 2 to 10 items. Prefer separate ingredients over one vague "meal".
- ALWAYS include herbs/spices/garnish if visible, even 1–5 g.
- "grams" is REQUIRED and must be realistic for what you see:
  • herbs/leaves: 1–8 g
  • oil/dressing drizzle: 5–20 g
  • protein portion: 80–200 g
  • cooked rice/pasta: 100–250 g
  • sauce: 15–60 g
- Name ingredients specifically so they can be matched to a food database
  (prefer "Fresh basil" not "greens"; "Olive oil" not "sauce").
- If unsure between two foods, pick the more common one and lower confidence.`;

interface ModelJson {
  name?: string;
  emoji?: string;
  healthScore?: number;
  confidence?: number;
  tipIndex?: number;
  items?: {
    name?: string;
    emoji?: string;
    portion?: string;
    grams?: number;
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

function parseAnalysis(content: string): RealAnalysis | null {
  const cleaned = content.replace(/```json|```/g, "").trim();
  let parsed: ModelJson;
  try {
    parsed = JSON.parse(cleaned) as ModelJson;
  } catch {
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try {
      parsed = JSON.parse(m[0]) as ModelJson;
    } catch {
      return null;
    }
  }

  const items = (parsed.items ?? [])
    .slice(0, 10)
    .filter((i) => i && typeof i.name === "string" && i.name.trim().length > 0)
    .map((i) => {
      const gramsRaw = Number(i.grams);
      const grams = Number.isFinite(gramsRaw) && gramsRaw > 0 ? Math.round(gramsRaw * 10) / 10 : undefined;
      return {
        name: String(i.name).slice(0, 60),
        emoji: typeof i.emoji === "string" && i.emoji.length <= 8 ? i.emoji : "🍽️",
        portion: String(i.portion ?? (grams ? `${grams} g` : "—")).slice(0, 40),
        grams,
        calories: Math.round(clamp(i.calories, 0, 2500)),
        protein: Math.round(clamp(i.protein, 0, 200) * 10) / 10,
        carbs: Math.round(clamp(i.carbs, 0, 400) * 10) / 10,
        fat: Math.round(clamp(i.fat, 0, 200) * 10) / 10,
      };
    });

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
}

async function imageToInline(imageUrl: string): Promise<{ mime: string; data: string } | null> {
  try {
    if (imageUrl.startsWith("data:")) {
      const m = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!m) return null;
      return { mime: m[1] || "image/jpeg", data: m[2] };
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15_000);
    const res = await fetch(imageUrl, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const mime = res.headers.get("content-type")?.split(";")[0] || "image/jpeg";
    return { mime, data: buf.toString("base64") };
  } catch {
    return null;
  }
}

export async function analyzeWithGemini(imageUrl: string): Promise<RealAnalysis | null> {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key || !imageUrl) return null;

  try {
    const inline = await imageToInline(imageUrl);
    if (!inline) {
      console.error("Gemini: could not load image");
      return null;
    }

    const model = (process.env.GEMINI_MODEL || "gemini-2.0-flash").trim();
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 35_000);

    const res = await fetch(endpoint, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: `${SYSTEM_PROMPT}\n\nAnalyze this meal photo. Return JSON only.` },
              {
                inline_data: {
                  mime_type: inline.mime,
                  data: inline.data,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.15,
          maxOutputTokens: 1200,
          responseMimeType: "application/json",
        },
      }),
    });
    clearTimeout(timer);

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("Gemini error", res.status, errText.slice(0, 300));
      return null;
    }

    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const content = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    if (!content) return null;

    const analysis = parseAnalysis(content);
    if (!analysis) return null;
    return { ...analysis, engine: "gemini" };
  } catch (err) {
    console.error("Gemini analysis failed, falling back", err);
    return null;
  }
}

export async function analyzeWithOpenAI(imageUrl: string): Promise<RealAnalysis | null> {
  const key = process.env.OPENAI_API_KEY?.trim();
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
        temperature: 0.15,
        max_tokens: 1200,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this meal photo. Return JSON only." },
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
    const analysis = parseAnalysis(content);
    if (!analysis) return null;
    return { ...analysis, engine: "gpt" };
  } catch (err) {
    console.error("OpenAI analysis failed, falling back to local engine", err);
    return null;
  }
}

export async function analyzeMealImage(imageUrl: string): Promise<RealAnalysis | null> {
  if (process.env.GEMINI_API_KEY?.trim()) {
    const g = await analyzeWithGemini(imageUrl);
    if (g) return g;
  }
  if (process.env.OPENAI_API_KEY?.trim()) {
    return analyzeWithOpenAI(imageUrl);
  }
  return null;
}
