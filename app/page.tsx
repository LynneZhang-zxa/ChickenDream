"use client";

import Link from "next/link";
import { FoodTile, type Tone } from "@/components/FoodTile";
import { Nav } from "@/components/Nav";
import { Toast, useToast } from "@/components/Toast";
import { CREAMY_GARLIC_CHICKEN } from "@/lib/recipe";

const POPULAR: { title: string; emoji: string; tone: Tone; minutes: number; kcal: number; cuisine: string; live?: boolean }[] = [
  { title: CREAMY_GARLIC_CHICKEN.title, emoji: CREAMY_GARLIC_CHICKEN.emoji, tone: "butter", minutes: CREAMY_GARLIC_CHICKEN.totalMinutes, kcal: CREAMY_GARLIC_CHICKEN.calories, cuisine: "Italian", live: true },
  { title: "Tomato Beef Stew", emoji: "🍲", tone: "coral", minutes: 60, kcal: 520, cuisine: "Chinese" },
  { title: "Chicken Curry", emoji: "🍛", tone: "butter", minutes: 40, kcal: 480, cuisine: "Indian" },
  { title: "Bibimbap", emoji: "🍚", tone: "green", minutes: 25, kcal: 560, cuisine: "Korean" },
  { title: "Garlic Butter Shrimp", emoji: "🍤", tone: "sky", minutes: 20, kcal: 430, cuisine: "Quick & easy" },
];

const CHIPS = ["All", "Chinese", "Italian", "Japanese", "Korean", "Indian", "Mexican", "Quick & easy", "Healthy"];

