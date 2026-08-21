/**
 * Free offline nutrition database (USDA FoodData Central style values, per 100 g).
 * No API key. Used to ground AI vision estimates so macros are real, not hallucinated.
 * Includes herbs/spices so "bir ot tanesi" level ingredients resolve to real numbers.
 */

export interface NutriFood {
  id: string;
  name: string;
  /** aliases for fuzzy match (en + tr + common misspellings) */
  aliases: string[];
  /** per 100 grams */
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  category: string;
  healthScore: number; // 0-100 default for this food
  emoji: string;
}

/** Compact USDA-ish table — extend anytime, zero cost */
export const NUTRI_DB: NutriFood[] = [
  // —— Proteins ——
  { id: "chicken-breast", name: "Chicken breast, grilled", aliases: ["chicken", "grilled chicken", "tavuk", "tavuk göğsü", "chicken breast"], kcal: 165, protein: 31, carbs: 0, fat: 3.6, category: "meat", healthScore: 88, emoji: "🍗" },
  { id: "chicken-thigh", name: "Chicken thigh", aliases: ["thigh", "tavuk but"], kcal: 209, protein: 26, carbs: 0, fat: 10.9, category: "meat", healthScore: 72, emoji: "🍗" },
  { id: "beef-lean", name: "Beef, lean cooked", aliases: ["beef", "steak", "dana", "kırmızı et", "kıyma", "ground beef"], kcal: 250, protein: 26, carbs: 0, fat: 15, category: "meat", healthScore: 62, emoji: "🥩" },
  { id: "lamb", name: "Lamb, cooked", aliases: ["lamb", "kuzu"], kcal: 294, protein: 25, carbs: 0, fat: 21, category: "meat", healthScore: 55, emoji: "🍖" },
  { id: "salmon", name: "Salmon, Atlantic cooked", aliases: ["salmon", "somon", "raw salmon"], kcal: 208, protein: 20, carbs: 0, fat: 13, category: "fish", healthScore: 90, emoji: "🐟" },
  { id: "tuna", name: "Tuna, canned in water", aliases: ["tuna", "ton", "ton balığı"], kcal: 86, protein: 19, carbs: 0, fat: 1, category: "fish", healthScore: 88, emoji: "🐟" },
  { id: "shrimp", name: "Shrimp, cooked", aliases: ["shrimp", "prawn", "karides"], kcal: 99, protein: 24, carbs: 0.2, fat: 0.3, category: "fish", healthScore: 86, emoji: "🦐" },
  { id: "egg-whole", name: "Egg, whole cooked", aliases: ["egg", "eggs", "yumurta", "poached egg", "fried egg", "scrambled egg"], kcal: 155, protein: 13, carbs: 1.1, fat: 11, category: "egg", healthScore: 82, emoji: "🥚" },
  { id: "egg-white", name: "Egg white", aliases: ["egg white", "yumurta akı"], kcal: 52, protein: 11, carbs: 0.7, fat: 0.2, category: "egg", healthScore: 92, emoji: "🥚" },
  { id: "tofu", name: "Tofu, firm", aliases: ["tofu"], kcal: 144, protein: 17, carbs: 3, fat: 9, category: "plant", healthScore: 85, emoji: "🧈" },
  { id: "turkey", name: "Turkey breast", aliases: ["turkey", "hindi"], kcal: 135, protein: 30, carbs: 0, fat: 1, category: "meat", healthScore: 90, emoji: "🦃" },

  // —— Dairy ——
  { id: "milk-whole", name: "Milk, whole", aliases: ["milk", "whole milk", "süt"], kcal: 61, protein: 3.2, carbs: 4.8, fat: 3.3, category: "dairy", healthScore: 70, emoji: "🥛" },
  { id: "milk-skim", name: "Milk, skim", aliases: ["skim milk", "yağsız süt"], kcal: 34, protein: 3.4, carbs: 5, fat: 0.1, category: "dairy", healthScore: 78, emoji: "🥛" },
  { id: "yogurt-greek", name: "Greek yogurt, plain", aliases: ["greek yogurt", "yoğurt", "yogurt", "süzme yoğurt", "labne"], kcal: 97, protein: 9, carbs: 3.6, fat: 5, category: "dairy", healthScore: 86, emoji: "🥛" },
  { id: "yogurt-plain", name: "Yogurt, plain low-fat", aliases: ["plain yogurt"], kcal: 63, protein: 5.3, carbs: 7, fat: 1.6, category: "dairy", healthScore: 80, emoji: "🥛" },
  { id: "cheese-cheddar", name: "Cheddar cheese", aliases: ["cheddar", "cheese", "peynir", "kaşar"], kcal: 403, protein: 25, carbs: 1.3, fat: 33, category: "dairy", healthScore: 45, emoji: "🧀" },
  { id: "cheese-feta", name: "Feta cheese", aliases: ["feta", "beyaz peynir"], kcal: 264, protein: 14, carbs: 4, fat: 21, category: "dairy", healthScore: 55, emoji: "🧀" },
  { id: "cheese-mozzarella", name: "Mozzarella", aliases: ["mozzarella"], kcal: 280, protein: 28, carbs: 3.1, fat: 17, category: "dairy", healthScore: 58, emoji: "🧀" },
  { id: "butter", name: "Butter", aliases: ["butter", "tereyağı"], kcal: 717, protein: 0.9, carbs: 0.1, fat: 81, category: "fat", healthScore: 25, emoji: "🧈" },
  { id: "cream", name: "Heavy cream", aliases: ["cream", "krema"], kcal: 340, protein: 2, carbs: 2.8, fat: 36, category: "dairy", healthScore: 30, emoji: "🥛" },

  // —— Grains / carbs ——
  { id: "rice-white", name: "White rice, cooked", aliases: ["rice", "white rice", "pirinç", "sushi rice", "basmati"], kcal: 130, protein: 2.7, carbs: 28, fat: 0.3, category: "grain", healthScore: 55, emoji: "🍚" },
  { id: "rice-brown", name: "Brown rice, cooked", aliases: ["brown rice", "esmer pirinç"], kcal: 123, protein: 2.7, carbs: 26, fat: 1, category: "grain", healthScore: 72, emoji: "🍚" },
  { id: "pasta-cooked", name: "Pasta, cooked", aliases: ["pasta", "spaghetti", "noodles", "makarna", "penne"], kcal: 131, protein: 5, carbs: 25, fat: 1.1, category: "grain", healthScore: 55, emoji: "🍝" },
  { id: "bread-white", name: "White bread", aliases: ["bread", "white bread", "ekmek", "toast"], kcal: 265, protein: 9, carbs: 49, fat: 3.2, category: "grain", healthScore: 40, emoji: "🍞" },
  { id: "bread-whole", name: "Whole wheat bread", aliases: ["whole wheat", "sourdough", "tam buğday", "çavdar"], kcal: 247, protein: 13, carbs: 41, fat: 3.4, category: "grain", healthScore: 70, emoji: "🍞" },
  { id: "oats", name: "Oats, dry", aliases: ["oats", "oatmeal", "rolled oats", "yulaf"], kcal: 389, protein: 17, carbs: 66, fat: 7, fiber: 11, category: "grain", healthScore: 90, emoji: "🥣" },
  { id: "quinoa", name: "Quinoa, cooked", aliases: ["quinoa"], kcal: 120, protein: 4.4, carbs: 21, fat: 1.9, category: "grain", healthScore: 92, emoji: "🥗" },
  { id: "potato", name: "Potato, boiled", aliases: ["potato", "patates", "roast potato", "fries", "french fries"], kcal: 87, protein: 1.9, carbs: 20, fat: 0.1, category: "veg", healthScore: 65, emoji: "🥔" },
  { id: "sweet-potato", name: "Sweet potato, baked", aliases: ["sweet potato", "tatlı patates"], kcal: 90, protein: 2, carbs: 21, fat: 0.2, category: "veg", healthScore: 88, emoji: "🍠" },
  { id: "tortilla", name: "Flour tortilla", aliases: ["tortilla", "wrap", "lavash", "pita", "flatbread", "naan"], kcal: 312, protein: 8, carbs: 52, fat: 7, category: "grain", healthScore: 48, emoji: "🫓" },
  { id: "couscous", name: "Couscous, cooked", aliases: ["couscous", "kuskus", "bulgur"], kcal: 112, protein: 3.8, carbs: 23, fat: 0.2, category: "grain", healthScore: 70, emoji: "🍚" },
  { id: "corn", name: "Corn, sweet", aliases: ["corn", "mısır"], kcal: 86, protein: 3.3, carbs: 19, fat: 1.2, category: "veg", healthScore: 72, emoji: "🌽" },

  // —— Vegetables ——
  { id: "broccoli", name: "Broccoli, raw", aliases: ["broccoli", "brokoli"], kcal: 34, protein: 2.8, carbs: 7, fat: 0.4, category: "veg", healthScore: 96, emoji: "🥦" },
  { id: "spinach", name: "Spinach, raw", aliases: ["spinach", "ıspanak"], kcal: 23, protein: 2.9, carbs: 3.6, fat: 0.4, category: "veg", healthScore: 98, emoji: "🥬" },
  { id: "lettuce", name: "Lettuce, green leaf", aliases: ["lettuce", "greens", "salad greens", "marul", "mixed greens", "kale", "arugula", "roka"], kcal: 15, protein: 1.4, carbs: 2.9, fat: 0.2, category: "veg", healthScore: 95, emoji: "🥬" },
  { id: "tomato", name: "Tomato, raw", aliases: ["tomato", "tomatoes", "cherry tomato", "domates"], kcal: 18, protein: 0.9, carbs: 3.9, fat: 0.2, category: "veg", healthScore: 92, emoji: "🍅" },
  { id: "cucumber", name: "Cucumber", aliases: ["cucumber", "salatalık"], kcal: 15, protein: 0.7, carbs: 3.6, fat: 0.1, category: "veg", healthScore: 94, emoji: "🥒" },
  { id: "carrot", name: "Carrot, raw", aliases: ["carrot", "havuç"], kcal: 41, protein: 0.9, carbs: 10, fat: 0.2, category: "veg", healthScore: 92, emoji: "🥕" },
  { id: "onion", name: "Onion, raw", aliases: ["onion", "soğan"], kcal: 40, protein: 1.1, carbs: 9.3, fat: 0.1, category: "veg", healthScore: 80, emoji: "🧅" },
  { id: "pepper", name: "Bell pepper", aliases: ["pepper", "bell pepper", "biber", "capsicum"], kcal: 31, protein: 1, carbs: 6, fat: 0.3, category: "veg", healthScore: 90, emoji: "🫑" },
  { id: "mushroom", name: "Mushroom, white", aliases: ["mushroom", "mantar"], kcal: 22, protein: 3.1, carbs: 3.3, fat: 0.3, category: "veg", healthScore: 88, emoji: "🍄" },
  { id: "zucchini", name: "Zucchini", aliases: ["zucchini", "kabak"], kcal: 17, protein: 1.2, carbs: 3.1, fat: 0.3, category: "veg", healthScore: 92, emoji: "🥒" },
  { id: "cabbage", name: "Cabbage", aliases: ["cabbage", "lahana", "coleslaw"], kcal: 25, protein: 1.3, carbs: 6, fat: 0.1, category: "veg", healthScore: 90, emoji: "🥬" },
  { id: "eggplant", name: "Eggplant", aliases: ["eggplant", "aubergine", "patlıcan"], kcal: 25, protein: 1, carbs: 6, fat: 0.2, category: "veg", healthScore: 88, emoji: "🍆" },
  { id: "garlic", name: "Garlic, raw", aliases: ["garlic", "sarımsak"], kcal: 149, protein: 6.4, carbs: 33, fat: 0.5, category: "veg", healthScore: 85, emoji: "🧄" },
  { id: "ginger", name: "Ginger root", aliases: ["ginger", "zencefil"], kcal: 80, protein: 1.8, carbs: 18, fat: 0.8, category: "veg", healthScore: 88, emoji: "🫚" },
  { id: "celery", name: "Celery", aliases: ["celery", "kereviz"], kcal: 16, protein: 0.7, carbs: 3, fat: 0.2, category: "veg", healthScore: 92, emoji: "🥬" },
  { id: "asparagus", name: "Asparagus", aliases: ["asparagus", "kuşkonmaz"], kcal: 20, protein: 2.2, carbs: 3.9, fat: 0.1, category: "veg", healthScore: 94, emoji: "🥬" },
  { id: "cauliflower", name: "Cauliflower", aliases: ["cauliflower", "karnabahar"], kcal: 25, protein: 1.9, carbs: 5, fat: 0.3, category: "veg", healthScore: 94, emoji: "🥦" },
  { id: "green-beans", name: "Green beans", aliases: ["green beans", "beans", "fasulye"], kcal: 31, protein: 1.8, carbs: 7, fat: 0.2, category: "veg", healthScore: 90, emoji: "🫘" },
  { id: "peas", name: "Green peas", aliases: ["peas", "bezelye", "edamame"], kcal: 81, protein: 5.4, carbs: 14, fat: 0.4, category: "veg", healthScore: 88, emoji: "🟢" },
  { id: "chickpeas", name: "Chickpeas, cooked", aliases: ["chickpea", "chickpeas", "garbanzo", "nohut", "hummus base"], kcal: 164, protein: 8.9, carbs: 27, fat: 2.6, category: "legume", healthScore: 90, emoji: "🫘" },
  { id: "lentils", name: "Lentils, cooked", aliases: ["lentil", "lentils", "mercimek"], kcal: 116, protein: 9, carbs: 20, fat: 0.4, category: "legume", healthScore: 94, emoji: "🫘" },
  { id: "black-beans", name: "Black beans, cooked", aliases: ["black beans", "beans cooked"], kcal: 132, protein: 8.9, carbs: 24, fat: 0.5, category: "legume", healthScore: 92, emoji: "🫘" },
  { id: "falafel", name: "Falafel", aliases: ["falafel"], kcal: 333, protein: 13, carbs: 32, fat: 18, category: "legume", healthScore: 58, emoji: "🧆" },
  { id: "hummus", name: "Hummus", aliases: ["hummus", "humus"], kcal: 166, protein: 8, carbs: 14, fat: 10, category: "legume", healthScore: 78, emoji: "🫘" },

  // —— Fruits ——
  { id: "apple", name: "Apple", aliases: ["apple", "elma"], kcal: 52, protein: 0.3, carbs: 14, fat: 0.2, category: "fruit", healthScore: 90, emoji: "🍎" },
  { id: "banana", name: "Banana", aliases: ["banana", "muz"], kcal: 89, protein: 1.1, carbs: 23, fat: 0.3, category: "fruit", healthScore: 82, emoji: "🍌" },
  { id: "orange", name: "Orange", aliases: ["orange", "portakal"], kcal: 47, protein: 0.9, carbs: 12, fat: 0.1, category: "fruit", healthScore: 92, emoji: "🍊" },
  { id: "strawberry", name: "Strawberry", aliases: ["strawberry", "strawberries", "çilek"], kcal: 32, protein: 0.7, carbs: 7.7, fat: 0.3, category: "fruit", healthScore: 94, emoji: "🍓" },
  { id: "blueberry", name: "Blueberry", aliases: ["blueberry", "blueberries", "yaban mersini", "berries", "mixed berries"], kcal: 57, protein: 0.7, carbs: 14, fat: 0.3, category: "fruit", healthScore: 95, emoji: "🫐" },
  { id: "grape", name: "Grape", aliases: ["grape", "grapes", "üzüm"], kcal: 69, protein: 0.7, carbs: 18, fat: 0.2, category: "fruit", healthScore: 80, emoji: "🍇" },
  { id: "watermelon", name: "Watermelon", aliases: ["watermelon", "karpuz"], kcal: 30, protein: 0.6, carbs: 8, fat: 0.2, category: "fruit", healthScore: 88, emoji: "🍉" },
  { id: "mango", name: "Mango", aliases: ["mango"], kcal: 60, protein: 0.8, carbs: 15, fat: 0.4, category: "fruit", healthScore: 85, emoji: "🥭" },
  { id: "pineapple", name: "Pineapple", aliases: ["pineapple", "ananas"], kcal: 50, protein: 0.5, carbs: 13, fat: 0.1, category: "fruit", healthScore: 86, emoji: "🍍" },
  { id: "lemon", name: "Lemon", aliases: ["lemon", "limon", "lime"], kcal: 29, protein: 1.1, carbs: 9, fat: 0.3, category: "fruit", healthScore: 90, emoji: "🍋" },
  { id: "avocado", name: "Avocado", aliases: ["avocado", "avokado", "smashed avocado"], kcal: 160, protein: 2, carbs: 8.5, fat: 15, category: "fruit", healthScore: 88, emoji: "🥑" },
  { id: "acai", name: "Açaí puree", aliases: ["acai", "açaí", "acai bowl"], kcal: 70, protein: 1, carbs: 4, fat: 5, category: "fruit", healthScore: 80, emoji: "🫐" },

  // —— Fats / oils / nuts ——
  { id: "olive-oil", name: "Olive oil", aliases: ["olive oil", "oil", "zeytinyağı", "vinaigrette", "dressing"], kcal: 884, protein: 0, carbs: 0, fat: 100, category: "fat", healthScore: 70, emoji: "🫒" },
  { id: "oil-veg", name: "Vegetable oil", aliases: ["vegetable oil", "canola", "sunflower oil", "ayçiçek"], kcal: 884, protein: 0, carbs: 0, fat: 100, category: "fat", healthScore: 40, emoji: "🛢️" },
  { id: "almonds", name: "Almonds", aliases: ["almond", "almonds", "badem"], kcal: 579, protein: 21, carbs: 22, fat: 50, category: "nut", healthScore: 85, emoji: "🥜" },
  { id: "walnuts", name: "Walnuts", aliases: ["walnut", "walnuts", "ceviz"], kcal: 654, protein: 15, carbs: 14, fat: 65, category: "nut", healthScore: 85, emoji: "🥜" },
  { id: "peanuts", name: "Peanuts", aliases: ["peanut", "peanuts", "fıstık", "peanut butter"], kcal: 567, protein: 26, carbs: 16, fat: 49, category: "nut", healthScore: 70, emoji: "🥜" },
  { id: "cashews", name: "Cashews", aliases: ["cashew", "cashews"], kcal: 553, protein: 18, carbs: 30, fat: 44, category: "nut", healthScore: 72, emoji: "🥜" },
  { id: "chia", name: "Chia seeds", aliases: ["chia", "chia seeds", "seeds", "tohum", "flax", "sesame", "susam"], kcal: 486, protein: 17, carbs: 42, fat: 31, fiber: 34, category: "seed", healthScore: 92, emoji: "🌱" },
  { id: "coconut", name: "Coconut meat", aliases: ["coconut", "coconut flakes", "hindistan cevizi"], kcal: 354, protein: 3.3, carbs: 15, fat: 33, category: "fruit", healthScore: 55, emoji: "🥥" },
  { id: "tahini", name: "Tahini", aliases: ["tahini", "tahin"], kcal: 595, protein: 17, carbs: 21, fat: 54, category: "seed", healthScore: 72, emoji: "🫙" },

  // —— Herbs & spices (the “bir ot” level) ——
  { id: "basil", name: "Basil, fresh", aliases: ["basil", "fresh basil", "fesleğen", "reyhan"], kcal: 23, protein: 3.2, carbs: 2.7, fat: 0.6, category: "herb", healthScore: 98, emoji: "🌿" },
  { id: "parsley", name: "Parsley, fresh", aliases: ["parsley", "maydanoz"], kcal: 36, protein: 3, carbs: 6.3, fat: 0.8, category: "herb", healthScore: 98, emoji: "🌿" },
  { id: "cilantro", name: "Cilantro / coriander leaf", aliases: ["cilantro", "coriander", "kişniş"], kcal: 23, protein: 2.1, carbs: 3.7, fat: 0.5, category: "herb", healthScore: 97, emoji: "🌿" },
  { id: "mint", name: "Mint, fresh", aliases: ["mint", "nane", "spearmint"], kcal: 44, protein: 3.3, carbs: 8.4, fat: 0.7, category: "herb", healthScore: 97, emoji: "🌿" },
  { id: "dill", name: "Dill, fresh", aliases: ["dill", "dereotu"], kcal: 43, protein: 3.5, carbs: 7, fat: 1.1, category: "herb", healthScore: 97, emoji: "🌿" },
  { id: "rosemary", name: "Rosemary, fresh", aliases: ["rosemary", "biberiye"], kcal: 131, protein: 3.3, carbs: 21, fat: 5.9, category: "herb", healthScore: 90, emoji: "🌿" },
  { id: "thyme", name: "Thyme, fresh", aliases: ["thyme", "kekik"], kcal: 101, protein: 5.6, carbs: 24, fat: 1.7, category: "herb", healthScore: 92, emoji: "🌿" },
  { id: "oregano", name: "Oregano, dried", aliases: ["oregano"], kcal: 265, protein: 9, carbs: 69, fat: 4.3, category: "herb", healthScore: 90, emoji: "🌿" },
  { id: "sage", name: "Sage, fresh", aliases: ["sage", "adaçayı"], kcal: 315, protein: 11, carbs: 61, fat: 13, category: "herb", healthScore: 88, emoji: "🌿" },
  { id: "chives", name: "Chives", aliases: ["chives", "frenk soğanı"], kcal: 30, protein: 3.3, carbs: 4.4, fat: 0.7, category: "herb", healthScore: 95, emoji: "🌿" },
  { id: "scallion", name: "Spring onion / scallion", aliases: ["scallion", "green onion", "spring onion", "yeşil soğan"], kcal: 32, protein: 1.8, carbs: 7.3, fat: 0.2, category: "herb", healthScore: 92, emoji: "🧅" },
  { id: "bay-leaf", name: "Bay leaf", aliases: ["bay leaf", "defne"], kcal: 313, protein: 7.6, carbs: 75, fat: 8.4, category: "herb", healthScore: 85, emoji: "🍃" },
  { id: "chili", name: "Chili pepper, hot", aliases: ["chili", "chilli", "hot pepper", "jalapeno", "acı biber", "red pepper flakes"], kcal: 40, protein: 1.9, carbs: 8.8, fat: 0.4, category: "spice", healthScore: 88, emoji: "🌶️" },
  { id: "black-pepper", name: "Black pepper", aliases: ["black pepper", "pepper spice", "karabiber"], kcal: 251, protein: 10, carbs: 64, fat: 3.3, category: "spice", healthScore: 80, emoji: "🧂" },
  { id: "cumin", name: "Cumin seed", aliases: ["cumin", "kimyon"], kcal: 375, protein: 18, carbs: 44, fat: 22, category: "spice", healthScore: 85, emoji: "🧂" },
  { id: "paprika", name: "Paprika", aliases: ["paprika", "pul biber", "kırmızı toz biber"], kcal: 282, protein: 14, carbs: 54, fat: 13, category: "spice", healthScore: 85, emoji: "🌶️" },
  { id: "cinnamon", name: "Cinnamon", aliases: ["cinnamon", "tarçın"], kcal: 247, protein: 4, carbs: 81, fat: 1.2, category: "spice", healthScore: 88, emoji: "🧂" },
  { id: "turmeric", name: "Turmeric", aliases: ["turmeric", "zerdeçal", "curry powder"], kcal: 312, protein: 9.7, carbs: 67, fat: 3.3, category: "spice", healthScore: 90, emoji: "🟡" },
  { id: "salt", name: "Salt", aliases: ["salt", "tuz", "sea salt"], kcal: 0, protein: 0, carbs: 0, fat: 0, category: "spice", healthScore: 40, emoji: "🧂" },
  { id: "microgreens", name: "Microgreens / sprouts", aliases: ["microgreens", "sprouts", "filiz", "cress", "watercress"], kcal: 30, protein: 2.5, carbs: 4, fat: 0.5, category: "herb", healthScore: 98, emoji: "🌱" },
  { id: "arugula-herb", name: "Arugula", aliases: ["arugula", "rocket", "roka"], kcal: 25, protein: 2.6, carbs: 3.7, fat: 0.7, category: "herb", healthScore: 97, emoji: "🌿" },

  // —— Condiments / sweets ——
  { id: "honey", name: "Honey", aliases: ["honey", "bal"], kcal: 304, protein: 0.3, carbs: 82, fat: 0, category: "sweet", healthScore: 40, emoji: "🍯" },
  { id: "sugar", name: "Sugar, white", aliases: ["sugar", "şeker"], kcal: 387, protein: 0, carbs: 100, fat: 0, category: "sweet", healthScore: 10, emoji: "🍬" },
  { id: "maple", name: "Maple syrup", aliases: ["maple", "maple syrup"], kcal: 260, protein: 0, carbs: 67, fat: 0.1, category: "sweet", healthScore: 35, emoji: "🍁" },
  { id: "ketchup", name: "Ketchup", aliases: ["ketchup", "catsup"], kcal: 112, protein: 1.7, carbs: 27, fat: 0.1, category: "condiment", healthScore: 25, emoji: "🍅" },
  { id: "mayo", name: "Mayonnaise", aliases: ["mayo", "mayonnaise", "mayonez"], kcal: 680, protein: 1, carbs: 0.6, fat: 75, category: "condiment", healthScore: 15, emoji: "🫙" },
  { id: "soy-sauce", name: "Soy sauce", aliases: ["soy sauce", "soya sosu", "tamari"], kcal: 53, protein: 8, carbs: 5, fat: 0.1, category: "condiment", healthScore: 45, emoji: "🫙" },
  { id: "mustard", name: "Mustard", aliases: ["mustard", "hardal"], kcal: 66, protein: 4.4, carbs: 5.3, fat: 3.3, category: "condiment", healthScore: 60, emoji: "🟡" },
  { id: "bbq", name: "BBQ sauce", aliases: ["bbq", "barbecue sauce"], kcal: 172, protein: 0.8, carbs: 41, fat: 0.6, category: "condiment", healthScore: 25, emoji: "🫙" },
  { id: "tzatziki", name: "Tzatziki", aliases: ["tzatziki", "cacık"], kcal: 60, protein: 3, carbs: 3.5, fat: 4, category: "condiment", healthScore: 75, emoji: "🥒" },
  { id: "granola", name: "Granola", aliases: ["granola", "muesli"], kcal: 471, protein: 10, carbs: 64, fat: 20, category: "grain", healthScore: 55, emoji: "🥣" },
  { id: "chocolate-dark", name: "Dark chocolate 70%", aliases: ["chocolate", "dark chocolate", "çikolata"], kcal: 598, protein: 7.8, carbs: 46, fat: 43, category: "sweet", healthScore: 45, emoji: "🍫" },
  { id: "ice-cream", name: "Ice cream, vanilla", aliases: ["ice cream", "dondurma"], kcal: 207, protein: 3.5, carbs: 24, fat: 11, category: "sweet", healthScore: 25, emoji: "🍦" },

  // —— Drinks ——
  { id: "water", name: "Water", aliases: ["water", "su"], kcal: 0, protein: 0, carbs: 0, fat: 0, category: "drink", healthScore: 100, emoji: "💧" },
  { id: "coffee", name: "Coffee, black", aliases: ["coffee", "kahve", "espresso", "americano"], kcal: 2, protein: 0.3, carbs: 0, fat: 0, category: "drink", healthScore: 85, emoji: "☕" },
  { id: "tea", name: "Tea, brewed", aliases: ["tea", "çay", "green tea"], kcal: 1, protein: 0, carbs: 0.3, fat: 0, category: "drink", healthScore: 90, emoji: "🍵" },
  { id: "cola", name: "Cola soda", aliases: ["cola", "coke", "soda", "gazoz"], kcal: 42, protein: 0, carbs: 10.6, fat: 0, category: "drink", healthScore: 10, emoji: "🥤" },
  { id: "orange-juice", name: "Orange juice", aliases: ["orange juice", "juice", "meyve suyu"], kcal: 45, protein: 0.7, carbs: 10.4, fat: 0.2, category: "drink", healthScore: 55, emoji: "🧃" },
  { id: "smoothie", name: "Fruit smoothie", aliases: ["smoothie", "smoothie bowl base"], kcal: 60, protein: 0.8, carbs: 14, fat: 0.3, category: "drink", healthScore: 70, emoji: "🥤" },

  // —— Prepared / common dishes (per 100 g average) ——
  { id: "pizza-cheese", name: "Cheese pizza", aliases: ["pizza", "margherita", "pepperoni pizza"], kcal: 266, protein: 11, carbs: 33, fat: 10, category: "dish", healthScore: 40, emoji: "🍕" },
  { id: "burger-patty", name: "Beef burger patty", aliases: ["burger", "hamburger", "cheeseburger", "beef patty"], kcal: 295, protein: 17, carbs: 0, fat: 25, category: "dish", healthScore: 35, emoji: "🍔" },
  { id: "fries", name: "French fries", aliases: ["fries", "chips", "patates kızartması"], kcal: 312, protein: 3.4, carbs: 41, fat: 15, category: "dish", healthScore: 25, emoji: "🍟" },
  { id: "sushi-salmon", name: "Sushi, salmon nigiri", aliases: ["sushi", "nigiri", "maki", "roll"], kcal: 150, protein: 6, carbs: 25, fat: 3, category: "dish", healthScore: 72, emoji: "🍣" },
  { id: "ramen", name: "Ramen noodle soup", aliases: ["ramen", "noodle soup"], kcal: 120, protein: 4, carbs: 18, fat: 4, category: "dish", healthScore: 45, emoji: "🍜" },
  { id: "pad-thai", name: "Pad Thai", aliases: ["pad thai", "stir fry noodles"], kcal: 160, protein: 7, carbs: 22, fat: 5, category: "dish", healthScore: 55, emoji: "🍜" },
  { id: "curry-chicken", name: "Chicken curry", aliases: ["curry", "tikka", "chicken curry", "tavuk sote"], kcal: 140, protein: 12, carbs: 6, fat: 8, category: "dish", healthScore: 60, emoji: "🍛" },
  { id: "doner", name: "Doner / shawarma meat", aliases: ["doner", "döner", "shawarma", "gyro"], kcal: 220, protein: 18, carbs: 4, fat: 14, category: "dish", healthScore: 48, emoji: "🥙" },
  { id: "lahmacun", name: "Lahmacun", aliases: ["lahmacun"], kcal: 210, protein: 9, carbs: 28, fat: 7, category: "dish", healthScore: 55, emoji: "🫓" },
  { id: "borek", name: "Börek / savory pastry", aliases: ["borek", "börek", "pastry", "pogaca", "poğaça"], kcal: 300, protein: 8, carbs: 32, fat: 16, category: "dish", healthScore: 35, emoji: "🥐" },
  { id: "menemen", name: "Menemen", aliases: ["menemen", "shakshuka", "eggs tomato"], kcal: 120, protein: 7, carbs: 5, fat: 8, category: "dish", healthScore: 75, emoji: "🍳" },
  { id: "pancake", name: "Pancake", aliases: ["pancake", "pancakes", "krep"], kcal: 227, protein: 6, carbs: 28, fat: 10, category: "dish", healthScore: 45, emoji: "🥞" },
  { id: "waffle", name: "Waffle", aliases: ["waffle"], kcal: 291, protein: 8, carbs: 33, fat: 14, category: "dish", healthScore: 40, emoji: "🧇" },
  { id: "soup-veg", name: "Vegetable soup", aliases: ["soup", "çorba", "lentil soup", "mercimek çorbası"], kcal: 45, protein: 2, carbs: 7, fat: 1, category: "dish", healthScore: 85, emoji: "🍲" },
  { id: "salad-greek", name: "Greek salad", aliases: ["greek salad", "coban salata", "çoban salata"], kcal: 90, protein: 3, carbs: 6, fat: 7, category: "dish", healthScore: 82, emoji: "🥗" },
  { id: "poke", name: "Poke bowl base", aliases: ["poke", "poke bowl"], kcal: 140, protein: 10, carbs: 16, fat: 4, category: "dish", healthScore: 80, emoji: "🍱" },
];

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9ğüşıöç\s-]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Simple token overlap score */
function scoreMatch(query: string, food: NutriFood): number {
  const q = normalize(query);
  if (!q) return 0;
  const names = [food.name, ...food.aliases].map(normalize);
  let best = 0;
  for (const n of names) {
    if (q === n) return 100;
    if (n.includes(q) || q.includes(n)) best = Math.max(best, 85);
    // token overlap
    const qt = new Set(q.split(" ").filter((t) => t.length > 2));
    const nt = new Set(n.split(" ").filter((t) => t.length > 2));
    if (qt.size === 0) continue;
    let hit = 0;
    for (const t of qt) if (nt.has(t) || n.includes(t)) hit += 1;
    const ratio = hit / qt.size;
    best = Math.max(best, Math.round(ratio * 70));
  }
  return best;
}

