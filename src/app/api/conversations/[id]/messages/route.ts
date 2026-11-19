import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/features/auth/session";
import { getConversationForUser, listMessages, markConversationRead } from "@/features/chat/queries";

export const dynamic = "force-dynamic";

const querySchema = z.object({ id: z.uuid(), after: z.iso.datetime().optional() });

/** Polling endpoint: returns messages newer than `after` for a participant. */
export async function GET(request: Request, ctx: RouteContext<"/api/conversations/[id]/messages">) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const after = new URL(request.url).searchParams.get("after") ?? undefined;
  const parsed = querySchema.safeParse({ id, after });
  if (!parsed.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  const conversation = await getConversationForUser(parsed.data.id, user.id);
  if (!conversation) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const messages = await listMessages(conversation.id, parsed.data.after ? new Date(parsed.data.after) : undefined);
  if (messages.some((m) => m.senderId !== user.id)) await markConversationRead(conversation.id, user.id);
  return NextResponse.json({ messages }, { headers: { "Cache-Control": "no-store" } });
}
