export const ALEBEX_API = "https://api.alebex.ai/api/v1";
export const ENGINE = "https://api.voice.alebex.ai";
export const WS_URL = "wss://api.voice.alebex.ai/public/ws/call";

export function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name} in .env.local`);
  return v;
}

/** Exchange the API key for a short-lived token the public WebSocket accepts. */
export async function mintWsToken(): Promise<string> {
  const key = requireEnv("ALEBEX_API_KEY");
  const res = await fetch(`${ENGINE}/public/token`, {
    method: "POST",
    headers: { "X-API-Key": key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: "{}",
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`token endpoint ${res.status}: ${text.slice(0, 300)}`);
  let json: Record<string, unknown> = {};
  try {
    json = JSON.parse(text);
  } catch {
    /* plain text token */
  }
  const token = (json.token ?? json.access_token ?? json.wsToken ?? json.ws_token) as string | undefined;
  if (token) return token;
  if (/^[\w.-]{16,}$/.test(text.trim())) return text.trim();
  throw new Error(`token response had no token field: ${text.slice(0, 300)}`);
}

/**
 * The https base the ALEBEX engine can reach for tool calls.
 * Order: PUBLIC_BASE env, a running ngrok tunnel, the request host (on Vercel).
 */
export async function resolvePublicBase(req: Request): Promise<{ base: string | null; source: string }> {
  if (process.env.PUBLIC_BASE) return { base: process.env.PUBLIC_BASE.replace(/\/$/, ""), source: "env" };
  try {
    const r = await fetch("http://127.0.0.1:4040/api/tunnels", { signal: AbortSignal.timeout(800) });
    const j = (await r.json()) as { tunnels?: { public_url?: string }[] };
    const t = j.tunnels?.find((x) => x.public_url?.startsWith("https://"));
    if (t?.public_url) return { base: t.public_url, source: "ngrok" };
  } catch {
    /* no ngrok */
  }
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (host && !/localhost|127\.0\.0\.1/.test(host)) return { base: `https://${host}`, source: "host" };
  return { base: null, source: "none" };
}
