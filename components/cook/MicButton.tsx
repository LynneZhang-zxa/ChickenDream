"use client";

import type { VoiceStatus } from "@/components/voice/useVoiceCall";

export function MicButton({ status, onClick, size = "lg" }: { status: VoiceStatus; onClick: () => void; size?: "lg" | "md" }) {
  const dim = size === "lg" ? "h-40 w-40" : "h-24 w-24";
  const inner = size === "lg" ? "h-32 w-32" : "h-20 w-20";
  const icon = size === "lg" ? "h-14 w-14" : "h-9 w-9";
  const listening = status === "listening";
  const speaking = status === "speaking";
  const sleeping = status === "sleeping";
  const connecting = status === "connecting";
  const disc = speaking ? "bg-amber" : sleeping ? "bg-muted" : connecting ? "bg-moss" : "bg-forest";
  const label =
    status === "idle" ? "Start cooking" : listening ? "Listening. Tap to pause." : speaking ? "Sous is speaking" : sleeping ? "Paused. Tap to wake." : connecting ? "Connecting" : "Start again";
  return (
    <button onClick={onClick} aria-label={label} className={`relative flex ${dim} items-center justify-center rounded-full outline-none`}>
      {listening && <span className="mic-breathe absolute inset-0 rounded-full bg-forest/30" />}
      {speaking && (
        <>
          <span className="mic-ripple absolute inset-3 rounded-full border-4 border-amber/70" />
          <span className="mic-ripple-2 absolute inset-3 rounded-full border-4 border-amber/50" />
          <span className="mic-ripple-3 absolute inset-3 rounded-full border-4 border-amber/30" />
        </>
      )}
      {connecting && <span className="blink absolute inset-0 rounded-full bg-moss/30" />}
      <span className={`relative flex ${inner} items-center justify-center rounded-full ${disc} text-white shadow-float transition-colors duration-300`}>
        {speaking ? (
          <SpeakerIcon className={icon} />
        ) : sleeping ? (
          <MoonIcon className={icon} />
        ) : (
          <MicIcon className={icon} />
        )}
      </span>
    </button>
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
function SpeakerIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 9v6h4l5 4V5L8 9z" />
      <path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" />
    </svg>
  );
}
function MoonIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
    </svg>
  );
}
