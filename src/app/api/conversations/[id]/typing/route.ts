import { z } from "zod";
import { getCurrentUser } from "@/features/auth/session";
import { clearTyping, isParticipant, setTyping } from "@/features/chat/queries";

export const dynamic = "force-dynamic";

/**
 * "Typing…" signal. The composer POSTs at most every few seconds while the person types and
 * DELETEs when the draft is cleared; the other side sees it through the polling endpoint.
 * A route handler (not a Server Action) so these pings never queue in front of a message being sent.
 */
async function handle(ctx: RouteContext<"/api/conversations/[id]/typing">, update: typeof setTyping) {
  const user = await getCurrentUser();
  if (!user) return new Response(null, { status: 401 });

  const { id } = await ctx.params;
  if (!z.uuid().safeParse(id).success || !(await isParticipant(id, user.id))) return new Response(null, { status: 404 });

  await update(id, user.id);
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}

export function POST(_request: Request, ctx: RouteContext<"/api/conversations/[id]/typing">) {
  return handle(ctx, setTyping);
}

export function DELETE(_request: Request, ctx: RouteContext<"/api/conversations/[id]/typing">) {
  return handle(ctx, clearTyping);
}
