"use client";

import { useCallback, useEffect, useState } from "react";

export function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 2600);
    return () => clearTimeout(t);
  }, [msg]);
  const show = useCallback((m: string) => setMsg(m), []);
  const soon = useCallback(() => setMsg("Coming soon. This demo is all about cooking by voice."), []);
  return { msg, show, soon };
}

export function Toast({ msg }: { msg: string | null }) {
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
      <div className={`rounded-full bg-ink px-5 py-3 text-sm text-cream shadow-float transition-all duration-300 ${msg ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}>
        {msg ?? ""}
      </div>
    </div>
  );
}
