# Recipe data system

Import `Recipe`, `getRecipe(id)`, `listRecipes()` and `POPULAR_RECIPES` from `lib/recipe.ts`. This is the shared contract used by cooking sessions and the UI; step array order is cooking order. IDs are permanent references, not titles. Quantities are for base `servings`; an empty unit means a counted item, and `null` means an unmeasured garnish or seasoning with an explanatory note.

`catalog.ts` holds nineteen additional recipes; the original Creamy Garlic Chicken export remains in `recipe.ts`. Authoring helpers return ordinary JSON objects. Preparation and cooking minutes are planning estimates; `totalMinutes` is their sum. Step timers are suggestions, not proof of doneness. Rice listed already cooked must be prepared separately; suggested accompaniments are not included in quantities or nutrition.

The five existing photographs retain their paths and attribution in `public/recipes/SOURCES.md`. Other recipes explicitly use a shared local placeholder (`imageKind: "placeholder"`); replace with licensed dish photographs later.

Nutrition is unavailable for new recipes. The chicken's legacy 610 kcal is preserved as an unverified estimate, not a calculated claim. `calories` remains a compatibility field but can now be null; it must match `nutrition`. UI consumers should use `nutritionLabel()` or inspect the status.

Safety references: [FoodSafety.gov minimum cooking temperatures](https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures) and [leftover handling](https://www.foodsafety.gov/blog/10-smart-tips-keep-your-restaurant-leftovers-safe). Recipe formulations are SOUS editorial content and have not been kitchen-tested. Chicken's color-based doneness wording was corrected to thermometer guidance without changing step IDs or timers.

## Future database migration

The existing `public.recipes` schema has a text primary key and JSONB `data`. A future seed can upsert `{ id: recipe.id, title: recipe.title, description: recipe.description, data: recipe }` from `listRecipes()`. Preserve recipe and step IDs; retain array order in JSONB or add positions if normalizing ingredients and steps. Moving to asynchronous database reads will require deliberate updates to callers at that phase. No database writes or schema changes are performed here.

Cooking sessions have a foreign key to `public.recipes`: seed the additional recipe rows before enabling them in deployed Voice Cooking. This phase preserves the default cooking selection and the other homepage cards' existing interactions. The My Recipes list remains a demonstration whose metadata comes from the catalog. Search, saving, uploads, authentication and routing are deferred.

Run `npm test` and `npx tsc --noEmit --incremental false` for data integrity, local image checks and compatibility with the existing voice context limit.
