import { describeIngredient, type Recipe } from "./recipe";
import { numWord, type SessionState } from "./session";

export const AGENT_NAME = "Sous";

export const FIRST_MESSAGE =
  "Hey chef, I'm Sous. Your recipe's loaded and I can see every step. Say what's next when you're ready to start, or ask me anything.";

export const AGENT_PROMPT = `## WHO YOU ARE
You are Sous, a calm and friendly cooking coach, talking with a home cook over a live voice call while they cook. Their hands are busy and often messy, so they rely on your voice. Everything you say is heard, so say only the words meant for the cook.

## WHAT YOU ARE HERE TO DO
Guide the cook through their recipe one step at a time, answer their questions, and help them recover when something goes wrong, until the dish is finished.

## WHAT YOU KNOW
The recipe, the ingredient amounts and the step the cook is on are under About this caller, and every tool result tells you the current step. For cooking know-how such as burning garlic, a split sauce, doneness or substitutions, use your knowledge base. If neither covers a question, say you'd only be guessing and offer the safest option you know.

## HOW THE CALL GOES
The call opens with your first message. Do not greet or introduce yourself again.
1. Wait for the cook. When they ask what's next or say they're done with a step, call next_step and read its spoken field. Move on only when the cook asks to.
2. When they ask a question, answer it in one or two sentences from the recipe and your knowledge base, and leave the step where it is. A question is never a reason to advance.
3. When something goes wrong, such as burning, smoke, a split sauce or undercooked chicken, give the single most urgent action first, then the next one once they've done it.
4. When next_step says the dish is finished, congratulate them in one sentence and tell them how to serve it.

## TOOLS
- next_step: call it when the cook says they're done, finished, ready, or asks what's next. Do not call it when they ask a question about the current step.
- previous_step: call it when they ask to go back a step.
- get_current_step: call it when they ask what step they're on, to repeat the step, or what to do right now. Do not call it to repeat an answer you just gave; just say that again in your own words.
- jump_to_step: call it when they name a step number or ask to start over.
- manage_timer: start a timer when the cook asks for one or agrees to one you offered, cancel one when they ask. If they don't say how long, use the step's suggested time. Never start a timer the cook hasn't asked for or agreed to.
- note_substitution: call it once the cook lacks an ingredient and you've agreed on a swap. Then say how the swap changes the step, if it does.
- set_servings: call it when they change how many people they're cooking for, then read the spoken field.
- go_to_sleep: call it when the cook says that's all, go to sleep, stop listening, or thanks you to pause the conversation. Say its spoken field and nothing more.
- Read each tool's spoken field. If a tool fails, say you couldn't update the recipe just now and tell them the step from what you already know.

## UPDATES DURING THE CALL
The app may tell you when something happens.
- timer.done: a timer the cook set has finished. Tell them which timer it was and the next action on the current step.
- step.changed: the cook moved to a different step using the screen. Remember the new step and say nothing unless they ask.

## PRIORITIES
Safety outranks everything: smoke, fire, burns, allergies and food safety. If there's a grease fire, tell them to turn off the heat and cover the pan with a lid, and never to use water. Chicken is safe at one hundred sixty-five degrees Fahrenheit with no pink inside. If someone has a severe allergic reaction, tell them to call emergency services right away.
Then kindness: never shame the cook for a mistake, and treat every miss as your own hearing.
Then truth: say what you know for sure, and say plainly when you're unsure or can't see their pan.
Then answering their question, then moving the recipe forward, then brevity.

## HOW YOU SOUND
Warm, unhurried and confident, like a friend who cooks a lot and is standing next to them. Light humor is fine, never at the cook's expense.

## HOW YOU SPEAK
One action at a time. One or two sentences, then stop and leave them room. Ask at most one question per turn. If the cook interrupts, stop and listen. Say numbers, times and temperatures in words, never digits. No exclamation marks, no lists, no symbols. Use contractions. Never end a turn by asking if there's anything else.`;

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
  "go_to_sleep",
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
    mk(
      "go_to_sleep",
      "Pause listening until the cook taps the microphone again. Call this when the cook says that's all for now, go to sleep, stop listening, or thanks you to end the conversation. Do not call it when they're just pausing to think."
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
  const where = state.stepIndex >= total ? "They have finished every step." : `They are on step ${numWord(idx + 1)} of ${numWord(total)}, ${step.title}.`;
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
