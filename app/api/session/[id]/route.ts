import { NextResponse } from "next/server";
import { getSession } from "@/lib/store";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await getSession(id);
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { secret: _secret, ...safe } = session;
  return NextResponse.json(safe, { headers: { "Cache-Control": "no-store" } });
}
