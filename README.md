# Kalora 🥑 — Free AI Calorie & Nutrition Tracker

Photo → AI identifies food → **offline USDA-style DB** grounds real macros (including herbs).  
Works fully free. No paid food APIs. No scan limits.

## What actually works (free)

| Feature | How (cost) |
|---|---|
| 📸 Photo meal scan | Gemini free tier (identity + grams) + offline nutrition DB |
| ✍️ Type ingredients | Fully offline USDA DB — no API key needed |
| 📦 Barcode / product search | Open Food Facts (free) + local fallback |
| 🧠 Coach chat | Local intents always; Gemini free when key is set |
| 📅 Meal plan | Local generator (unlocked for everyone) |
| 🔥 Streak, XP, quests, freeze, challenges | Local Postgres |
| 🌍 15 languages, dark/light, PWA | Built-in |
| 👤 Auth | Demo mode by default; optional free Firebase |

## One-command local start

```bash
npm install
cp .env.example .env
# start embedded Postgres if you use scripts/start-pg.mjs
npx drizzle-kit push
npm run build && npx next start -H 0.0.0.0 -p 3000
```

### Make photo AI real (still free)

1. Open [Google AI Studio](https://aistudio.google.com/apikey) → create a free API key  
2. Put it in `.env` (server only — never `NEXT_PUBLIC_`):

```bash
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.0-flash
```

3. Restart the server. Photo scans show a **Gemini** badge + **✓ USDA verified** when items match the DB.

Without a key you still get:
- Sample / catalog scans grounded on the DB  
- **Type food** tab (e.g. `tavuk, pirinç, fesleğen`)  
- Barcode + manual search  

### Optional free extras

```bash
# OpenAI only as scan fallback (paid after free credit — optional)
OPENAI_API_KEY=

# Real Google/Apple/email login (Firebase free Spark plan)
NEXT_PUBLIC_AUTH_MODE=demo   # keep "demo" until Firebase is ready
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
# …rest from Firebase console
```

## Architecture (why it’s accurate + free)

```
Photo  → Gemini free  →  name + grams only
Text   → offline parser →  name + default grams
              ↓
     nutrition-db.ts (USDA-style per 100g, herbs included)
              ↓
     grounded calories / protein / carbs / fat
```

Model calories are **recalculated** from the DB so a single basil leaf (~1–3 g) is ~1 kcal, not a hallucination.

## Deploy free (recommended)

| Piece | Free option |
|---|---|
| App host | [Vercel](https://vercel.com) hobby |
| Database | [Neon](https://neon.tech) or [Supabase](https://supabase.com) free Postgres |
| AI scan | Gemini AI Studio free key → Vercel env `GEMINI_API_KEY` |
| Auth | Firebase Auth free Spark, or stay on demo |

```bash
# Vercel
vercel
vercel env add GEMINI_API_KEY
vercel env add DATABASE_URL
```

## Product stance

- **Scans & meal plans are unlimited** — no paywall on core tracking.  
- Profile “Pro” UI can stay as optional future upsell; defaults unlock everything.  
- Not medical advice.

## Scripts

- `npm run dev` — development  
- `npm run build` / `npm start` — production  
- `npx drizzle-kit push` — sync schema  
