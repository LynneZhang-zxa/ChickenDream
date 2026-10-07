import Link from "next/link";

export function Nav({ onSoon }: { onSoon?: () => void }) {
  const links = [
    { label: "Home", href: "/", active: true },
    { label: "Recipes", href: "#popular" },
    { label: "Nutrition", href: "#nutrition" },
    { label: "My Recipes", href: "#my-recipes" },
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-cream/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <ChefHat className="h-8 w-8 text-forest" />
          <span className="leading-none">
            <span className="block font-display text-2xl text-forest">Sous</span>
            <span className="block text-[11px] tracking-wide text-muted">Your AI cooking companion</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${l.active ? "bg-leaf text-forest" : "text-ink/80 hover:bg-leaf/60"}`}
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <IconButton label="Search" onClick={onSoon}>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </IconButton>
          <IconButton label="Notifications" onClick={onSoon}>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
              <path d="M10 20a2 2 0 0 0 4 0" />
            </svg>
          </IconButton>
          <button onClick={onSoon} aria-label="Account" className="flex h-9 w-9 items-center justify-center rounded-full bg-forest text-sm font-semibold text-white">
            E
          </button>
        </div>
      </div>
    </header>
  );
}

function IconButton({ children, label, onClick }: { children: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} aria-label={label} className="flex h-9 w-9 items-center justify-center rounded-full bg-paper text-ink/80 shadow-card transition hover:text-forest">
      {children}
    </button>
  );
}

export function ChefHat({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M10 25h12v3H10z" />
      <path d="M10 25v-6.5A6 6 0 0 1 7 8.3 6.5 6.5 0 0 1 16 5a6.5 6.5 0 0 1 9 3.3A6 6 0 0 1 22 18.5V25" />
      <path d="M14 19v6M18 19v6" />
    </svg>
  );
}
