import { NextResponse } from "next/server";
import { buildStartCall } from "@/lib/agent-config";
import { mintWsToken, requireEnv, resolvePublicBase, WS_URL } from "@/lib/alebex";
import { CREAMY_GARLIC_CHICKEN, getRecipe } from "@/lib/recipe";
import { createSession } from "@/lib/store";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as { recipeId?: string };
    const recipe = getRecipe(body.recipeId ?? CREAMY_GARLIC_CHICKEN.id);
    if (!recipe) return NextResponse.json({ error: "Unknown recipe" }, { status: 404 });

    const agentId = requireEnv("ALEBEX_AGENT_ID");
    const session = await createSession(recipe.id);
    const { base, source } = await resolvePublicBase(req);
    const warnings: string[] = [];
    if (!base) warnings.push("No public https base for tools (start ngrok or set PUBLIC_BASE). The agent can talk but cannot change steps.");

    let token: string;
    try {
      token = await mintWsToken();
    } catch (e) {
      if (process.env.NODE_ENV === "production" && process.env.ALLOW_RAW_KEY !== "1") throw e;
      console.warn("[sous] token mint failed, using raw key for the socket:", (e as Error).message);
      token = requireEnv("ALEBEX_API_KEY");
      // Dev-only fallback; logged above, not shown to the cook.
    }

    console.log(`[sous] call start session=${session.id} tools=${base ?? "none"} (${source})`);
    return NextResponse.json({
      sessionId: session.id,
      secret: session.secret,
      wsUrl: WS_URL,
      subprotocol: `alebex.token.${token}`,
      startCall: buildStartCall(agentId, recipe, session, base),
      state: session,
      recipe,
      warnings,
    });
  } catch (e) {
    const message = (e as Error).message;
    console.error("[sous] call start failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
