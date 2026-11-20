import { z } from "zod";
import { getCurrentUser } from "@/features/auth/session";
import { getMessageForUser } from "@/features/chat/queries";
import { createVideoSignedUrl } from "@/features/chat/storage";

export const dynamic = "force-dynamic";

/** Long enough to watch and seek through a video; a new link is issued every time the chat loads it. */
const SIGNED_URL_SECONDS = 60 * 60;

/**
 * Redirects conversation participants to a short-lived signed URL of the video.
 * Streaming through a function would hit its response size limit and break seeking (Range requests).
 */
export async function GET(_request: Request, ctx: RouteContext<"/api/chat/videos/[id]">) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { id } = await ctx.params;
  if (!z.uuid().safeParse(id).success) return new Response("Not found", { status: 404 });

  const message = await getMessageForUser(id, user.id);
  if (!message?.videoPath) return new Response("Not found", { status: 404 });

  const location = await createVideoSignedUrl(message.videoPath, SIGNED_URL_SECONDS);
  if (!location) return new Response("Not found", { status: 404 });

  return new Response(null, {
    status: 302,
    headers: { Location: location, "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" },
  });
}
