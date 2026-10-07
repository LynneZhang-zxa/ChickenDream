// Creates or updates the Sous agent on ALEBEX and writes ALEBEX_AGENT_ID into .env.local.
import fs from "node:fs";
import { AGENT_NAME, AGENT_PROMPT, FIRST_MESSAGE } from "../lib/agent-config";
import { ALEBEX_API, requireEnv } from "../lib/alebex";

try {
  process.loadEnvFile(".env.local");
} catch {
  /* no .env.local yet; rely on the environment */
}

async function api(path: string, init?: RequestInit) {
  const key = requireEnv("ALEBEX_API_KEY");
  const headers = { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
  const res = await fetch(`${ALEBEX_API}${path}`, { ...init, headers: { ...headers, ...(init?.headers ?? {}) } });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${init?.method ?? "GET"} ${path} -> ${res.status} ${JSON.stringify(json).slice(0, 400)}`);
  return json;
}

const config = {
  name: AGENT_NAME,
  prompt: AGENT_PROMPT,
  firstMessage: FIRST_MESSAGE,
  brainTier: "premium",
  temperature: 0.6,
  behaviour: {
    turnEnd: "fast",
    allowEndCall: false,
    idlePrompt: false,
    callEvents: true,
    backgroundVolume: 0,
    callLimitMinutes: null,
  },
  opening: { speaksFirst: true, strictFirstMessage: true },
};

async function main() {
  const list = (await api("/public/agents?limit=100")) as { items: { id: string; name: string }[] };
  const existing = list.items.find((a) => a.name === AGENT_NAME) ?? (process.env.ALEBEX_AGENT_ID ? { id: process.env.ALEBEX_AGENT_ID } : null);

  let agentId: string;
  if (existing) {
    const { name: _n, ...patch } = config;
    const a = (await api(`/public/agents/${existing.id}`, { method: "PATCH", body: JSON.stringify(patch) })) as { id: string };
    agentId = a.id;
    console.log(`Updated agent ${agentId}`);
  } else {
    const a = (await api("/public/agents", { method: "POST", body: JSON.stringify(config) })) as { id: string };
    agentId = a.id;
    console.log(`Created agent ${agentId}`);
  }

  const envPath = ".env.local";
  const env = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
  const lines = env.split("\n").filter((l) => l.trim() !== "" && !l.startsWith("ALEBEX_AGENT_ID="));
  lines.push(`ALEBEX_AGENT_ID=${agentId}`);
  fs.writeFileSync(envPath, lines.join("\n") + "\n");
  console.log("Wrote ALEBEX_AGENT_ID to .env.local");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
