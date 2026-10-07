import { describeIngredient, getRecipe, type Recipe, type Step } from "./recipe";

export type Timer = {
  id: string;
  label: string;
  seconds: number;
  /** Epoch ms when the timer ends. */
  endsAt: number;
  status: "running" | "fired" | "cancelled";
};

export type Substitution = { ingredient: string; substitute: string };

export type SessionState = {
  id: string;
  recipeId: string;
  secret: string;
  /** 0-based. Equal to steps.length means the dish is finished. */
  stepIndex: number;
  /** False until the cook has been given the first step; the first next_step reveals step one. */
  started: boolean;
  servings: number;
  substitutions: Substitution[];
  timers: Timer[];
  /** Reserved for a future voice "pause" command. */
  voiceCommand: { name: "sleep"; at: number } | null;
  status: "cooking" | "finished";
  callId: string | null;
  toolCalls: number;
  updatedAt: number;
};

/** What a tool hands back to the agent. `spoken` is written for the voice. */
export type ToolResult = Record<string, unknown> & { spoken: string };

export type Transition = { state: SessionState; result: ToolResult };

const ORDINALS = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth", "eleventh", "twelfth"];
const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
export const numWord = (n: number) => WORDS[n] ?? String(n);
export const ordinalWord = (n: number) => ORDINALS[n - 1] ?? `number ${n}`;

export function newSession(recipeId: string, id: string, secret: string, now = Date.now()): SessionState {
  const recipe = mustRecipe(recipeId);
  return {
    id,
    recipeId,
    secret,
    stepIndex: 0,
    started: false,
    servings: recipe.servings,
    substitutions: [],
    timers: [],
    voiceCommand: null,
    status: "cooking",
    callId: null,
    toolCalls: 0,
    updatedAt: now,
  };
}

function mustRecipe(id: string): Recipe {
  const r = getRecipe(id);
  if (!r) throw new Error(`Unknown recipe ${id}`);
  return r;
}

function touch(state: SessionState, patch: Partial<SessionState>, now: number): SessionState {
  return { ...state, ...patch, updatedAt: now };
}

/** The step as the agent should hear it. */
export function describeStep(recipe: Recipe, state: SessionState, step: Step, index: number): ToolResult {
  const total = recipe.steps.length;
  const ingredients = (step.ingredients ?? [])
    .map((name) => recipe.ingredients.find((i) => i.name === name))
    .filter((i): i is NonNullable<typeof i> => Boolean(i))
    .map((i) => describeIngredient(i, recipe.servings, state.servings, "spoken"));
  return {
    spoken: step.instruction,
    note: "This is the cook's current step now.",
    whereTheyAre: `step ${numWord(index + 1)} of ${numWord(total)}, ${step.title}`,
    stepNumber: index + 1,
    totalSteps: total,
    title: step.title,
    instruction: step.instruction,
    ingredientsForThisStep: ingredients,
    tip: step.tip ?? null,
    safety: step.safety ?? null,
    suggestedTimerSeconds: step.durationSeconds ?? null,
    isLastStep: index === total - 1,
    finished: false,
  };
}

function finishedResult(recipe: Recipe): ToolResult {
  return {
    spoken: `That's the last step done. ${recipe.title} is finished. Plate it up and enjoy.`,
    finished: true,
    stepNumber: recipe.steps.length,
    totalSteps: recipe.steps.length,
  };
}

export function currentStep(state: SessionState, now = Date.now()): Transition {
  const recipe = mustRecipe(state.recipeId);
  if (state.stepIndex >= recipe.steps.length) return { state, result: finishedResult(recipe) };
  const next = state.started ? state : touch(state, { started: true }, now);
  return { state: next, result: describeStep(recipe, next, recipe.steps[next.stepIndex], next.stepIndex) };
}

export function nextStep(state: SessionState, now = Date.now()): Transition {
  const recipe = mustRecipe(state.recipeId);
  if (!state.started) return currentStep(state, now); // the first "what's next" is step one
  if (state.stepIndex >= recipe.steps.length) {
    return { state, result: { ...finishedResult(recipe), spoken: `You're already done. ${recipe.title} is finished, so go enjoy it.` } };
  }
  const idx = state.stepIndex + 1;
  if (idx >= recipe.steps.length) {
    const next = touch(state, { stepIndex: idx, status: "finished" }, now);
    return { state: next, result: finishedResult(recipe) };
  }
  const next = touch(state, { stepIndex: idx }, now);
  return { state: next, result: describeStep(recipe, next, recipe.steps[idx], idx) };
}

export function previousStep(state: SessionState, now = Date.now()): Transition {
  const recipe = mustRecipe(state.recipeId);
  if (state.stepIndex === 0) {
    const r = describeStep(recipe, state, recipe.steps[0], 0);
    return { state, result: { ...r, spoken: `This is the very first step. ${r.spoken}` } };
  }
  const idx = Math.min(state.stepIndex - 1, recipe.steps.length - 1);
  const next = touch(state, { stepIndex: idx, status: "cooking", started: true }, now);
  return { state: next, result: describeStep(recipe, next, recipe.steps[idx], idx) };
}

