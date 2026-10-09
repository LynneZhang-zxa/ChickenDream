import { ADDITIONAL_RECIPES } from "./recipes/catalog";

// JSON-serializable contract shared by the catalog, UI, and Voice Cooking.

export type Ingredient = {
  name: string;
  /** Amount for the recipe's base servings. Null for "to taste" items. */
  amount: number | null;
  unit: string; // "", "cup", "tablespoon", "teaspoon", "clove", "pound", "ounce"
  note?: string;
};

export type Step = {
  id: string;
  title: string;
  /** One to three plain sentences, written to be read aloud. */
  instruction: string;
  /** Suggested time for this step, used when the cook asks for "a timer" without a length. */
  durationSeconds?: number;
  tip?: string;
  safety?: string;
  /** Ingredient names used in this step, matched against Ingredient.name. */
  ingredients?: string[];
};

export type Recipe = {
  id: string;
  title: string;
  description: string;
  cuisine: string;
  tags: string[];
  image: string;
  imageKind: "photo" | "placeholder";
  prepMinutes: number;
  cookMinutes: number;
  servings: number;
  totalMinutes: number;
  /** Legacy per-serving field. Null means unavailable; see nutrition for provenance. */
  calories: number | null;
  nutrition: { status: "unavailable"; reason: string } | {
    status: "estimated";
    basis: "per-serving";
    calories: number;
    source: string;
  };
  emoji: string;
  ingredients: Ingredient[];
  steps: Step[];
};

export const CREAMY_GARLIC_CHICKEN: Recipe = {
  id: "creamy-garlic-chicken",
  title: "Creamy Garlic Chicken",
  description:
    "Golden seared chicken cutlets in a silky garlic parmesan cream sauce. One pan, about thirty minutes.",
  cuisine: "Italian-American",
  tags: ["chicken", "one-pan", "weeknight"],
  image: "/recipes/creamy-garlic-chicken.jpg",
  imageKind: "photo",
  prepMinutes: 10,
  cookMinutes: 20,
  servings: 2,
  totalMinutes: 30,
  calories: 610,
  nutrition: { status: "estimated", basis: "per-serving", calories: 610, source: "Legacy SOUS estimate; not independently calculated and excludes serving accompaniments." },
  emoji: "🍗",
  ingredients: [
    { name: "boneless skinless chicken breasts", amount: 2, unit: "", note: "about one pound" },
    { name: "salt", amount: 1, unit: "teaspoon" },
    { name: "black pepper", amount: 0.5, unit: "teaspoon" },
    { name: "paprika", amount: 1, unit: "teaspoon" },
    { name: "olive oil", amount: 2, unit: "tablespoon" },
    { name: "butter", amount: 2, unit: "tablespoon" },
    { name: "garlic", amount: 6, unit: "clove", note: "minced" },
    { name: "chicken broth", amount: 0.5, unit: "cup" },
    { name: "heavy cream", amount: 1, unit: "cup" },
    { name: "parmesan", amount: 0.5, unit: "cup", note: "finely grated" },
    { name: "Italian seasoning", amount: 1, unit: "teaspoon" },
    { name: "baby spinach", amount: 2, unit: "cup", note: "optional" },
    { name: "fresh parsley", amount: null, unit: "", note: "chopped, to finish" },
  ],
  steps: [
    {
      id: "prep-chicken",
      title: "Prep the chicken",
      instruction:
        "Pat the chicken dry, then slice each breast in half horizontally so you have four thin cutlets. Season both sides with the salt, pepper and paprika.",
      durationSeconds: 180,
      tip: "Thin, even cutlets cook through at the same time as the outside browns.",
      safety: "Wash your hands and the board after touching raw chicken.",
      ingredients: ["boneless skinless chicken breasts", "salt", "black pepper", "paprika"],
    },
    {
      id: "mise-en-place",
      title: "Get everything ready",
      instruction:
        "Mince the garlic, and measure out the broth, cream and parmesan so they're next to the stove. Things move fast once the pan is hot.",
      durationSeconds: 180,
      ingredients: ["garlic", "chicken broth", "heavy cream", "parmesan"],
    },
    {
      id: "heat-pan",
      title: "Heat the pan",
      instruction:
        "Set a large skillet over medium-high heat and add the olive oil. It's ready when the oil shimmers and flows easily.",
      durationSeconds: 120,
      safety: "If the oil starts smoking, the pan is too hot. Pull it off the heat for a moment and turn the burner down a notch.",
      ingredients: ["olive oil"],
    },
    {
      id: "sear-chicken",
      title: "Sear the chicken",
      instruction:
        "Lay the cutlets in the pan and leave them alone for four to five minutes until golden. Flip and cook three to four more minutes, until a thermometer in the thickest part reads 165°F (74°C). Move them to a clean plate.",
      durationSeconds: 300,
      tip: "If the pan is crowded, sear in two batches. Crowding steams the chicken instead of browning it.",
      safety: "Check chicken reaches 165°F (74°C) with a food thermometer; color alone is not a safety check. Use a clean plate, not the one that held raw chicken.",
      ingredients: ["boneless skinless chicken breasts"],
    },
    {
      id: "garlic-butter",
      title: "Butter and garlic",
      instruction:
        "Turn the heat down to medium. Add the butter and the garlic, and stir constantly for about thirty to sixty seconds, just until it smells amazing. Don't let it brown.",
      durationSeconds: 45,
      safety: "Garlic burns fast and turns bitter. If it goes dark brown, wipe out the pan and start this step again with fresh butter.",
      ingredients: ["butter", "garlic"],
    },
    {
      id: "deglaze",
      title: "Deglaze with broth",
      instruction:
        "Pour in the chicken broth and scrape up the browned bits from the bottom of the pan. Let it bubble for a minute or two until it reduces by about half.",
      durationSeconds: 90,
      tip: "Those browned bits are where most of the flavor lives.",
      ingredients: ["chicken broth"],
    },
    {
      id: "cream-sauce",
      title: "Make the cream sauce",
      instruction:
        "Lower the heat to medium-low. Stir in the heavy cream, the Italian seasoning and the parmesan. Simmer gently for three to four minutes until the sauce coats the back of a spoon. If you're using spinach, stir it in now and let it wilt.",
      durationSeconds: 240,
      safety: "Keep it at a gentle simmer. A hard boil can make a cream sauce split.",
      ingredients: ["heavy cream", "Italian seasoning", "parmesan", "baby spinach"],
    },
    {
      id: "return-chicken",
      title: "Bring it together",
      instruction:
        "Slide the chicken and any juices from the plate back into the sauce. Spoon sauce over the top and warm everything through for about two minutes. Taste, and add salt and pepper if it needs it.",
      durationSeconds: 120,
      ingredients: ["boneless skinless chicken breasts", "salt", "black pepper"],
    },
    {
      id: "finish",
      title: "Finish and serve",
      instruction:
        "Turn off the heat and scatter the parsley over the top. Serve it over pasta or rice, or with crusty bread for the sauce.",
      durationSeconds: 60,
      ingredients: ["fresh parsley"],
    },
  ],
};

