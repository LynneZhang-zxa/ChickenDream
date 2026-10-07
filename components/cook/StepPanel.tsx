"use client";

import { describeIngredient, type Recipe } from "@/lib/recipe";
import type { SessionState } from "@/lib/session";

export function StepPanel({
  recipe,
  state,
  onPrev,
  onNext,
  onJump,
}: {
  recipe: Recipe;
  state: SessionState;
  onPrev: () => void;
  onNext: () => void;
  onJump: (n: number) => void;
}) {
  const total = recipe.steps.length;
  const finished = state.stepIndex >= total;
  const idx = Math.min(state.stepIndex, total - 1);
  const step = recipe.steps[idx];
  const pct = finished ? 100 : Math.round((idx / total) * 100);
  const stepIngredients = (step.ingredients ?? [])
    .map((n) => recipe.ingredients.find((i) => i.name === n))
    .filter((i): i is NonNullable<typeof i> => Boolean(i));

  return (
    <section aria-live="polite" className="space-y-5">
      {finished ? (
        <div className="rounded-3xl bg-forest p-8 text-cream shadow-float">
          <p className="text-sm font-semibold uppercase tracking-wider text-leaf">All {total} steps done</p>
          <h2 className="mt-2 font-display text-4xl sm:text-5xl">{recipe.title} is ready.</h2>
          <p className="mt-4 max-w-xl text-lg text-cream/85">Plate it up, spoon the sauce over the top, and enjoy. Leftovers keep three to four days in the fridge.</p>
          <div className="mt-6 text-6xl" aria-hidden>
            🍽️
          </div>
        </div>
      ) : (
        <div className="rounded-3xl bg-paper p-6 shadow-card ring-1 ring-line/60 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-semibold uppercase tracking-wider text-forest">
              Step {idx + 1} of {total}
            </p>
            <div className="flex gap-1">
              <button onClick={onPrev} disabled={idx === 0} aria-label="Previous step" className="rounded-full p-2 text-muted transition hover:bg-cream hover:text-forest disabled:opacity-30">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m15 6-6 6 6 6" />
                </svg>
              </button>
              <button onClick={onNext} aria-label="Next step" className="rounded-full p-2 text-muted transition hover:bg-cream hover:text-forest">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </button>
            </div>
          </div>
          <h2 className="mt-2 font-display text-3xl leading-tight sm:text-4xl">{step.title}</h2>
          <p className="mt-4 text-xl leading-relaxed text-ink/90 sm:text-2xl">{step.instruction}</p>
          {stepIngredients.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-2" aria-label="Ingredients for this step">
              {stepIngredients.map((i) => (
                <li key={i.name} className="rounded-full bg-leaf px-3 py-1.5 text-sm text-forest-deep">
                  {describeIngredient(i, recipe.servings, state.servings, "screen")}
                </li>
              ))}
            </ul>
          )}
          {(step.tip || step.safety) && (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {step.tip && (
                <p className="rounded-2xl bg-butter-tint px-4 py-3 text-sm text-ink/80">
                  <span className="font-semibold">Tip. </span>
                  {step.tip}
                </p>
              )}
              {step.safety && (
                <p className="rounded-2xl bg-coral-tint px-4 py-3 text-sm text-ink/80">
                  <span className="font-semibold text-coral">Watch out. </span>
                  {step.safety}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <div>
        <div className="flex items-center justify-between text-xs text-muted">
          <span>Progress</span>
          <span>{pct}%</span>
        </div>
        <div className="mt-1.5 flex gap-1" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          {recipe.steps.map((s, i) => (
            <span key={s.id} className={`h-2 flex-1 rounded-full transition-colors ${i < state.stepIndex ? "bg-forest" : i === state.stepIndex ? "bg-moss" : "bg-line"}`} />
          ))}
        </div>
      </div>

      <ol className="divide-y divide-line rounded-3xl bg-paper shadow-card ring-1 ring-line/60">
        {recipe.steps.map((s, i) => {
          const done = i < state.stepIndex;
          const current = i === state.stepIndex;
          return (
            <li key={s.id}>
              <button onClick={() => onJump(i + 1)} className={`flex w-full items-start gap-3 px-5 py-3 text-left transition hover:bg-cream/70 ${current ? "bg-leaf/50" : ""}`}>
                <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${done ? "bg-forest text-white" : current ? "bg-moss text-white" : "bg-cream text-muted"}`}>
                  {done ? "✓" : i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block text-sm font-semibold ${done ? "text-muted line-through" : ""}`}>{s.title}</span>
                  {!current && !done && <span className="block truncate text-xs text-muted">{s.instruction}</span>}
                  {current && <span className="block text-xs text-forest">Now</span>}
                </span>
                {s.durationSeconds && <span className="text-xs text-muted">{Math.round(s.durationSeconds / 60) || 1} min</span>}
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
