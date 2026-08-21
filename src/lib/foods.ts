const px = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&dpr=1&fit=crop&h=320&w=320`;

export interface FoodItem {
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Food {
  id: string;
  name: string;
  image: string;
  healthScore: number; // 0-100
  tags: string[];
  items: FoodItem[];
}

export const FOODS: Food[] = [
  {
    id: "poke",
    name: "Salmon Poke Bowl",
    image: px(4770328),
    healthScore: 88,
    tags: ["fish", "bowl", "rice", "salmon"],
    items: [
      { name: "Sushi rice", portion: "150 g", calories: 195, protein: 4, carbs: 43, fat: 0.5 },
      { name: "Raw salmon", portion: "120 g", calories: 250, protein: 24, carbs: 0, fat: 16 },
      { name: "Avocado", portion: "60 g", calories: 96, protein: 1.2, carbs: 5, fat: 8.8 },
      { name: "Edamame & veggies", portion: "80 g", calories: 95, protein: 7, carbs: 8, fat: 4 },
      { name: "Sesame soy dressing", portion: "1 tbsp", calories: 45, protein: 1, carbs: 4, fat: 2.5 },
    ],
  },
  {
    id: "chicken-salad",
    name: "Grilled Chicken Salad",
    image: px(6428279),
    healthScore: 92,
    tags: ["salad", "chicken", "greens", "healthy"],
    items: [
      { name: "Grilled chicken breast", portion: "150 g", calories: 248, protein: 46, carbs: 0, fat: 5.4 },
      { name: "Mixed greens & tomato", portion: "120 g", calories: 32, protein: 2, carbs: 6, fat: 0.3 },
      { name: "Cherry tomatoes", portion: "60 g", calories: 11, protein: 0.5, carbs: 2.3, fat: 0.1 },
      { name: "Olive oil vinaigrette", portion: "1.5 tbsp", calories: 120, protein: 0, carbs: 1, fat: 13 },
    ],
  },
  {
    id: "oatmeal",
    name: "Oatmeal with Berries",
    image: px(13950821),
    healthScore: 90,
    tags: ["breakfast", "oats", "berries", "porridge"],
    items: [
      { name: "Rolled oats", portion: "60 g", calories: 228, protein: 8, carbs: 40, fat: 4 },
      { name: "Whole milk", portion: "200 ml", calories: 122, protein: 6.4, carbs: 9.4, fat: 6.6 },
      { name: "Blueberries", portion: "80 g", calories: 46, protein: 0.6, carbs: 11.6, fat: 0.3 },
      { name: "Honey drizzle", portion: "1 tsp", calories: 21, protein: 0, carbs: 5.8, fat: 0 },
    ],
  },
  {
    id: "burger",
    name: "Cheeseburger & Fries",
    image: px(10831651),
    healthScore: 38,
    tags: ["burger", "fries", "fast food", "beef"],
    items: [
      { name: "Beef patty & cheese", portion: "1 patty", calories: 380, protein: 22, carbs: 3, fat: 30 },
      { name: "Brioche bun", portion: "1 bun", calories: 210, protein: 7, carbs: 38, fat: 4 },
      { name: "Sauces & veggies", portion: "—", calories: 70, protein: 1, carbs: 7, fat: 4 },
      { name: "French fries", portion: "medium", calories: 365, protein: 4, carbs: 48, fat: 17 },
    ],
  },
  {
    id: "avo-toast",
    name: "Avocado Toast & Eggs",
    image: px(27590337),
    healthScore: 84,
    tags: ["breakfast", "avocado", "toast", "eggs", "brunch"],
    items: [
      { name: "Sourdough bread", portion: "2 slices", calories: 220, protein: 9, carbs: 42, fat: 1.5 },
      { name: "Smashed avocado", portion: "100 g", calories: 160, protein: 2, carbs: 8.5, fat: 14.7 },
      { name: "Poached eggs", portion: "2 eggs", calories: 142, protein: 12.4, carbs: 0.7, fat: 9.5 },
      { name: "Chili & seeds", portion: "—", calories: 18, protein: 0.8, carbs: 1.6, fat: 0.9 },
    ],
  },
  {
    id: "smoothie-bowl",
    name: "Berry Smoothie Bowl",
    image: px(19130868),
    healthScore: 82,
    tags: ["breakfast", "smoothie", "berries", "granola", "acai"],
    items: [
      { name: "Açaí banana blend", portion: "300 g", calories: 240, protein: 4, carbs: 54, fat: 2 },
      { name: "Granola", portion: "35 g", calories: 165, protein: 3.5, carbs: 22, fat: 6.5 },
      { name: "Fresh berries", portion: "90 g", calories: 52, protein: 0.7, carbs: 13, fat: 0.3 },
      { name: "Coconut flakes", portion: "10 g", calories: 65, protein: 0.7, carbs: 2.4, fat: 6.5 },
    ],
  },
  {
    id: "mediterranean",
    name: "Mediterranean Mezze Platter",
    image: px(29253300),
    healthScore: 78,
    tags: ["mediterranean", "hummus", "pita", "falafel", "sharing"],
    items: [
      { name: "Hummus", portion: "100 g", calories: 166, protein: 8, carbs: 14, fat: 9.6 },
      { name: "Falafel", portion: "4 pieces", calories: 230, protein: 7, carbs: 20, fat: 13 },
      { name: "Pita bread", portion: "1.5 loaves", calories: 248, protein: 8, carbs: 51, fat: 1.2 },
      { name: "Greek salad", portion: "150 g", calories: 130, protein: 3, carbs: 7, fat: 10 },
      { name: "Tzatziki", portion: "60 g", calories: 55, protein: 3, carbs: 3, fat: 3.5 },
    ],
  },
  {
    id: "sushi",
    name: "Sushi Platter (12 pc)",
    image: px(8743917),
    healthScore: 76,
    tags: ["sushi", "japanese", "fish", "rice"],
    items: [
      { name: "Salmon nigiri", portion: "4 pc", calories: 196, protein: 8, carbs: 24, fat: 7 },
      { name: "California rolls", portion: "8 pc", calories: 255, protein: 9, carbs: 38, fat: 7 },
      { name: "Soy sauce & wasabi", portion: "—", calories: 20, protein: 1, carbs: 3, fat: 0 },
    ],
  },
  {
    id: "pizza",
    name: "Margherita Pizza",
    image: px(15550301),
    healthScore: 52,
    tags: ["pizza", "italian", "cheese"],
    items: [
      { name: "Margherita slices", portion: "3 slices", calories: 714, protein: 30, carbs: 96, fat: 24 },
      { name: "Basil & olive oil", portion: "—", calories: 45, protein: 0, carbs: 1, fat: 4.5 },
    ],
  },
  {
    id: "yogurt-parfait",
    name: "Greek Yogurt Parfait",
    image: px(4929713),
    healthScore: 86,
    tags: ["breakfast", "snack", "yogurt", "protein"],
    items: [
      { name: "Greek yogurt 2%", portion: "250 g", calories: 180, protein: 24, carbs: 11, fat: 4 },
      { name: "Granola", portion: "30 g", calories: 140, protein: 3, carbs: 19, fat: 5.5 },
      { name: "Strawberries & honey", portion: "100 g", calories: 68, protein: 0.8, carbs: 16, fat: 0.3 },
    ],
  },
  {
    id: "ramen",
    name: "Tonkotsu Ramen",
    image: px(15823266),
    healthScore: 55,
    tags: ["ramen", "noodles", "japanese", "soup"],
    items: [
      { name: "Ramen noodles & broth", portion: "1 bowl", calories: 420, protein: 14, carbs: 62, fat: 13 },
      { name: "Chashu pork", portion: "80 g", calories: 240, protein: 14, carbs: 1, fat: 20 },
      { name: "Soft egg & toppings", portion: "1 egg", calories: 90, protein: 6.5, carbs: 1, fat: 6.5 },
    ],
  },
  {
    id: "pad-thai",
    name: "Chicken Pad Thai",
    image: px(7636375),
    healthScore: 60,
    tags: ["thai", "noodles", "asian", "stir fry"],
    items: [
      { name: "Rice noodles", portion: "180 g", calories: 320, protein: 4, carbs: 68, fat: 2 },
      { name: "Chicken & egg", portion: "120 g", calories: 210, protein: 26, carbs: 1, fat: 11 },
      { name: "Peanuts & sauce", portion: "—", calories: 150, protein: 5, carbs: 12, fat: 9 },
    ],
  },
  {
    id: "steak",
    name: "Steak & Roast Potatoes",
    image: px(7627414),
    healthScore: 64,
    tags: ["dinner", "beef", "steak", "potato"],
    items: [
      { name: "Sirloin steak", portion: "200 g", calories: 410, protein: 42, carbs: 0, fat: 26 },
      { name: "Roast potatoes", portion: "180 g", calories: 235, protein: 4, carbs: 36, fat: 9 },
      { name: "Green beans & butter", portion: "90 g", calories: 85, protein: 2, carbs: 6, fat: 6 },
    ],
  },
  {
    id: "buddha-bowl",
    name: "Quinoa Buddha Bowl",
    image: px(7090155),
    healthScore: 94,
    tags: ["vegan", "bowl", "quinoa", "healthy", "salad"],
    items: [
      { name: "Quinoa", portion: "120 g", calories: 190, protein: 6.5, carbs: 33, fat: 3 },
      { name: "Roast chickpeas", portion: "80 g", calories: 150, protein: 7, carbs: 22, fat: 4 },
      { name: "Kale & sweet potato", portion: "150 g", calories: 110, protein: 3, carbs: 22, fat: 1 },
      { name: "Tahini dressing", portion: "1 tbsp", calories: 89, protein: 2.6, carbs: 3, fat: 8 },
    ],
  },
  {
    id: "pancakes",
    name: "Protein Pancakes",
    image: px(10593645),
    healthScore: 72,
    tags: ["breakfast", "pancakes", "protein", "sweet"],
    items: [
      { name: "Protein pancakes", portion: "3 stack", calories: 340, protein: 28, carbs: 42, fat: 6 },
      { name: "Maple syrup", portion: "2 tbsp", calories: 104, protein: 0, carbs: 27, fat: 0 },
      { name: "Banana slices", portion: "1 medium", calories: 105, protein: 1.3, carbs: 27, fat: 0.4 },
    ],
  },
  {
    id: "curry",
    name: "Chicken Curry & Rice",
    image: px(32986463),
    healthScore: 66,
    tags: ["indian", "curry", "rice", "dinner"],
    items: [
      { name: "Chicken tikka curry", portion: "250 g", calories: 340, protein: 28, carbs: 12, fat: 19 },
      { name: "Basmati rice", portion: "150 g", calories: 195, protein: 4, carbs: 43, fat: 0.5 },
      { name: "Garlic naan bite", portion: "½ naan", calories: 130, protein: 4, carbs: 24, fat: 2 },
    ],
  },
  {
    id: "shrimp-pasta",
    name: "Shrimp Garlic Pasta",
    image: px(8697543),
    healthScore: 58,
    tags: ["pasta", "shrimp", "italian", "dinner"],
    items: [
      { name: "Spaghetti", portion: "110 g dry", calories: 390, protein: 14, carbs: 78, fat: 2 },
      { name: "Garlic butter shrimp", portion: "120 g", calories: 220, protein: 22, carbs: 2, fat: 14 },
      { name: "Parmesan & parsley", portion: "—", calories: 60, protein: 4, carbs: 1, fat: 4.5 },
    ],
  },
  {
    id: "wrap",
    name: "Falafel Wrap",
    image: px(29253297),
    healthScore: 70,
    tags: ["wrap", "falafel", "vegan", "lunch"],
    items: [
      { name: "Flatbread", portion: "1 large", calories: 220, protein: 7, carbs: 44, fat: 2 },
      { name: "Falafel", portion: "5 pieces", calories: 290, protein: 9, carbs: 26, fat: 16 },
      { name: "Hummus & salad", portion: "—", calories: 120, protein: 4, carbs: 12, fat: 6 },
    ],
  },
];

export function foodTotals(food: Food, scale = 1) {
  return {
    calories: Math.round(food.items.reduce((s, i) => s + i.calories, 0) * scale),
    protein: Math.round(food.items.reduce((s, i) => s + i.protein, 0) * scale * 10) / 10,
    carbs: Math.round(food.items.reduce((s, i) => s + i.carbs, 0) * scale * 10) / 10,
    fat: Math.round(food.items.reduce((s, i) => s + i.fat, 0) * scale * 10) / 10,
  };
}

export function findFood(id: string) {
  return FOODS.find((f) => f.id === id);
}

/** Resolve a real photo for an entry (by foodId first, then by name). */
export function foodImageFor(ref: { foodId?: string | null; name?: string | null }): string | null {
  const byId = ref.foodId ? findFood(ref.foodId) : undefined;
  if (byId) return byId.image;
  return FOODS.find((f) => f.name === ref.name)?.image ?? null;
}

/** Deterministic pseudo-random picker from a seed string (image fingerprint). */
export function pickFoodFromSeed(seed: string): { food: Food; scale: number; confidence: number } {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const idx = Math.abs(h) % FOODS.length;
  const scale = 0.85 + (Math.abs(h >> 4) % 40) / 100; // 0.85 – 1.24 portion variance
  const confidence = 0.84 + (Math.abs(h >> 8) % 13) / 100; // 0.84 – 0.96
  return { food: FOODS[idx], scale, confidence };
}

export interface PlanItem {
  food: Food;
  meal: "breakfast" | "lunch" | "dinner" | "snack";
  scale: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/** Pro feature: builds a day plan that fits the calorie target. */
export function generateMealPlan(dailyCalories: number, seed: number): PlanItem[] {
  const breakfastPool = FOODS.filter((f) => f.tags.some((t) => ["breakfast", "oats", "brunch"].includes(t)));
  const snackPool = FOODS.filter((f) => f.tags.some((t) => ["snack", "sweet", "smoothie"].includes(t)));
  const mainPool = FOODS.filter((f) => !breakfastPool.includes(f));

  const pick = (pool: Food[], s: number) => pool[Math.abs(s) % pool.length];
  const slots: { meal: PlanItem["meal"]; share: number; pool: Food[] }[] = [
    { meal: "breakfast", share: 0.25, pool: breakfastPool },
    { meal: "lunch", share: 0.35, pool: mainPool },
    { meal: "dinner", share: 0.3, pool: mainPool },
    { meal: "snack", share: 0.1, pool: snackPool },
  ];

  return slots.map((slot, i) => {
    const food = pick(slot.pool, seed + i * 7 + slot.meal.length);
    const base = foodTotals(food).calories || 1;
    const raw = (dailyCalories * slot.share) / base;
    const scale = Math.round(Math.min(1.6, Math.max(0.5, raw)) * 10) / 10;
    const t = foodTotals(food, scale);
    return { food, meal: slot.meal, scale, calories: t.calories, protein: t.protein, carbs: t.carbs, fat: t.fat };
  });
}

export function alternativesFor(foodId: string) {
  return FOODS.filter((f) => f.id !== foodId)
    .sort((a, b) => a.id.localeCompare(b.id) ^ foodId.length) // stable-ish variety
    .slice(0, 2);
}
