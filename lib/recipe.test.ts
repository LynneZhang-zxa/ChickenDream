import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { CREAMY_GARLIC_CHICKEN, getRecipe, listRecipes, nutritionLabel, POPULAR_RECIPE_IDS, RECIPES } from "./recipe";
import { buildContext } from "./agent-config";
import { currentStep, newSession, nextStep, setServings, startTimer } from "./session";

describe("central recipe collection", () => {
  const recipes = listRecipes();
  it("contains 20 unique stable IDs and all five popular recipes", () => {
    expect(recipes).toHaveLength(20);
    expect(new Set(recipes.map((r) => r.id)).size).toBe(20);
    expect(Object.keys(RECIPES)).toHaveLength(20);
    for (const id of POPULAR_RECIPE_IDS) expect(getRecipe(id)?.id).toBe(id);
    for (const id of ["unknown", "toString", "__proto__"]) expect(getRecipe(id)).toBeUndefined();
  });
  for (const recipe of recipes) {
    describe(recipe.id, () => {
      it("has complete metadata, consistent timing and explicit nutrition provenance", () => {
        expect(recipe.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
        for (const value of [recipe.title, recipe.description, recipe.cuisine, recipe.emoji]) expect(value.trim()).not.toBe("");
        expect(recipe.tags.length).toBeGreaterThan(0);
        expect(new Set(recipe.tags).size).toBe(recipe.tags.length);
        for (const tag of recipe.tags) expect(tag.trim()).not.toBe("");
        expect(Number.isInteger(recipe.servings)).toBe(true);
        expect(recipe.servings).toBeGreaterThan(0);
        for (const time of [recipe.prepMinutes, recipe.cookMinutes]) {
          expect(Number.isFinite(time)).toBe(true);
          expect(time).toBeGreaterThanOrEqual(0);
        }
        expect(recipe.totalMinutes).toBe(recipe.prepMinutes + recipe.cookMinutes);
        expect(recipe.totalMinutes).toBeGreaterThan(0);
        if (recipe.nutrition.status === "unavailable") {
          expect(recipe.calories).toBeNull();
          expect(recipe.nutrition.reason.trim()).not.toBe("");
          expect(nutritionLabel(recipe)).toBe("Nutrition unavailable");
        } else {
          expect(recipe.nutrition.basis).toBe("per-serving");
          expect(recipe.nutrition.calories).toBeGreaterThan(0);
          expect(recipe.calories).toBe(recipe.nutrition.calories);
          expect(recipe.nutrition.source.trim()).not.toBe("");
          expect(nutritionLabel(recipe)).toContain("estimated");
        }
        expect(JSON.parse(JSON.stringify(recipe))).toEqual(recipe);
      });
      it("has valid quantities and ordered instructions with valid ingredient links", () => {
        expect(recipe.ingredients.length).toBeGreaterThan(0);
        const names = recipe.ingredients.map((i) => i.name);
        expect(new Set(names).size).toBe(names.length);
        for (const ingredient of recipe.ingredients) {
          expect(ingredient.name.trim()).not.toBe("");
          expect(["", "cup", "tablespoon", "teaspoon", "clove", "pound", "ounce"]).toContain(ingredient.unit);
          if (ingredient.amount === null) expect(ingredient.note?.trim()).toBeTruthy();
          else {
            expect(Number.isFinite(ingredient.amount)).toBe(true);
            expect(ingredient.amount).toBeGreaterThan(0);
          }
        }
        expect(recipe.steps.length).toBeGreaterThanOrEqual(4);
        expect(new Set(recipe.steps.map((s) => s.id)).size).toBe(recipe.steps.length);
        for (const step of recipe.steps) {
          for (const value of [step.id, step.title, step.instruction]) expect(value.trim()).not.toBe("");
          for (const name of step.ingredients ?? []) expect(names).toContain(name);
          if (step.durationSeconds !== undefined) {
            expect(Number.isInteger(step.durationSeconds)).toBe(true);
            expect(step.durationSeconds).toBeGreaterThanOrEqual(5);
            expect(step.durationSeconds).toBeLessThanOrEqual(21600);
          }
        }
        const linked = new Set(recipe.steps.flatMap((s) => s.ingredients ?? []));
        for (const name of names) expect(linked.has(name), name).toBe(true);
        expect(recipe.steps.some((s) => s.safety?.trim())).toBe(true);
      });
      it("references an existing local image with placeholders explicitly identified", () => {
        expect(recipe.image).toMatch(/^\/recipes\/[a-z0-9-]+\.(jpg|svg)$/);
        const file = path.resolve("public", recipe.image.slice(1));
        expect(existsSync(file)).toBe(true);
        expect(statSync(file).size).toBeGreaterThan(0);
        if (recipe.imageKind === "placeholder") {
          expect(recipe.image).toBe("/recipes/placeholder.svg");
          expect(readFileSync(file, "utf8")).toContain("<svg");
        } else expect(readFileSync(file).subarray(0, 2)).toEqual(Buffer.from([0xff, 0xd8]));
      });
      it("supports existing voice context, servings, steps and timers", () => {
        for (const servings of [1, recipe.servings, 12]) {
          const scaled = setServings(newSession(recipe.id, "test", "secret", 0), servings, 0).state;
          expect(buildContext(recipe, scaled, new Date("2026-10-08T12:00:00Z")).length).toBeLessThanOrEqual(4000);
        }
        let state = newSession(recipe.id, "test", "secret", 0);
        for (const step of recipe.steps) {
          const current = currentStep(state, 0);
          expect(current.result.instruction).toBe(step.instruction);
          expect(current.result.safety).toBe(step.safety ?? null);
          if (step.durationSeconds) expect(startTimer(current.state, undefined, undefined, "timer", 0).state.timers[0].seconds).toBe(step.durationSeconds);
          state = nextStep(current.state, 0).state;
        }
        expect(state.status).toBe("finished");
      });
    });
  }
  it("preserves the working chicken identity and all original step IDs", () => {
    expect(getRecipe("creamy-garlic-chicken")).toBe(CREAMY_GARLIC_CHICKEN);
    expect(CREAMY_GARLIC_CHICKEN.servings).toBe(2);
    expect(CREAMY_GARLIC_CHICKEN.steps.map((s) => s.id)).toEqual([
      "prep-chicken", "mise-en-place", "heat-pan", "sear-chicken", "garlic-butter", "deglaze", "cream-sauce", "return-chicken", "finish",
    ]);
  });
});
