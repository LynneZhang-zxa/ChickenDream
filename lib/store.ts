import { randomUUID, randomBytes } from "node:crypto";
import { newSession, type SessionState } from "./session";
import { supabaseAdmin } from "./supabase";

// In-memory first (fast, reliable for a single dev server), mirrored to Supabase so a
// multi-instance deployment can read a session another instance wrote.
const g = globalThis as unknown as { __sousSessions?: Map<string, SessionState> };
const memory = (g.__sousSessions ??= new Map<string, SessionState>());

export async function createSession(recipeId: string): Promise<SessionState> {
  const state = newSession(recipeId, randomUUID(), randomBytes(16).toString("hex"));
  memory.set(state.id, state);
  await mirror(state);
  return state;
}

export async function getSession(id: string): Promise<SessionState | null> {
  const hit = memory.get(id);
  if (hit) return hit;
  const sb = supabaseAdmin();
  if (!sb) return null;
  const { data, error } = await sb.from("cooking_sessions").select("state").eq("id", id).maybeSingle();
  if (error) console.warn("[sous] supabase read failed", error.message);
  const state = (data?.state as SessionState | undefined) ?? null;
  if (state) memory.set(id, state);
  return state;
}

export async function saveSession(state: SessionState): Promise<void> {
  memory.set(state.id, state);
  await mirror(state);
}

async function mirror(state: SessionState) {
  const sb = supabaseAdmin();
  if (!sb) return;
  const { error } = await sb.from("cooking_sessions").upsert({
    id: state.id,
    recipe_id: state.recipeId,
    state,
    status: state.status,
    step_index: state.stepIndex,
    call_id: state.callId,
    updated_at: new Date(state.updatedAt).toISOString(),
  });
  if (error) console.warn("[sous] supabase write failed", error.message);
}
