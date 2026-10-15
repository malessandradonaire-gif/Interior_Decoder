// Fetches an image the user dragged in from a site that blocks cross-origin downloads.
// Locked to an allow-list of image CDNs so it can't be used to fetch arbitrary URLs.
import { PROXY_IMAGE_HOSTS } from "@/lib/image-source";

const MAX_BYTES = 15 * 1024 * 1024;

const fail = (status: number, error: string) => Response.json({ error }, { status });

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("url");
  let target: URL;
  try {
    target = new URL(raw ?? "");
  } catch {
    return fail(400, "Missing or invalid image URL.");
  }
  if (target.protocol !== "https:" || !PROXY_IMAGE_HOSTS.includes(target.hostname)) {
    return fail(400, "Images can only be fetched from Pinterest.");
  }

  let upstream: Response;
  try {
    // redirect: "error" stops a redirect from leading us off the allow-listed host.
    upstream = await fetch(target, { redirect: "error", signal: AbortSignal.timeout(10_000) });
  } catch {
    return fail(502, "Couldn't reach Pinterest for that image.");
  }
  if (!upstream.ok) return fail(502, "Pinterest didn't return that image.");

  const type = upstream.headers.get("content-type") ?? "";
  if (!type.startsWith("image/")) return fail(415, "That link isn't an image.");
  if (Number(upstream.headers.get("content-length") ?? 0) > MAX_BYTES) return fail(413, "That image is too large.");

  const body = await upstream.arrayBuffer();
  if (body.byteLength > MAX_BYTES) return fail(413, "That image is too large.");

  return new Response(body, {
    headers: { "content-type": type, "cache-control": "private, max-age=3600" },
  });
}
