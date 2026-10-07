"use client";

import { useEffect, useState } from "react";
import { MicButton } from "@/components/cook/MicButton";
import type { Line, VoiceStatus } from "@/components/voice/useVoiceCall";
import type { SessionState } from "@/lib/session";

const HINTS = ["What's next?", "How much garlic?", "Repeat that", "Set a timer", "I don't have heavy cream", "Go back"];

export function VoicePanel({
  status,
  error,
  warnings,
  lines,
  state,
  onMic,
  onEnd,
  onCancelTimer,
}: {
  status: VoiceStatus;
  error: string | null;
  warnings: string[];
  lines: Line[];
  state: SessionState | null;
  onMic: () => void;
  onEnd: () => void;
  onCancelTimer: (label: string) => void;
}) {
  const lastCook = [...lines].reverse().find((l) => l.role === "cook");
  const lastSous = [...lines].reverse().find((l) => l.role === "sous");
  const statusText =
    status === "listening"
      ? "Listening"
      : status === "speaking"
        ? "Sous is speaking"
        : status === "sleeping"
          ? "Paused"
          : status === "connecting"
            ? "Connecting to Sous"
            : status === "ended"
              ? "Session ended"
              : status === "error"
                ? "Couldn't connect"
                : "Ready";
  const hint =
    status === "listening"
      ? "Talk naturally. Try one of these."
      : status === "speaking"
        ? "Interrupt any time, Sous will stop."
        : status === "sleeping"
          ? "Tap the mic or say nothing. Timers still run."
          : status === "connecting"
            ? "Allow the microphone when asked."
            : "";
  const timers = state?.timers.filter((t) => t.status === "running") ?? [];

  return (
    <aside className="min-w-0 space-y-4 lg:sticky lg:top-20 lg:self-start">
      <div className="rounded-3xl bg-paper p-6 text-center shadow-card ring-1 ring-line/60">
        <div className="flex justify-center">
          <MicButton status={status} onClick={onMic} />
        </div>
        <p className="mt-4 font-display text-2xl">{statusText}</p>
        {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
        {status === "listening" && (
          <ul className="mt-3 flex flex-wrap justify-center gap-1.5">
            {HINTS.map((h) => (
              <li key={h} className="rounded-full bg-cream px-2.5 py-1 text-xs text-ink/70">
                &ldquo;{h}&rdquo;
              </li>
            ))}
          </ul>
        )}
        {(error || warnings.length > 0) && (
          <div className="mt-4 space-y-1 rounded-2xl bg-butter-tint px-4 py-3 text-left text-xs text-ink/80">
            {error && <p className="font-semibold text-coral">{error}</p>}
            {warnings.map((w) => (
              <p key={w}>{w}</p>
            ))}
          </div>
        )}
      </div>

      {(lastCook || lastSous) && (
        <div className="space-y-2">
          {lastCook && (
            <div className="rounded-2xl bg-cream px-4 py-3 ring-1 ring-line/60">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">You said</p>
              <p className="mt-0.5 text-sm">{lastCook.text}</p>
            </div>
          )}
          {lastSous && (
            <div className="rounded-2xl bg-leaf px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-forest">Sous</p>
              <p className="mt-0.5 text-sm text-forest-deep">{lastSous.text}</p>
            </div>
          )}
        </div>
      )}

      {timers.length > 0 && (
        <div className="rounded-3xl bg-paper p-5 shadow-card ring-1 ring-line/60">
          <h3 className="text-sm font-semibold">Timers</h3>
          <ul className="mt-3 space-y-3">
            {timers.map((t) => (
              <TimerRow key={t.id} label={t.label} endsAt={t.endsAt} seconds={t.seconds} onCancel={() => onCancelTimer(t.label)} />
            ))}
          </ul>
        </div>
      )}

      {state && state.substitutions.length > 0 && (
        <div className="rounded-3xl bg-paper p-5 shadow-card ring-1 ring-line/60">
          <h3 className="text-sm font-semibold">Swaps</h3>
          <ul className="mt-2 space-y-1.5 text-sm">
            {state.substitutions.map((s) => (
              <li key={s.ingredient} className="flex items-center gap-2">
                <span className="text-muted line-through">{s.ingredient}</span>
                <span aria-hidden>→</span>
                <span className="font-medium">{s.substitute}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {state && (
        <div className="flex items-center justify-between px-1 text-xs text-muted">
          <span>Serving {state.servings}</span>
          <button onClick={onEnd} className="rounded-full px-3 py-1.5 font-medium text-coral transition hover:bg-coral-tint">
            End cooking
          </button>
        </div>
      )}
    </aside>
  );
}

function TimerRow({ label, endsAt, seconds, onCancel }: { label: string; endsAt: number; seconds: number; onCancel: () => void }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);
  const left = Math.max(0, Math.ceil((endsAt - now) / 1000));
  const pct = seconds > 0 ? Math.min(1, left / seconds) : 0;
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  const r = 18;
  const c = 2 * Math.PI * r;
  return (
    <li className="flex items-center gap-3">
      <svg viewBox="0 0 44 44" className="h-11 w-11 shrink-0" aria-hidden>
        <circle cx="22" cy="22" r={r} fill="none" stroke="#e9e4d8" strokeWidth="4" />
        <circle cx="22" cy="22" r={r} fill="none" stroke={left <= 10 ? "#e8603c" : "#2f5b3c"} strokeWidth="4" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} transform="rotate(-90 22 22)" />
      </svg>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{label}</span>
        <span className={`block font-mono text-lg tabular-nums ${left <= 10 ? "text-coral" : ""}`}>
          {mm}:{ss}
        </span>
      </span>
      <button onClick={onCancel} className="text-xs text-muted hover:text-coral">
        Cancel
      </button>
    </li>
  );
}