export const RECIPE_LIST: readonly Recipe[] = [CREAMY_GARLIC_CHICKEN, ...ADDITIONAL_RECIPES];

export const RECIPES: Readonly<Record<string, Recipe>> = Object.fromEntries(
  RECIPE_LIST.map((recipe) => [recipe.id, recipe]),
);

export const POPULAR_RECIPE_IDS = ["creamy-garlic-chicken", "tomato-beef-stew", "chicken-curry", "bibimbap", "garlic-butter-shrimp"] as const;
export const POPULAR_RECIPES = POPULAR_RECIPE_IDS.map((id) => RECIPES[id]);

export function listRecipes(): readonly Recipe[] {
  return RECIPE_LIST;
}

/** Per-serving nutrition presentation with explicit estimate/unavailable status. */
export function nutritionLabel(recipe: Recipe): string {
  return recipe.nutrition.status === "estimated"
    ? `~${recipe.nutrition.calories} kcal (estimated)`
    : "Nutrition unavailable";
}

export function getRecipe(id: string): Recipe | undefined {
  return Object.hasOwn(RECIPES, id) ? RECIPES[id] : undefined;
}

// ----- Amount formatting -----

const UNIT_PLURAL: Record<string, string> = {
  cup: "cups",
  tablespoon: "tablespoons",
  teaspoon: "teaspoons",
  clove: "cloves",
  pound: "pounds",
  ounce: "ounces",
};

const SMALL_WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];

function numberWord(n: number): string {
  return n <= 12 ? SMALL_WORDS[n] : String(n);
}

/** Scale a base amount to the requested servings. */
export function scaleAmount(amount: number, baseServings: number, servings: number): number {
  const scaled = (amount * servings) / baseServings;
  // Round to the nearest quarter for kitchen friendliness.
  return Math.round(scaled * 4) / 4;
}

/** "½ cup", "2 tablespoons", "6 cloves" for the screen. */
export function formatAmount(amount: number | null, unit: string): string {
  if (amount === null) return unit ? unit : "";
  const whole = Math.floor(amount);
  const frac = amount - whole;
  const fracGlyph = frac === 0.25 ? "¼" : frac === 0.5 ? "½" : frac === 0.75 ? "¾" : "";
  const num = whole === 0 ? fracGlyph || "0" : `${whole}${fracGlyph}`;
  if (!unit) return num;
  const u = amount > 1 ? UNIT_PLURAL[unit] ?? unit : unit;
  return `${num} ${u}`;
}

/** "half a cup", "two tablespoons", "six cloves" for the voice. */
export function spokenAmount(amount: number | null, unit: string): string {
  if (amount === null) return "";
  const whole = Math.floor(amount);
  const frac = amount - whole;
  const fracWord = frac === 0.25 ? "a quarter" : frac === 0.5 ? "half" : frac === 0.75 ? "three quarters" : "";
  const plural = UNIT_PLURAL[unit] ?? unit;
  if (whole === 0) {
    if (!unit) return fracWord;
    return frac === 0.5 ? `half a ${unit}` : `${fracWord} of a ${unit}`;
  }
  const wholeWord = numberWord(whole);
  const num = fracWord ? `${wholeWord} and ${fracWord === "half" ? "a half" : fracWord}` : wholeWord;
  if (!unit) return num;
  return `${num} ${amount > 1 ? plural : unit}`;
}

export function describeIngredient(ing: Ingredient, baseServings: number, servings: number, mode: "screen" | "spoken"): string {
  const amt = ing.amount === null ? null : scaleAmount(ing.amount, baseServings, servings);
  const q = mode === "screen" ? formatAmount(amt, ing.unit) : spokenAmount(amt, ing.unit);
  const note = ing.note ? (mode === "screen" ? ` (${ing.note})` : `, ${ing.note}`) : "";
  return q ? `${q} ${ing.name}${note}` : `${ing.name}${note}`;
}
