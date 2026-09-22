/**
 * [INPUT]: Depends on the Google Fonts CSS API and a requested UI character inventory.
 * [OUTPUT]: Downloads a minimal OFL-licensed Noto Sans SC TrueType subset with provenance.
 * [POS]: Build-time typography adapter used only to rasterize fixed profile text into the screen asset.
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { createHash } from "node:crypto";

const FONT_CSS_ENDPOINT = "https://fonts.googleapis.com/css2";

export function buildFontCssUrl(text) {
  const url = new URL(FONT_CSS_ENDPOINT);
  url.searchParams.set("family", "Noto Sans SC:wght@600");
  url.searchParams.set("text", text);
  return url.href;
}

export function extractFontUrl(css) {
  const match = css.match(/src:\s*url\((https:\/\/[^)]+)\)\s*format\(['"]truetype['"]\)/i);
  if (!match) throw new Error("Google Fonts response did not contain a TrueType subset URL");
  return match[1];
}

export async function downloadUiFont(text) {
  const cssUrl = buildFontCssUrl(text);
  const cssResponse = await fetch(cssUrl, {
    headers: { "user-agent": "ai-passport-maple-avatar-importer/0.1" },
  });
  if (!cssResponse.ok) {
    throw new Error(`Noto Sans SC CSS download failed: HTTP ${cssResponse.status}`);
  }
  const fontUrl = extractFontUrl(await cssResponse.text());
  const fontResponse = await fetch(fontUrl);
  if (!fontResponse.ok) {
    throw new Error(`Noto Sans SC subset download failed: HTTP ${fontResponse.status}`);
  }
  const bytes = Buffer.from(await fontResponse.arrayBuffer());
  if (bytes.length < 1024 || bytes.readUInt32BE(0) !== 0x00010000) {
    throw new Error("Noto Sans SC subset is not a valid TrueType font");
  }
  return {
    bytes,
    cssUrl,
    fontUrl,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
}
