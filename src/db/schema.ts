import { boolean, integer, jsonb, pgTable, real, text, timestamp } from "drizzle-orm/pg-core";

export const profile = pgTable("profile", {
  id: integer("id").primaryKey().default(1),
  name: text("name").notNull().default("Guest"),
  avatar: text("avatar").notNull().default("🥑"),
  goal: text("goal").notNull().default("maintain"), // lose | maintain | gain
  dailyCalories: integer("daily_calories").notNull().default(2200),
  proteinGoal: integer("protein_goal").notNull().default(120),
  carbsGoal: integer("carbs_goal").notNull().default(230),
  fatGoal: integer("fat_goal").notNull().default(70),
  waterGoalMl: integer("water_goal_ml").notNull().default(2500),
  units: text("units").notNull().default("metric"), // metric | imperial
  lang: text("lang").notNull().default("en"),
  theme: text("theme").notNull().default("dark"), // dark | light
  notifications: boolean("notifications").notNull().default(true),
  reminders: boolean("reminders").notNull().default(true),
  xp: integer("xp").notNull().default(0),
  pro: boolean("pro").notNull().default(true), // free product — all features unlocked
  plan: text("plan").notNull().default("free"), // free | monthly | six | yearly
  onboarded: boolean("onboarded").notNull().default(false),
  uid: text("uid"), // Firebase auth uid (or demo uid)
  email: text("email"),
  photoUrl: text("photo_url"),
  // Ultra: streak freeze + weekly challenge
  streakFreezes: integer("streak_freezes").notNull().default(1),
  freezeWeek: text("freeze_week"), // ISO week key when last freeze was granted/used
  challengeId: text("challenge_id"), // weekly challenge id
  challengeProgress: integer("challenge_progress").notNull().default(0),
  challengeClaimed: boolean("challenge_claimed").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const entries = pgTable("entries", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  date: text("date").notNull(), // YYYY-MM-DD (local)
  meal: text("meal").notNull(), // breakfast | lunch | dinner | snack
  name: text("name").notNull(),
  emoji: text("emoji").notNull().default("🍽️"),
  portion: text("portion").notNull().default("1 serving"),
  calories: integer("calories").notNull().default(0),
  protein: real("protein").notNull().default(0),
  carbs: real("carbs").notNull().default(0),
  fat: real("fat").notNull().default(0),
  healthScore: integer("health_score").notNull().default(70),
  image: text("image"), // data-url or remote url
  foodId: text("food_id"), // references FOODS catalog for real photos
  viaAi: boolean("via_ai").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const days = pgTable("days", {
  date: text("date").primaryKey(), // YYYY-MM-DD
  waterMl: integer("water_ml").notNull().default(0),
  weightKg: real("weight_kg"),
  quests: text("quests"), // comma-separated claimed quest ids
  frozen: boolean("frozen").notNull().default(false), // streak freeze applied this day
});

export const coachMessages = pgTable("coach_messages", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  role: text("role").notNull(), // user | coach
  text: text("text"), // free-text user message
  textKey: text("text_key"), // i18n key for coach replies
  vars: jsonb("vars").$type<Record<string, string | number>>(),
  foodIds: text("food_ids"), // comma-separated food suggestions
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Profile = typeof profile.$inferSelect;
export type Entry = typeof entries.$inferSelect;
export type Day = typeof days.$inferSelect;
export type CoachMessage = typeof coachMessages.$inferSelect;
