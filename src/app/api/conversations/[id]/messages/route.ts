import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/features/auth/session";
import { getConversationForUser, isOtherTyping, listMessages, listReactionsSince, markConversationRead } from "@/features/chat/queries";

export const dynamic = "force-dynamic";

const querySchema = z.object({ id: z.uuid(), after: z.iso.datetime().optional(), since: z.iso.datetime().optional() });

/**
 * Polling endpoint for a participant: messages newer than `after`, every reaction on messages
 * created since `since` (the oldest message the client holds) and whether the other person is typing.
 */
export async function GET(request: Request, ctx: RouteContext<"/api/conversations/[id]/messages">) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const params = new URL(request.url).searchParams;
  const parsed = querySchema.safeParse({ id, after: params.get("after") ?? undefined, since: params.get("since") ?? undefined });
  if (!parsed.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  const conversation = await getConversationForUser(parsed.data.id, user.id);
  if (!conversation) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { after, since } = parsed.data;
  const [messages, reactions, typing] = await Promise.all([
    listMessages(conversation.id, after ? new Date(after) : undefined),
    since ? listReactionsSince(conversation.id, new Date(since)) : Promise.resolve(null),
    isOtherTyping(conversation.id, user.id),
  ]);
  if (messages.some((m) => m.senderId !== user.id)) await markConversationRead(conversation.id, user.id);
  return NextResponse.json({ messages, reactions, typing }, { headers: { "Cache-Control": "no-store" } });
}
