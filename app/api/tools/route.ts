import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import type { ToolName } from "@/lib/agent-config";
import {
  cancelTimer,
  currentStep,
  jumpToStep,
  markTimerFired,
  nextStep,
  noteSubstitution,
  previousStep,
  setServings,
  startTimer,
  type Transition,
} from "@/lib/session";
import { getSession, saveSession } from "@/lib/store";

type ToolBody = {
  tool: ToolName | string;
  arguments?: Record<string, unknown>;
  call?: { id?: string };
};

export async function POST(req: Request) {
  const sessionId = req.headers.get("x-sous-session");
  const secret = req.headers.get("x-sous-secret");
  const session = sessionId ? await getSession(sessionId) : null;
  if (!session || session.secret !== secret) {
    return NextResponse.json({ error: "Unknown cooking session" }, { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as ToolBody | null;
  if (!body?.tool) return NextResponse.json({ error: "Missing tool name" }, { status: 400 });
  const args = body.arguments ?? {};
  const now = Date.now();

  let t: Transition;
  switch (body.tool) {
    case "next_step":
      t = nextStep(session, now);
      break;
    case "previous_step":
      t = previousStep(session, now);
      break;
    case "get_current_step":
      t = currentStep(session);
      break;
    case "jump_to_step":
      t = jumpToStep(session, Number(args.step_number), now);
      break;
    case "manage_timer": {
      const action = String(args.action ?? "start");
      if (action === "cancel") t = cancelTimer(session, args.label as string | undefined, now);
      else if (action === "fired") t = markTimerFired(session, String(args.timer_id ?? ""), now);
      else t = startTimer(session, args.label as string | undefined, args.seconds === undefined || args.seconds === null ? undefined : Number(args.seconds), randomUUID(), now);
      break;
    }
    case "note_substitution":
      t = noteSubstitution(session, String(args.ingredient ?? ""), String(args.substitute ?? ""), now);
      break;
    case "set_servings":
      t = setServings(session, Number(args.servings), now);
      break;
    default:
      return NextResponse.json({ error: `Unknown tool ${body.tool}` }, { status: 400 });
  }

  const next = { ...t.state, toolCalls: session.toolCalls + 1, callId: body.call?.id ?? session.callId };
  await saveSession(next);
  console.log(`[sous] ${session.id.slice(0, 8)} tool ${body.tool} ${JSON.stringify(args)} -> step ${next.stepIndex + 1} :: ${t.result.spoken}`);
  return NextResponse.json(t.result);
}
