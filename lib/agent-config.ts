import { describeIngredient, type Recipe } from "./recipe";
import { numWord, type SessionState } from "./session";

export const AGENT_NAME = "Sous";

export const FIRST_MESSAGE =
  "Hey chef, Sous here. I've got your recipe up. Whenever you're ready, just ask me what to do first.";

export const AGENT_PROMPT = `You're Sous, a friendly cook talking with a home cook on a live voice call while they cook. Only the words meant for the cook are heard, so never narrate what you're doing or mention tools.

The recipe and where they are in it are under About this caller, and every tool result tells you the current step. Cooking know-how, fixes and substitutions are in your knowledge base.

Talk like a friend standing next to them at the stove: warm, relaxed, one or two short sentences, one idea at a time. Give the action, not the structure. Never say step numbers or things like step two of nine unless they ask which step they're on. Don't repeat their words back, and don't ask if they need anything else.

When they ask what to do first, what's next, or say they're done, call next_step and tell them what to do in your own words. When they ask a question, answer it from the recipe and leave the step where it is. When they ask you to repeat, say it again, simpler. When they're missing an ingredient, suggest the best swap from your knowledge base, and call note_substitution once they go with it. Only start a timer when they ask, with manage_timer. If they just say okay, thanks or got it, reply with a word at most.

If something's burning, smoking or splitting, give the single most urgent action first. A grease fire means heat off and a lid on, never water. Chicken is done at one hundred sixty-five degrees with no pink inside. Never make the cook feel bad about a mistake.

Say numbers, times and temperatures in words. No exclamation marks, no lists. Use contractions. If a tool fails, just tell them the step from what you already know.`;

export const KNOWLEDGE_BASE = `Burning garlic. Garlic burns in seconds once butter is hot and turns bitter. If it is golden, pull the pan off the heat and move straight on to adding liquid. If it is dark brown or black, wipe the pan out with a paper towel, add fresh butter and garlic over medium heat, and try again. Keep the garlic moving the whole time.

Oil smoking or pan too hot. Wisps of smoke from oil mean the pan is too hot. Lift the pan off the burner for ten seconds, turn the heat down a notch, and carry on once the smoke stops. Olive oil smokes sooner than vegetable oil.

Grease fire. Turn off the burner. Cover the pan with a metal lid or a baking sheet to smother it. Never pour water on burning oil, and never carry a burning pan. If it is not out in a few seconds, leave the kitchen and call emergency services.

Sauce split or grainy. A cream sauce splits when it boils hard or when cold cream hits a very hot pan. Take it off the heat, add a splash of warm broth or cream, and whisk steadily until it comes back together. Parmesan goes grainy if the sauce is boiling when it is added, so add cheese over low heat.

Sauce too thin or too thick. Too thin: simmer gently a few more minutes, or add a little more parmesan. Too thick: stir in a splash of broth, cream or pasta water until it flows.

Chicken doneness. Chicken is done at one hundred sixty-five degrees Fahrenheit in the thickest part, with juices running clear and no pink inside. Thin cutlets take about four minutes per side over medium-high heat. If the outside is dark but the inside is pink, turn the heat down and cover the pan for a few minutes. If the chicken is dry, slice it thin and let it sit in the sauce.

Too salty. Add a splash of cream or broth, a squeeze of lemon, or serve over plain pasta or rice. Taste before adding any more salt.

Substitutes for heavy cream. Half-and-half with a tablespoon of butter works best. Whole milk whisked with a tablespoon of flour or cornstarch also works, simmer a little longer. Evaporated milk or full-fat coconut cream work too, coconut will change the flavor. For dairy-free, use coconut cream or a cashew cream.

Substitutes for parmesan. Pecorino or grana padano, same amount. Any hard aged cheese works. For dairy-free, two tablespoons of nutritional yeast and a pinch of salt.

Substitutes for chicken broth. Vegetable broth, or half a cup of water with a quarter teaspoon of bouillon, or a splash of dry white wine with water.

Substitutes for butter. Use the same amount of olive oil. For garlic, an eighth of a teaspoon of garlic powder stands in for one clove, added with the liquid rather than fried.

Substitutes for Italian seasoning. Half a teaspoon of dried oregano and half a teaspoon of dried thyme or basil. Spinach can be swapped for kale, stems removed, or skipped entirely. Chicken thighs can replace breasts, cook them two to three minutes longer per side.

Allergies and diets. Dairy-free: coconut cream, olive oil instead of butter, nutritional yeast instead of parmesan. Gluten-free: the recipe has no gluten, serve with rice or gluten-free pasta. The recipe contains no nuts, eggs, soy or shellfish.

Food safety. Wash hands, board and knife after handling raw chicken. Use a clean plate for cooked chicken. Leftovers go in the fridge within two hours and keep for three to four days. Reheat gently with a splash of broth so the sauce does not split.`;

export const TOOL_NAMES = [
  "next_step",
  "previous_step",
  "get_current_step",
  "jump_to_step",
  "manage_timer",
  "note_substitution",
  "set_servings",
] as const;
export type ToolName = (typeof TOOL_NAMES)[number];

export type CustomTool = {
  name: ToolName;
  description: string;
  url: string;
  headers: Record<string, string>;
  timeoutMs: number;
  parameters: Record<string, unknown>;
};

