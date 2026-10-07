-- Sous: minimal schema. Recipes are JSON documents; one row per cooking session.
create table if not exists public.recipes (
  id text primary key,
  title text not null,
  description text not null default '',
  data jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.cooking_sessions (
  id uuid primary key,
  recipe_id text not null references public.recipes(id),
  state jsonb not null,
  status text not null default 'cooking',
  step_index int not null default 0,
  call_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- The browser never talks to Supabase directly; API routes use the service role.
alter table public.recipes enable row level security;
alter table public.cooking_sessions enable row level security;
