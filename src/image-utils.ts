export type ExtractedImageKind = "markdown" | "html" | "data" | "bare_url";

export interface ExtractedImage {
  url: string;
  kind: ExtractedImageKind;
  alt?: string;
}

const DATA_IMAGE_RE = /data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=\s]+/g;
const MARKDOWN_IMAGE_RE = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
const HTML_IMAGE_RE = /<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi;
const BARE_IMAGE_URL_RE =
  /https?:\/\/[^\s<>"')\]]+\.(?:png|jpe?g|gif|webp|bmp)(?:\?[^\s<>"')\]]*)?/gi;

/**
 * Достаёт URL/data-URI картинок из текста ответа агента
 * (markdown, HTML, data:image, прямые ссылки на файлы).
 */
export function extractImagesFromText(text: string): ExtractedImage[] {
  if (!text) return [];

  const found: ExtractedImage[] = [];
  const seen = new Set<string>();

  const push = (item: ExtractedImage) => {
    const key = item.url.trim();
    if (!key || seen.has(key)) return;
    seen.add(key);
    found.push({ ...item, url: key });
  };

  for (const match of text.matchAll(MARKDOWN_IMAGE_RE)) {
    push({ url: match[2], kind: "markdown", alt: match[1] || undefined });
  }

  for (const match of text.matchAll(HTML_IMAGE_RE)) {
    push({ url: match[1], kind: "html" });
  }

  for (const match of text.matchAll(DATA_IMAGE_RE)) {
    push({ url: match[0].replace(/\s+/g, ""), kind: "data" });
  }

  for (const match of text.matchAll(BARE_IMAGE_URL_RE)) {
    push({ url: match[0], kind: "bare_url" });
  }

  return found;
}

export function guessMimeTypeFromUrl(url: string): string | undefined {
  if (url.startsWith("data:")) {
    const m = /^data:([^;]+);/.exec(url);
    return m?.[1];
  }
  const clean = url.split("?")[0]?.toLowerCase() ?? "";
  if (clean.endsWith(".png")) return "image/png";
  if (clean.endsWith(".jpg") || clean.endsWith(".jpeg")) return "image/jpeg";
  if (clean.endsWith(".webp")) return "image/webp";
  if (clean.endsWith(".gif")) return "image/gif";
  return undefined;
}

export function dataUrlToBuffer(dataUrl: string): {
  buffer: Buffer;
  mimeType: string;
} {
  const m = /^data:([^;]+);base64,(.+)$/s.exec(dataUrl.replace(/\s+/g, ""));
  if (!m) {
    throw new Error("Invalid data URL");
  }
  return {
    mimeType: m[1],
    buffer: Buffer.from(m[2], "base64"),
  };
}