export function jumpToStep(state: SessionState, stepNumber: number, now = Date.now()): Transition {
  const recipe = mustRecipe(state.recipeId);
  const total = recipe.steps.length;
  if (!Number.isFinite(stepNumber) || stepNumber < 1 || stepNumber > total) {
    const cur = currentStep(state).result;
    return { state, result: { ...cur, spoken: `This recipe has ${numWord(total)} steps, so there's no step ${numWord(Math.round(stepNumber) || 0)}. ${cur.spoken}` } };
  }
  const idx = Math.round(stepNumber) - 1;
  const next = touch(state, { stepIndex: idx, status: "cooking", started: true }, now);
  return { state: next, result: describeStep(recipe, next, recipe.steps[idx], idx) };
}

export function setServings(state: SessionState, servings: number, now = Date.now()): Transition {
  const recipe = mustRecipe(state.recipeId);
  const n = Math.round(servings);
  if (!Number.isFinite(n) || n < 1 || n > 12) {
    return { state, result: { spoken: `I can scale this between one and twelve servings. You're set for ${numWord(state.servings)} right now.`, servings: state.servings } };
  }
  const next = touch(state, { servings: n }, now);
  const key = recipe.ingredients
    .filter((i) => i.amount !== null)
    .slice(0, 4)
    .map((i) => describeIngredient(i, recipe.servings, n, "spoken"));
  const spoken = `Done, the recipe is now for ${numWord(n)}. That means ${key.slice(0, 3).join(", ")}, and everything else scales the same way.`;
  return { state: next, result: { spoken, servings: n, scaledIngredients: recipe.ingredients.map((i) => describeIngredient(i, recipe.servings, n, "spoken")) } };
}

export function noteSubstitution(state: SessionState, ingredient: string, substitute: string, now = Date.now()): Transition {
  const ing = ingredient.trim();
  const sub = substitute.trim();
  if (!ing || !sub) return { state, result: { spoken: "Tell me which ingredient you're missing and what you'd like to use instead." } };
  const others = state.substitutions.filter((s) => s.ingredient.toLowerCase() !== ing.toLowerCase());
  const next = touch(state, { substitutions: [...others, { ingredient: ing, substitute: sub }] }, now);
  return { state: next, result: { spoken: `Noted, ${sub} in place of ${ing}. I'll keep that in mind for the rest of the recipe.`, substitutions: next.substitutions } };
}

function spokenDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const parts: string[] = [];
  if (m) parts.push(`${numWord(m)} minute${m === 1 ? "" : "s"}`);
  if (s) parts.push(`${numWord(s)} second${s === 1 ? "" : "s"}`);
  return parts.join(" and ") || "zero seconds";
}

export function startTimer(state: SessionState, label: string | undefined, seconds: number | undefined, id: string, now = Date.now()): Transition {
  const recipe = mustRecipe(state.recipeId);
  const step = recipe.steps[Math.min(state.stepIndex, recipe.steps.length - 1)];
  const secs = Math.round(seconds ?? step?.durationSeconds ?? 0);
  if (!Number.isFinite(secs) || secs < 5 || secs > 6 * 3600) {
    return { state, result: { spoken: "How long should the timer be?" } };
  }
  const name = (label?.trim() || step?.title || "Timer").slice(0, 40);
  const timer: Timer = { id, label: name, seconds: secs, endsAt: now + secs * 1000, status: "running" };
  const next = touch(state, { timers: [...state.timers.filter((t) => t.status === "running"), timer] }, now);
  return { state: next, result: { spoken: `Timer set, ${spokenDuration(secs)} for ${name}. I'll let you know when it's done.`, timer } };
}

export function cancelTimer(state: SessionState, label: string | undefined, now = Date.now()): Transition {
  const running = state.timers.filter((t) => t.status === "running");
  if (running.length === 0) return { state, result: { spoken: "There's no timer running right now." } };
  const wanted = label?.trim().toLowerCase();
  const target = (wanted && running.find((t) => t.label.toLowerCase().includes(wanted))) || running[running.length - 1];
  const next = touch(state, { timers: state.timers.map((t) => (t.id === target.id ? { ...t, status: "cancelled" as const } : t)) }, now);
  return { state: next, result: { spoken: `Okay, I cancelled the ${target.label} timer.`, cancelled: target.label } };
}

export function markTimerFired(state: SessionState, timerId: string, now = Date.now()): Transition {
  const t = state.timers.find((x) => x.id === timerId);
  if (!t) return { state, result: { spoken: "" } };
  const next = touch(state, { timers: state.timers.map((x) => (x.id === timerId ? { ...x, status: "fired" as const } : x)) }, now);
  return { state: next, result: { spoken: `The ${t.label} timer is done.`, timer: next.timers.find((x) => x.id === timerId) } };
}

