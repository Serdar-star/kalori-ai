/** Offline / sandbox fallback catalog when Open Food Facts is unreachable. */

export interface LocalProduct {
  code: string;
  name: string;
  brand: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  healthScore: number;
  image?: string | null;
  tags?: string[];
}

export const LOCAL_BARCODES: LocalProduct[] = [
  {
    code: "3017620422003",
    name: "Nutella",
    brand: "Ferrero",
    portion: "15 g (1 tbsp)",
    calories: 80,
    protein: 0.9,
    carbs: 8.6,
    fat: 4.7,
    healthScore: 28,
    tags: ["spread", "chocolate", "hazelnut"],
  },
  {
    code: "5449000000996",
    name: "Coca-Cola Classic",
    brand: "Coca-Cola",
    portion: "330 ml can",
    calories: 139,
    protein: 0,
    carbs: 35,
    fat: 0,
    healthScore: 22,
    tags: ["soda", "drink"],
  },
  {
    code: "8690504123456",
    name: "Sütaş Protein Yoğurt",
    brand: "Sütaş",
    portion: "200 g",
    calories: 130,
    protein: 15,
    carbs: 8,
    fat: 3.5,
    healthScore: 82,
    tags: ["yogurt", "protein", "dairy"],
  },
  {
    code: "8690123123456",
    name: "Eti Browni Intense",
    brand: "Eti",
    portion: "1 bar (45 g)",
    calories: 210,
    protein: 2.5,
    carbs: 26,
    fat: 11,
    healthScore: 30,
    tags: ["snack", "chocolate"],
  },
  {
    code: "4008400401122",
    name: "Haribo Goldbears",
    brand: "Haribo",
    portion: "25 g",
    calories: 86,
    protein: 1.7,
    carbs: 19,
    fat: 0.1,
    healthScore: 25,
    tags: ["candy", "gummy"],
  },
  {
    code: "5000112587465",
    name: "Evian Natural Mineral Water",
    brand: "Evian",
    portion: "500 ml",
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    healthScore: 100,
    tags: ["water", "drink"],
  },
  {
    code: "8076809513388",
    name: "Barilla Spaghetti n.5",
    brand: "Barilla",
    portion: "100 g dry",
    calories: 359,
    protein: 12.5,
    carbs: 71.2,
    fat: 2,
    healthScore: 62,
    tags: ["pasta", "carbs"],
  },
  {
    code: "3017620425035",
    name: "Kinder Bueno",
    brand: "Kinder",
    portion: "2 bars (43 g)",
    calories: 244,
    protein: 3.6,
    carbs: 23,
    fat: 15,
    healthScore: 26,
    tags: ["chocolate", "snack"],
  },
  {
    code: "8690777201014",
    name: "Ülker Çikolatalı Gofret",
    brand: "Ülker",
    portion: "1 pack (36 g)",
    calories: 190,
    protein: 2.2,
    carbs: 22,
    fat: 10.5,
    healthScore: 28,
    tags: ["wafer", "chocolate"],
  },
  {
    code: "8410076472470",
    name: "Activia Natural Yogurt",
    brand: "Danone",
    portion: "125 g",
    calories: 78,
    protein: 4.2,
    carbs: 5.5,
    fat: 3.8,
    healthScore: 78,
    tags: ["yogurt", "probiotic"],
  },
  {
    code: "7622210717780",
    name: "Oreo Original",
    brand: "Oreo",
    portion: "2 cookies (22 g)",
    calories: 106,
    protein: 1,
    carbs: 15.5,
    fat: 4.5,
    healthScore: 24,
    tags: ["cookie", "snack"],
  },
  {
    code: "8690146123457",
    name: "Pınar Labne",
    brand: "Pınar",
    portion: "30 g",
    calories: 70,
    protein: 2.5,
    carbs: 1.5,
    fat: 6,
    healthScore: 55,
    tags: ["cheese", "dairy", "spread"],
  },
];

export function findLocalByCode(code: string): LocalProduct | undefined {
  const c = code.replace(/\D/g, "");
  return LOCAL_BARCODES.find((p) => p.code === c || p.code.endsWith(c) || c.endsWith(p.code));
}

export function searchLocal(q: string): LocalProduct[] {
  const s = q.toLowerCase().trim();
  if (!s) return LOCAL_BARCODES.slice(0, 8);
  return LOCAL_BARCODES.filter(
    (p) =>
      p.name.toLowerCase().includes(s) ||
      p.brand.toLowerCase().includes(s) ||
      (p.tags ?? []).some((t) => t.includes(s)) ||
      p.code.includes(s)
  ).slice(0, 8);
}

export function toApiProduct(p: LocalProduct) {
  return {
    name: p.name,
    brand: p.brand,
    image: p.image ?? null,
    portion: p.portion,
    calories: p.calories,
    protein: p.protein,
    carbs: p.carbs,
    fat: p.fat,
    healthScore: p.healthScore,
    nutriscore: null as string | null,
    code: p.code,
  };
}
