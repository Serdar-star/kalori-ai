import { findLocalByCode, searchLocal, toApiProduct } from "@/lib/barcode-local";
import { json } from "@/lib/server";

export const dynamic = "force-dynamic";

interface OffProduct {
  code?: string;
  product_name?: string;
  product_name_en?: string;
  brands?: string;
  image_front_small_url?: string;
  image_url?: string;
  nutriscore_grade?: string;
  nutriments?: {
    "energy-kcal_100g"?: number;
    "energy-kcal_serving"?: number;
    proteins_100g?: number;
    proteins_serving?: number;
    carbohydrates_100g?: number;
    carbohydrates_serving?: number;
    fat_100g?: number;
    fat_serving?: number;
    "energy-kcal"?: number;
  };
  serving_size?: string;
  quantity?: string;
}

function healthFromNutri(grade?: string): number {
  const g = (grade ?? "").toLowerCase();
  if (g === "a") return 92;
  if (g === "b") return 80;
  if (g === "c") return 65;
  if (g === "d") return 48;
  if (g === "e") return 32;
  return 70;
}

function pick(
  n: OffProduct["nutriments"],
  k100: keyof NonNullable<OffProduct["nutriments"]>,
  kSrv: keyof NonNullable<OffProduct["nutriments"]>
) {
  if (!n) return 0;
  const srv = n[kSrv];
  if (typeof srv === "number" && Number.isFinite(srv)) return srv;
  const per100 = n[k100];
  if (typeof per100 === "number" && Number.isFinite(per100)) return per100;
  return 0;
}

function mapOff(p: OffProduct, code?: string) {
  const name = (p.product_name || p.product_name_en || p.brands || "Product").slice(0, 80);
  const n = p.nutriments ?? {};
  const calories = Math.round(pick(n, "energy-kcal_100g", "energy-kcal_serving") || n["energy-kcal"] || 0);
  const protein = Math.round(pick(n, "proteins_100g", "proteins_serving") * 10) / 10;
  const carbs = Math.round(pick(n, "carbohydrates_100g", "carbohydrates_serving") * 10) / 10;
  const fat = Math.round(pick(n, "fat_100g", "fat_serving") * 10) / 10;
  return {
    name,
    brand: (p.brands ?? "").split(",")[0]?.trim().slice(0, 40) || null,
    image: p.image_front_small_url || p.image_url || null,
    portion: p.serving_size || p.quantity || "1 serving",
    calories: Math.max(0, Math.min(2500, calories)),
    protein: Math.max(0, Math.min(200, protein)),
    carbs: Math.max(0, Math.min(400, carbs)),
    fat: Math.max(0, Math.min(200, fat)),
    healthScore: healthFromNutri(p.nutriscore_grade),
    nutriscore: p.nutriscore_grade ?? null,
    code: code || p.code || null,
  };
}

async function fetchOffCode(code: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4500);
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json`, {
      headers: { "User-Agent": "Kalora/1.0 (nutrition-app)" },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { status?: number; product?: OffProduct };
    if (data.status !== 1 || !data.product) return null;
    return mapOff(data.product, code);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchOffSearch(q: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4500);
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=8`,
      { headers: { "User-Agent": "Kalora/1.0 (nutrition-app)" }, signal: controller.signal }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { products?: OffProduct[] };
    return (data.products ?? [])
      .filter((p) => p.product_name || p.product_name_en)
      .slice(0, 8)
      .map((p) => mapOff(p));
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const code = (url.searchParams.get("code") ?? "").replace(/\D/g, "").slice(0, 18);
    const q = (url.searchParams.get("q") ?? "").trim().slice(0, 80);

    if (code.length >= 8) {
      const remote = await fetchOffCode(code);
      if (remote) return json({ source: "openfoodfacts", code, product: remote });
      const local = findLocalByCode(code);
      if (local) return json({ source: "local", code, product: toApiProduct(local) });
      return json({ error: "not_found" }, { status: 404 });
    }

    if (q.length >= 2) {
      const remote = await fetchOffSearch(q);
      if (remote && remote.length > 0) return json({ source: "openfoodfacts", results: remote });
      const local = searchLocal(q).map(toApiProduct);
      return json({ source: "local", results: local });
    }

    return json({ error: "code or q required" }, { status: 400 });
  } catch (err) {
    console.error("barcode error", err);
    // still try local on catastrophic failure
    const url = new URL(req.url);
    const code = (url.searchParams.get("code") ?? "").replace(/\D/g, "");
    const q = (url.searchParams.get("q") ?? "").trim();
    if (code) {
      const local = findLocalByCode(code);
      if (local) return json({ source: "local", code, product: toApiProduct(local) });
    }
    if (q) return json({ source: "local", results: searchLocal(q).map(toApiProduct) });
    return json({ error: "lookup failed" }, { status: 500 });
  }
}