export default function Home() {
  const toast = useToast();
  return (
    <>
      <Nav onSoon={toast.soon} />
      <main className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        {/* Hero */}
        <section className="grid items-center gap-10 pt-12 pb-10 md:grid-cols-[1.1fr_0.9fr] md:pt-16">
          <div>
            <h1 className="font-display leading-[0.95] text-ink">
              <span className="block text-6xl sm:text-7xl md:text-8xl">Good Food</span>
              <span className="mt-2 block text-3xl text-forest sm:text-4xl md:text-5xl">Starts with a Conversation</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-ink/75">
              Find recipes, get personalized suggestions, cook hands-free with an AI voice, and keep track of your nutrition, all in one place.
            </p>
            <form
              className="mt-8 flex items-center gap-2 rounded-full bg-paper p-2 pl-5 shadow-card ring-1 ring-line"
              onSubmit={(e) => {
                e.preventDefault();
                toast.soon();
              }}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-muted" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                className="w-full bg-transparent text-base outline-none placeholder:text-muted"
                placeholder="Search for a recipe, e.g. tomato beef stew, chicken curry…"
                aria-label="Search recipes"
              />
              <button type="submit" aria-label="Search" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-forest text-white transition hover:bg-forest-deep">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
            </form>
          </div>
          <div className="relative mx-auto aspect-square w-full max-w-md">
            <FoodTile emoji="🍝" tone="coral" className="h-full w-full rounded-full shadow-float" size="text-[9rem] sm:text-[11rem]" />
            <span className="absolute -left-4 top-6 -rotate-6 rounded-2xl bg-paper px-4 py-2 font-hand text-2xl text-ink shadow-card">
              Hey Chef, what&apos;s next?
            </span>
            <span className="absolute -right-2 bottom-10 rotate-3 rounded-2xl bg-paper px-4 py-2 font-hand text-2xl text-forest shadow-card">
              Good food, brighter days
            </span>
          </div>
        </section>

        {/* Feature cards */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="What you can do">
          <FeatureCard tone="bg-leaf" title="What can I cook?" body="Upload a photo of your ingredients or tell me what you have." icon="🥬">
            <button onClick={toast.soon} className="mt-auto w-full rounded-full bg-forest px-4 py-3 text-sm font-semibold text-white transition hover:bg-forest-deep">
              Upload ingredients
            </button>
          </FeatureCard>
          <FeatureCard tone="bg-coral-tint" title="Upload a recipe" body="From a photo, a video or plain text." icon="📄">
            <button onClick={toast.soon} className="mt-auto w-full rounded-full bg-coral px-4 py-3 text-sm font-semibold text-white transition hover:brightness-95">
              Upload recipe
            </button>
          </FeatureCard>
          <FeatureCard tone="bg-butter-tint" title="Today's recommendation" body="Personalized picks for you." icon="✨">
            <a href="#popular" className="mt-auto block w-full rounded-full bg-butter px-4 py-3 text-center text-sm font-semibold text-ink transition hover:brightness-95">
              See today&apos;s picks
            </a>
          </FeatureCard>
          <div className="flex flex-col rounded-3xl bg-sky-tint p-5 shadow-card">
            <div className="flex items-start gap-3">
              <span className="text-2xl" aria-hidden>
                🎙️
              </span>
              <div>
                <h2 className="font-display text-xl leading-tight">Start cooking with voice</h2>
                <p className="mt-1 text-sm text-ink/70">Hands-free guidance, step by step.</p>
              </div>
            </div>
            <Link href="/cook" className="group mt-5 flex flex-1 flex-col items-center justify-center gap-3" aria-label="Start cooking with voice">
              <span className="relative flex h-28 w-28 items-center justify-center">
                <span className="mic-breathe absolute inset-0 rounded-full bg-forest/30" />
                <span className="relative flex h-24 w-24 items-center justify-center rounded-full bg-forest text-white shadow-float transition group-hover:scale-105">
                  <MicIcon className="h-10 w-10" />
                </span>
              </span>
              <span className="text-sm font-semibold text-forest">Tap to wake</span>
              <span className="-mt-2 font-hand text-xl text-ink/70">&ldquo;Hey Chef&rdquo;</span>
            </Link>
          </div>
        </section>

        {/* Popular recipes */}
        <section id="popular" className="mt-14 scroll-mt-24">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-display text-3xl">Popular recipes</h2>
            <div className="no-scrollbar ml-auto flex gap-2 overflow-x-auto">
              {CHIPS.map((c, i) => (
                <button key={c} onClick={i === 0 ? undefined : toast.soon} className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm transition ${i === 0 ? "bg-forest text-white" : "bg-paper text-ink/80 shadow-card hover:text-forest"}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {POPULAR.map((r) => {
              const inner = (
                <>
                  <div className="relative">
                    <FoodTile emoji={r.emoji} tone={r.tone} className="aspect-[4/3] w-full" size="text-7xl" />
                    {r.live ? (
                      <span className="absolute left-3 top-3 rounded-full bg-coral px-2.5 py-1 text-xs font-semibold text-white">Cook by voice</span>
                    ) : (
                      <span className="absolute left-3 top-3 rounded-full bg-paper/90 px-2.5 py-1 text-xs font-medium text-muted">Coming soon</span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold leading-snug">{r.title}</h3>
                    <p className="mt-1.5 text-xs text-muted">
                      {r.minutes} min · {r.kcal} kcal
                    </p>
                    <p className="mt-2 inline-block rounded-full bg-cream px-2 py-0.5 text-xs text-ink/70">{r.cuisine}</p>
                  </div>
                </>
              );
              const cls = "group block overflow-hidden rounded-3xl bg-paper text-left shadow-card ring-1 ring-line/60 transition hover:-translate-y-0.5 hover:shadow-float";
              return r.live ? (
                <Link key={r.title} href="/cook" className={cls}>
                  {inner}
                </Link>
              ) : (
                <button key={r.title} onClick={toast.soon} className={cls}>
                  {inner}
                </button>
              );
            })}
          </div>
        </section>

        {/* Dashboard row */}
        <section className="mt-14 grid gap-4 lg:grid-cols-3">
          <div id="nutrition" className="scroll-mt-24 rounded-3xl bg-paper p-6 shadow-card ring-1 ring-line/60">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl">Nutrition dashboard</h2>
              <button onClick={toast.soon} className="shrink-0 whitespace-nowrap text-sm font-medium text-forest">
                Edit goal →
              </button>
            </div>
            <div className="mt-5 flex items-center gap-6">
              <Ring value={1250} max={2000} />
              <ul className="space-y-3 text-sm">
                <li>
                  <span className="block text-muted">Consumed</span>
                  <span className="font-semibold">1,250 kcal</span>
                </li>
                <li>
                  <span className="block text-muted">Remaining</span>
                  <span className="font-semibold">750 kcal</span>
                </li>
                <li>
                  <span className="block text-muted">Daily goal</span>
                  <span className="font-semibold">2,000 kcal</span>
                </li>
              </ul>
            </div>
            <h3 className="mt-6 text-sm font-semibold">Today&apos;s meals</h3>
            <ul className="mt-2 divide-y divide-line text-sm">
              {[
                ["Breakfast", "Oatmeal with banana", 320, "🥣"],
                ["Lunch", "Chicken salad", 520, "🥗"],
                ["Dinner (planned)", "Creamy garlic chicken", 610, "🍗"],
              ].map(([meal, dish, kcal, emoji]) => (
                <li key={meal as string} className="flex items-center gap-3 py-2.5">
                  <span className="text-xl">{emoji}</span>
                  <span className="flex-1">
                    <span className="block font-medium">{meal}</span>
                    <span className="block text-xs text-muted">{dish}</span>
                  </span>
                  <span className="text-xs text-muted">{kcal} kcal</span>
                </li>
              ))}
            </ul>
          </div>

          <div id="my-recipes" className="scroll-mt-24 rounded-3xl bg-paper p-6 shadow-card ring-1 ring-line/60">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl">My recipes</h2>
              <button onClick={toast.soon} className="shrink-0 whitespace-nowrap text-sm font-medium text-forest">
                See all →
              </button>
            </div>
            <div className="mt-4 flex gap-2">
              {["Saved", "Uploaded", "Recently cooked"].map((t, i) => (
                <button key={t} onClick={i === 0 ? undefined : toast.soon} className={`rounded-full px-3 py-1.5 text-xs font-medium ${i === 0 ? "bg-forest text-white" : "bg-cream text-ink/70"}`}>
                  {t}
                </button>
              ))}
            </div>
            <ul className="mt-4 divide-y divide-line text-sm">
              {[
                ["Garlic Butter Shrimp", "20 min · 430 kcal", "🍤", "sky"],
                ["Miso Soup", "15 min · 120 kcal", "🍜", "green"],
                ["Homemade Tacos", "30 min · 500 kcal", "🌮", "coral"],
                ["Avocado Pasta", "20 min · 450 kcal", "🥑", "green"],
              ].map(([name, meta, emoji, tone]) => (
                <li key={name} className="flex items-center gap-3 py-2.5">
                  <FoodTile emoji={emoji} tone={tone as Tone} className="h-11 w-11 rounded-xl" size="text-xl" />
                  <span className="flex-1">
                    <span className="block font-medium">{name}</span>
                    <span className="block text-xs text-muted">{meta}</span>
                  </span>
                  <button onClick={toast.soon} aria-label={`Save ${name}`} className="text-muted hover:text-forest">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
                      <path d="M6 4h12v17l-6-4-6 4z" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-3xl bg-paper p-6 shadow-card ring-1 ring-line/60">
              <h2 className="font-display text-2xl">Quick actions</h2>
              <ul className="mt-4 space-y-2">
                {[
                  ["📷", "Scan a recipe", "Take a photo to extract a recipe"],
                  ["➕", "Add to today", "Log a meal to your nutrition"],
                  ["🕒", "View cooking history", "See what you've cooked"],
                  ["⚙️", "Settings", "Dietary preferences, units, etc."],
                ].map(([icon, title, sub]) => (
                  <li key={title}>
                    <button onClick={toast.soon} className="flex w-full items-center gap-3 rounded-2xl bg-cream px-4 py-3 text-left transition hover:bg-leaf/70">
                      <span className="text-xl">{icon}</span>
                      <span>
                        <span className="block text-sm font-semibold">{title}</span>
                        <span className="block text-xs text-muted">{sub}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl bg-butter-tint p-5 shadow-card">
              <p className="text-sm font-semibold">💡 Need inspiration?</p>
              <p className="mt-1 text-sm text-ink/70">Tell me your mood, time or ingredients and I&apos;ll suggest the perfect recipe.</p>
            </div>
          </div>
        </section>

        <footer className="mt-16 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-6 text-xs text-muted">
          <span>Sous · hands-free cooking, powered by ALEBEX voice</span>
          <span>Built for the hackathon</span>
        </footer>
      </main>
      <Toast msg={toast.msg} />
    </>
  );
}

function FeatureCard({ tone, title, body, icon, children }: { tone: string; title: string; body: string; icon: string; children: React.ReactNode }) {
  return (
    <div className={`flex flex-col rounded-3xl ${tone} p-5 shadow-card`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl" aria-hidden>
          {icon}
        </span>
        <div>
          <h2 className="font-display text-xl leading-tight">{title}</h2>
          <p className="mt-1 text-sm text-ink/70">{body}</p>
        </div>
      </div>
      <div className="my-5 flex-1" />
      {children}
    </div>
  );
}

function Ring({ value, max }: { value: number; max: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, value / max);
  return (
    <svg viewBox="0 0 128 128" className="h-32 w-32 shrink-0" role="img" aria-label={`${value} of ${max} calories`}>
      <circle cx="64" cy="64" r={r} fill="none" stroke="#e9e4d8" strokeWidth="12" />
      <circle cx="64" cy="64" r={r} fill="none" stroke="#6b8f5e" strokeWidth="12" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} transform="rotate(-90 64 64)" />
      <text x="64" y="60" textAnchor="middle" className="fill-ink font-display" fontSize="22">
        {value.toLocaleString()}
      </text>
      <text x="64" y="80" textAnchor="middle" className="fill-muted" fontSize="11">
        / {max.toLocaleString()} kcal
      </text>
    </svg>
  );
}

export function MicIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6" />
    </svg>
  );
}