export function buildTools(publicBase: string, session: SessionState): CustomTool[] {
  const url = `${publicBase.replace(/\/$/, "")}/api/tools`;
  const headers = { "X-Sous-Session": session.id, "X-Sous-Secret": session.secret };
  const none = { type: "object", properties: {} };
  const mk = (name: ToolName, description: string, parameters: Record<string, unknown> = none): CustomTool => ({
    name,
    description,
    url,
    headers,
    timeoutMs: 8000,
    parameters,
  });
  return [
    mk(
      "next_step",
      "Move the cook to the next step of the recipe and return it. Call this when the cook says they're done, finished, ready, or asks what's next or what to do next. Do not call it when they ask a question about the current step, ask for a repeat, or report a problem."
    ),
    mk(
      "previous_step",
      "Move the cook back to the previous step and return it. Call this when the cook asks to go back, says they missed something in the last step, or wants the previous step again."
    ),
    mk(
      "get_current_step",
      "Return the step the cook is on right now, with its ingredients and amounts. Call this when the cook asks what step they're on, asks you to repeat the step, or asks what they should be doing now. Do not call it to repeat an answer you just gave."
    ),
    mk(
      "jump_to_step",
      "Jump to a specific step by number and return it. Call this when the cook names a step number, or asks to start over from the beginning (step one).",
      {
        type: "object",
        properties: { step_number: { type: "integer", description: "The step number to jump to, starting at one" } },
        required: ["step_number"],
      }
    ),
    mk(
      "manage_timer",
      "Start or cancel a kitchen timer shown on the cook's screen. Call this when the cook asks for a timer, agrees to one you offered, or asks to cancel one. Do not call it just because the recipe mentions a time.",
      {
        type: "object",
        properties: {
          action: { type: "string", enum: ["start", "cancel"], description: "start a new timer or cancel a running one" },
          label: { type: "string", description: "Short name for the timer, like garlic or sear side two" },
          seconds: { type: "integer", description: "Length in seconds. Leave empty to use the current step's suggested time." },
        },
        required: ["action"],
      }
    ),
    mk(
      "note_substitution",
      "Record that the cook is replacing an ingredient with something else, so it shows on their screen and is remembered. Call this once the cook lacks an ingredient and you've agreed on what to use instead. Do not call it while still discussing options.",
      {
        type: "object",
        properties: {
          ingredient: { type: "string", description: "The recipe ingredient being replaced" },
          substitute: { type: "string", description: "What the cook is using instead" },
        },
        required: ["ingredient", "substitute"],
      }
    ),
    mk(
      "set_servings",
      "Change how many servings the recipe is scaled to and return the new amounts. Call this when the cook says how many people they're cooking for or asks to double or halve the recipe.",
      {
        type: "object",
        properties: { servings: { type: "integer", description: "Number of servings, one to twelve" } },
        required: ["servings"],
      }
    ),
  ];
}

function weekdayDate(d = new Date()): string {
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

/** Facts about this cook and this call. Must stay under 4,000 characters. */
export function buildContext(recipe: Recipe, state: SessionState, now = new Date()): string {
  const total = recipe.steps.length;
  const idx = Math.min(state.stepIndex, total - 1);
  const step = recipe.steps[idx];
  const where =
    state.stepIndex >= total
      ? "They have finished every step."
      : !state.started
        ? `They haven't started yet. When they ask what to do first, the first step is ${step.title}. After that, tool results tell you the current step as it changes.`
        : `They are on step ${numWord(idx + 1)} of ${numWord(total)}, ${step.title}. Tool results tell you the current step as it changes.`;
  const subs = state.substitutions.length
    ? `Substitutions so far: ${state.substitutions.map((s) => `${s.substitute} instead of ${s.ingredient}`).join("; ")}.`
    : "No substitutions so far.";
  const ingredients = recipe.ingredients.map((i) => describeIngredient(i, recipe.servings, state.servings, "spoken")).join("; ");
  const steps = recipe.steps
    .map((s, i) => {
      const mins = s.durationSeconds ? ` (about ${spokenMinutes(s.durationSeconds)})` : "";
      return `${i + 1}. ${s.title}. ${s.instruction}${mins}`;
    })
    .join("\n");
  const text = `Today is ${weekdayDate(now)}. The cook is making ${recipe.title} for ${numWord(state.servings)} ${state.servings === 1 ? "person" : "people"}. ${where} ${subs}

Ingredients for ${numWord(state.servings)} servings: ${ingredients}.

The recipe has ${numWord(total)} steps:
${steps}`;
  if (text.length > 4000) throw new Error(`context too long: ${text.length}`);
  return text;
}

function spokenMinutes(seconds: number): string {
  if (seconds < 60) return `${numWord(seconds)} seconds`;
  const m = Math.round(seconds / 60);
  return `${numWord(m)} minute${m === 1 ? "" : "s"}`;
}

export function buildStartCall(agentId: string, recipe: Recipe, state: SessionState, publicBase: string | null) {
  return {
    type: "start_call" as const,
    agent: { id: agentId },
    ...(publicBase ? { customTools: buildTools(publicBase, state) } : {}),
    context: buildContext(recipe, state),
    knowledgeBase: KNOWLEDGE_BASE,
  };
}
