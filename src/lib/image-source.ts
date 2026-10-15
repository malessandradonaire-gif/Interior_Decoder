// Getting a photo in without saving it first: pasted images, and images dragged from another tab.

/** Image CDNs our /api/image route may fetch from (they block direct browser downloads). */
export const PROXY_IMAGE_HOSTS = ["i.pinimg.com"];

export class ImageSourceError extends Error {}

const COPY_PASTE_HINT = "Right-click the picture, choose “Copy image”, then paste it here.";

/** The first image file in a paste or drop, if any. */
export function imageFileFrom(data: DataTransfer | null): File | null {
  if (!data) return null;
  for (const item of Array.from(data.items ?? [])) {
    if (item.kind === "file" && item.type.startsWith("image/")) return item.getAsFile();
  }
  const file = data.files?.[0];
  return file && file.type.startsWith("image/") ? file : null;
}

/** An image URL from a drag between tabs (prefers the <img> itself over the link around it). */
export function imageUrlFrom(data: DataTransfer | null): string | null {
  if (!data) return null;
  const html = data.getData("text/html");
  const src = html && new DOMParser().parseFromString(html, "text/html").querySelector("img")?.getAttribute("src");
  if (src && /^https?:\/\//i.test(src)) return src;

  const uri = data
    .getData("text/uri-list")
    .split(/\r?\n/)
    .find((line) => line && !line.startsWith("#"));
  if (uri && /^https?:\/\//i.test(uri)) return uri;

  const text = data.getData("text/plain").trim();
  return /^https?:\/\/\S+$/i.test(text) ? text : null;
}

/** Pinterest serves several sizes; ask for the larger 736px version instead of a thumbnail. */
function upgradePinterestSize(url: URL): URL {
  if (url.hostname === "i.pinimg.com") url.pathname = url.pathname.replace(/^\/\d+x\//, "/736x/");
  return url;
}

export async function fileFromImageUrl(raw: string): Promise<File> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new ImageSourceError("That doesn't look like an image link.");
  }
  if (/(^|\.)pinterest\.[a-z.]+$/i.test(url.hostname) || url.hostname === "pin.it") {
    throw new ImageSourceError(`That's a link to a Pinterest page, not the image. Drag the picture itself, or: ${COPY_PASTE_HINT}`);
  }

  upgradePinterestSize(url);
  const viaProxy = PROXY_IMAGE_HOSTS.includes(url.hostname);
  let response: Response;
  try {
    response = await fetch(viaProxy ? `/api/image?url=${encodeURIComponent(url.href)}` : url.href);
  } catch {
    // Most sites block other pages from downloading their images.
    throw new ImageSourceError(`That site doesn't let us grab the image directly. ${COPY_PASTE_HINT}`);
  }
  if (!response.ok) {
    const message = viaProxy ? ((await response.json().catch(() => null)) as { error?: string } | null)?.error : null;
    throw new ImageSourceError(message ?? `Couldn't download that image. ${COPY_PASTE_HINT}`);
  }

  const blob = await response.blob();
  if (!blob.type.startsWith("image/")) throw new ImageSourceError(`That link isn't an image. ${COPY_PASTE_HINT}`);
  const name = url.pathname.split("/").pop() || "image";
  return new File([blob], name, { type: blob.type });
}