export function findNutri(query: string): { food: NutriFood; score: number } | null {
  let best: { food: NutriFood; score: number } | null = null;
  for (const f of NUTRI_DB) {
    const s = scoreMatch(query, f);
    if (s >= 40 && (!best || s > best.score)) best = { food: f, score: s };
  }
  return best;
}

export function macrosForGrams(food: NutriFood, grams: number) {
  const g = Math.max(0.5, Math.min(5000, grams));
  const f = g / 100;
  return {
    calories: Math.round(food.kcal * f),
    protein: Math.round(food.protein * f * 10) / 10,
    carbs: Math.round(food.carbs * f * 10) / 10,
    fat: Math.round(food.fat * f * 10) / 10,
    grams: Math.round(g * 10) / 10,
  };
}

/** Estimate grams from free-text portion like "150 g", "2 tbsp", "1 cup" */
export function parsePortionGrams(portion: string, fallback = 50): number {
  const p = (portion || "").toLowerCase().trim();
  if (!p) return fallback;

  const g = p.match(/(\d+(?:[.,]\d+)?)\s*(g|gram|grams|gr)\b/);
  if (g) return parseFloat(g[1].replace(",", "."));

  const kg = p.match(/(\d+(?:[.,]\d+)?)\s*kg\b/);
  if (kg) return parseFloat(kg[1].replace(",", ".")) * 1000;

  const ml = p.match(/(\d+(?:[.,]\d+)?)\s*ml\b/);
  if (ml) return parseFloat(ml[1].replace(",", ".")); // ~water density

  const tbsp = p.match(/(\d+(?:[.,]\d+)?)\s*(tbsp|tablespoon|yemek kaşığı|yk)/);
  if (tbsp) return parseFloat(tbsp[1].replace(",", ".")) * 14;

  const tsp = p.match(/(\d+(?:[.,]\d+)?)\s*(tsp|teaspoon|çay kaşığı|çk)/);
  if (tsp) return parseFloat(tsp[1].replace(",", ".")) * 5;

  const cup = p.match(/(\d+(?:[.,]\d+)?)\s*(cup|bardak|su bardağı)/);
  if (cup) return parseFloat(cup[1].replace(",", ".")) * 140;

  const slice = p.match(/(\d+(?:[.,]\d+)?)\s*(slice|slices|dilim)/);
  if (slice) return parseFloat(slice[1].replace(",", ".")) * 30;

  const pc = p.match(/(\d+(?:[.,]\d+)?)\s*(pc|pcs|piece|pieces|adet|egg|eggs)/);
  if (pc) return parseFloat(pc[1].replace(",", ".")) * 50;

  const handful = p.match(/handful|avuç/);
  if (handful) return 30;

  const pinch = p.match(/pinch|tutam|dash|sprinkle|bir tutam/);
  if (pinch) return 1;

  const leaf = p.match(/(\d+)?\s*(leaf|leaves|yaprak)/);
  if (leaf) return (leaf[1] ? parseFloat(leaf[1]) : 3) * 0.5;

  const sprig = p.match(/sprig|dal/);
  if (sprig) return 2;

  // bare number → assume grams
  const bare = p.match(/^(\d+(?:[.,]\d+)?)$/);
  if (bare) return parseFloat(bare[1].replace(",", "."));

  return fallback;
}

export function searchNutri(query: string, limit = 8): NutriFood[] {
  const scored = NUTRI_DB.map((f) => ({ f, s: scoreMatch(query, f) }))
    .filter((x) => x.s >= 30)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.f);
  return scored;
}
