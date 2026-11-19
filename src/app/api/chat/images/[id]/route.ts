import { z } from "zod";
import { getCurrentUser } from "@/features/auth/session";
import { getImagePathForUser } from "@/features/chat/queries";
import { downloadChatImage } from "@/features/chat/storage";

export const dynamic = "force-dynamic";

/** Streams a chat photo from the private bucket to conversation participants only. */
export async function GET(_request: Request, ctx: RouteContext<"/api/chat/images/[id]">) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { id } = await ctx.params;
  if (!z.uuid().safeParse(id).success) return new Response("Not found", { status: 404 });

  const path = await getImagePathForUser(id, user.id);
  if (!path) return new Response("Not found", { status: 404 });

  const image = await downloadChatImage(path);
  if (!image) return new Response("Not found", { status: 404 });

  return new Response(image.body, {
    headers: {
      "Content-Type": image.contentType,
      // Private: browsers may cache, shared caches/CDN must not.
      "Cache-Control": "private, max-age=86400, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'",
    },
  });
}
