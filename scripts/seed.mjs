/**
 * Seed demo profile + sample meals so the preview looks alive immediately.
 */
import pg from "pg";
import "dotenv/config";

const url = process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/app_db";
const client = new pg.Client({ connectionString: url });

const today = new Date();
const iso = (d) => d.toISOString().slice(0, 10);
const day = (offset) => {
  const d = new Date(today);
  d.setDate(d.getDate() + offset);
  return iso(d);
};

const T = day(0);
const Y = day(-1);
const D2 = day(-2);
const D3 = day(-3);
const D4 = day(-4);
const D5 = day(-5);
const D6 = day(-6);

async function main() {
  await client.connect();

  // Profile — ready to use, Turkish-friendly defaults
  await client.query(`
    INSERT INTO profile (
      id, name, avatar, goal, daily_calories, protein_goal, carbs_goal, fat_goal,
      water_goal_ml, units, lang, theme, notifications, reminders, xp, pro, plan, onboarded, uid, email
    ) VALUES (
      1, 'Serdar', '🥑', 'maintain', 2200, 140, 220, 70,
      2500, 'metric', 'tr', 'dark', true, true, 340, true, 'monthly', true, 'demo-google', 'demo@kalora.app'
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      avatar = EXCLUDED.avatar,
      goal = EXCLUDED.goal,
      daily_calories = EXCLUDED.daily_calories,
      protein_goal = EXCLUDED.protein_goal,
      carbs_goal = EXCLUDED.carbs_goal,
      fat_goal = EXCLUDED.fat_goal,
      water_goal_ml = EXCLUDED.water_goal_ml,
      lang = EXCLUDED.lang,
      theme = EXCLUDED.theme,
      xp = EXCLUDED.xp,
      pro = EXCLUDED.pro,
      plan = EXCLUDED.plan,
      onboarded = EXCLUDED.onboarded,
      uid = EXCLUDED.uid,
      email = EXCLUDED.email
  `);

  // Clear old demo rows so re-seed is clean
  await client.query("DELETE FROM entries");
  await client.query("DELETE FROM days");
  await client.query("DELETE FROM coach_messages");

  const meals = [
    // today
    { date: T, meal: "breakfast", name: "Oatmeal with Berries", emoji: "🥣", food_id: "oatmeal", portion: "1 serving", calories: 417, protein: 15, carbs: 66.8, fat: 10.9, health: 90, via: false },
    { date: T, meal: "lunch", name: "Salmon Poke Bowl", emoji: "🍣", food_id: "poke", portion: "1 serving", calories: 681, protein: 37.2, carbs: 60, fat: 31.8, health: 88, via: true },
    { date: T, meal: "snack", name: "Greek Yogurt Parfait", emoji: "🥛", food_id: "yogurt-parfait", portion: "1 serving", calories: 388, protein: 27.8, carbs: 46, fat: 9.8, health: 86, via: false },
    // yesterday
    { date: Y, meal: "breakfast", name: "Avocado Toast & Eggs", emoji: "🥑", food_id: "avo-toast", portion: "1 serving", calories: 540, protein: 24.2, carbs: 52.8, fat: 26.6, health: 84, via: true },
    { date: Y, meal: "lunch", name: "Grilled Chicken Salad", emoji: "🥗", food_id: "chicken-salad", portion: "1 serving", calories: 411, protein: 48.5, carbs: 9.3, fat: 18.8, health: 92, via: false },
    { date: Y, meal: "dinner", name: "Chicken Curry & Rice", emoji: "🍛", food_id: "curry", portion: "1 serving", calories: 665, protein: 36, carbs: 79, fat: 21.5, health: 66, via: false },
    // day -2
    { date: D2, meal: "breakfast", name: "Berry Smoothie Bowl", emoji: "🍓", food_id: "smoothie-bowl", portion: "1 serving", calories: 522, protein: 8.9, carbs: 91.4, fat: 15.3, health: 82, via: true },
    { date: D2, meal: "lunch", name: "Quinoa Buddha Bowl", emoji: "🥗", food_id: "buddha-bowl", portion: "1 serving", calories: 539, protein: 19.1, carbs: 80, fat: 16, health: 94, via: false },
    { date: D2, meal: "dinner", name: "Sushi Platter (12 pc)", emoji: "🍱", food_id: "sushi", portion: "1 serving", calories: 471, protein: 18, carbs: 65, fat: 14, health: 76, via: true },
    // day -3
    { date: D3, meal: "breakfast", name: "Protein Pancakes", emoji: "🥞", food_id: "pancakes", portion: "1 serving", calories: 549, protein: 29.3, carbs: 96, fat: 6.4, health: 72, via: false },
    { date: D3, meal: "lunch", name: "Falafel Wrap", emoji: "🌯", food_id: "wrap", portion: "1 serving", calories: 630, protein: 20, carbs: 82, fat: 24, health: 70, via: false },
    { date: D3, meal: "dinner", name: "Steak & Roast Potatoes", emoji: "🥩", food_id: "steak", portion: "1 serving", calories: 730, protein: 48, carbs: 42, fat: 41, health: 64, via: true },
    // day -4
    { date: D4, meal: "breakfast", name: "Oatmeal with Berries", emoji: "🥣", food_id: "oatmeal", portion: "1 serving", calories: 417, protein: 15, carbs: 66.8, fat: 10.9, health: 90, via: false },
    { date: D4, meal: "lunch", name: "Mediterranean Mezze Platter", emoji: "🫓", food_id: "mediterranean", portion: "1 serving", calories: 829, protein: 29, carbs: 95, fat: 37.3, health: 78, via: true },
    { date: D4, meal: "dinner", name: "Chicken Pad Thai", emoji: "🍜", food_id: "pad-thai", portion: "1 serving", calories: 680, protein: 35, carbs: 81, fat: 22, health: 60, via: false },
    // day -5
    { date: D5, meal: "breakfast", name: "Greek Yogurt Parfait", emoji: "🥛", food_id: "yogurt-parfait", portion: "1 serving", calories: 388, protein: 27.8, carbs: 46, fat: 9.8, health: 86, via: false },
    { date: D5, meal: "lunch", name: "Salmon Poke Bowl", emoji: "🍣", food_id: "poke", portion: "1 serving", calories: 681, protein: 37.2, carbs: 60, fat: 31.8, health: 88, via: true },
    { date: D5, meal: "dinner", name: "Shrimp Garlic Pasta", emoji: "🍝", food_id: "shrimp-pasta", portion: "1 serving", calories: 670, protein: 40, carbs: 81, fat: 20.5, health: 58, via: false },
    // day -6
    { date: D6, meal: "breakfast", name: "Avocado Toast & Eggs", emoji: "🥑", food_id: "avo-toast", portion: "1 serving", calories: 540, protein: 24.2, carbs: 52.8, fat: 26.6, health: 84, via: false },
    { date: D6, meal: "lunch", name: "Grilled Chicken Salad", emoji: "🥗", food_id: "chicken-salad", portion: "1 serving", calories: 411, protein: 48.5, carbs: 9.3, fat: 18.8, health: 92, via: true },
    { date: D6, meal: "dinner", name: "Tonkotsu Ramen", emoji: "🍜", food_id: "ramen", portion: "1 serving", calories: 750, protein: 34.5, carbs: 64, fat: 39.5, health: 55, via: false },
  ];

  for (const m of meals) {
    await client.query(
      `INSERT INTO entries (date, meal, name, emoji, portion, calories, protein, carbs, fat, health_score, food_id, via_ai)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [m.date, m.meal, m.name, m.emoji, m.portion, m.calories, m.protein, m.carbs, m.fat, m.health, m.food_id, m.via]
    );
  }

  const dayRows = [
    { date: T, water: 1250, weight: 74.2, quests: "q_meals" },
    { date: Y, water: 2500, weight: 74.4, quests: "q_meals,q_water,q_scan" },
    { date: D2, water: 2000, weight: 74.6, quests: "q_meals,q_water" },
    { date: D3, water: 1750, weight: 74.8, quests: "q_meals" },
    { date: D4, water: 2250, weight: 75.0, quests: "q_meals,q_scan" },
    { date: D5, water: 2500, weight: 75.1, quests: "q_meals,q_water" },
    { date: D6, water: 1500, weight: 75.3, quests: "q_meals" },
  ];

  for (const d of dayRows) {
    await client.query(
      `INSERT INTO days (date, water_ml, weight_kg, quests) VALUES ($1,$2,$3,$4)`,
      [d.date, d.water, d.weight, d.quests]
    );
  }

  // A couple of coach messages so Coach page isn't empty
  await client.query(
    `INSERT INTO coach_messages (role, text, text_key, vars, food_ids) VALUES
      ('coach', null, 'r_status_ok', $1::jsonb, null),
      ('user', 'Ne yemeliyim?', null, null, null),
      ('coach', null, 'r_eat', null, 'chicken-salad,buddha-bowl,yogurt-parfait')`,
    [JSON.stringify({ eaten: 1486, left: 714, protein: 80, pgoal: 140 })]
  );

  console.log("Seeded profile, entries, days, coach messages for", T);
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
