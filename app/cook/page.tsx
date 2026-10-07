"use client";

import Link from "next/link";
import { useCallback } from "react";
import { ChefHat } from "@/components/Nav";
import { MicButton } from "@/components/cook/MicButton";
import { StepPanel } from "@/components/cook/StepPanel";
import { VoicePanel } from "@/components/cook/VoicePanel";
import { useVoiceCall } from "@/components/voice/useVoiceCall";
import { CREAMY_GARLIC_CHICKEN, describeIngredient } from "@/lib/recipe";

export default function CookPage() {
  const voice = useVoiceCall();
  const recipe = voice.recipe ?? CREAMY_GARLIC_CHICKEN;
  const inCall = voice.status !== "idle" && voice.status !== "error" && voice.state !== null;

  const onMic = useCallback(() => {
    if (voice.status === "idle" || voice.status === "error" || voice.status === "ended") void voice.start(recipe.id);
    else voice.toggleSleep();
  }, [voice, recipe.id]);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-line/70 bg-cream/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 text-forest" aria-label="Back to home">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M11 6l-6 6 6 6" />
            </svg>
            <ChefHat className="h-7 w-7" />
            <span className="font-display text-xl">Sous</span>
          </Link>
          <div className="ml-auto flex items-center gap-3 text-sm text-muted">
            <span className="hidden sm:inline">{recipe.title}</span>
            <span className="rounded-full bg-paper px-3 py-1 shadow-card">
              {voice.state?.servings ?? recipe.servings} servings · {recipe.totalMinutes} min
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {!inCall ? (
          <Intro
            status={voice.status}
            error={voice.error}
            onStart={() => void voice.start(recipe.id)}
            recipe={recipe}
          />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <StepPanel
              recipe={recipe}
              state={voice.state!}
              onPrev={() => void voice.act("previous_step", {}, { notifyAgent: true })}
              onNext={() => void voice.act("next_step", {}, { notifyAgent: true })}
              onJump={(n) => void voice.act("jump_to_step", { step_number: n }, { notifyAgent: true })}
            />
            <VoicePanel
              status={voice.status}
              error={voice.error}
              warnings={voice.warnings}
              lines={voice.lines}
              state={voice.state}
              onMic={onMic}
              onEnd={voice.stop}
              onCancelTimer={(label) => void voice.act("manage_timer", { action: "cancel", label })}
            />
          </div>
        )}
      </main>
    </div>
  );
}

function Intro({ recipe, status, error, onStart }: { recipe: typeof CREAMY_GARLIC_CHICKEN; status: string; error: string | null; onStart: () => void }) {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-forest">{recipe.cuisine} · {recipe.totalMinutes} minutes · {recipe.calories} kcal per serving</p>
        <h1 className="mt-2 font-display text-5xl leading-[1] sm:text-6xl">{recipe.title}</h1>
        <p className="mt-4 max-w-2xl text-lg text-ink/75">{recipe.description}</p>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl bg-paper p-6 shadow-card ring-1 ring-line/60">
            <h2 className="font-display text-2xl">Ingredients</h2>
            <p className="text-xs text-muted">for {recipe.servings} servings</p>
            <ul className="mt-4 space-y-2 text-sm">
              {recipe.ingredients.map((i) => (
                <li key={i.name} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-moss" />
                  <span>{describeIngredient(i, recipe.servings, recipe.servings, "screen")}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl bg-paper p-6 shadow-card ring-1 ring-line/60">
            <h2 className="font-display text-2xl">The {recipe.steps.length} steps</h2>
            <ol className="mt-4 space-y-3 text-sm">
              {recipe.steps.map((s, i) => (
                <li key={s.id} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cream text-xs font-semibold text-muted">{i + 1}</span>
                  <span className="font-medium">{s.title}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      <aside className="lg:sticky lg:top-20 lg:self-start">
        <div className="rounded-3xl bg-paper p-6 text-center shadow-card ring-1 ring-line/60">
          <div className="flex justify-center">
            <MicButton status={status === "connecting" ? "connecting" : "idle"} onClick={onStart} />
          </div>
          <p className="mt-4 font-display text-2xl">{status === "connecting" ? "Connecting to Sous" : "Start cooking"}</p>
          <p className="mt-1 text-sm text-muted">
            {status === "connecting" ? "Allow the microphone when asked." : "Sous will greet you, then guide you step by step. Headphones give the cleanest sound."}
          </p>
          {error && <p className="mt-4 rounded-2xl bg-coral-tint px-4 py-3 text-left text-sm text-coral">{error}</p>}
          <ul className="mt-5 space-y-1.5 text-left text-sm text-ink/75">
            <li>• Say &ldquo;what&apos;s next&rdquo; to move on.</li>
            <li>• Ask anything: amounts, swaps, what to do if something burns.</li>
            <li>• Ask for a timer and it shows up here.</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
