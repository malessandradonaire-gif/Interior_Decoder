// Demo analyzer: no network calls. The palette is genuinely extracted from the photo
// (k-means over pixels); style, materials, hardware and tier come from the closest
// hand-written profile in ./profiles. Results are deterministic per image.
import { samplePixels, toHex, toHsl, type RGB } from "../image";
import type { SpecContent, Swatch } from "../types";
import { PROFILES, type Features } from "./profiles";

interface Cluster {
  rgb: RGB;
  share: number;
}

const dist2 = (a: RGB, b: RGB) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
const luma = ([r, g, b]: RGB) => 0.299 * r + 0.587 * g + 0.114 * b;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const round2 = (v: number) => Math.round(v * 100) / 100;
const chroma = (rgb: RGB) => (Math.max(...rgb) - Math.min(...rgb)) / 255;

function kmeans(pixels: RGB[], k: number, iterations = 10): Cluster[] {
  // Deterministic init: centers at luminance quantiles.
  const sorted = [...pixels].sort((a, b) => luma(a) - luma(b));
  let centers: RGB[] = Array.from({ length: k }, (_, i) => sorted[Math.floor(((i + 0.5) * sorted.length) / k)]);
  let counts = new Array<number>(k).fill(0);

  for (let iter = 0; iter < iterations; iter++) {
    const sums = centers.map(() => [0, 0, 0]);
    counts = new Array<number>(k).fill(0);
    for (const p of pixels) {
      let best = 0;
      let bestD = Infinity;
      for (let c = 0; c < k; c++) {
        const d = dist2(p, centers[c]);
        if (d < bestD) {
          bestD = d;
          best = c;
        }
      }
      sums[best][0] += p[0];
      sums[best][1] += p[1];
      sums[best][2] += p[2];
      counts[best]++;
    }
    centers = centers.map((c, i) =>
      counts[i] ? [sums[i][0] / counts[i], sums[i][1] / counts[i], sums[i][2] / counts[i]] : c,
    );
  }

  return centers
    .map((rgb, i) => ({ rgb, share: counts[i] / pixels.length }))
    .filter((c) => c.share > 0)
    .sort((a, b) => b.share - a.share);
}

/** Merge near-duplicate clusters and drop specks. */
function consolidate(clusters: Cluster[]): Cluster[] {
  const kept: Cluster[] = [];
  for (const c of clusters) {
    const twin = kept.find((k) => dist2(k.rgb, c.rgb) < 26 ** 2);
    if (twin) {
      const total = twin.share + c.share;
      twin.rgb = twin.rgb.map((v, i) => (v * twin.share + c.rgb[i] * c.share) / total) as RGB;
      twin.share = total;
    } else {
      kept.push({ rgb: [...c.rgb] as RGB, share: c.share });
    }
  }
  return kept.filter((c) => c.share >= 0.02).sort((a, b) => b.share - a.share);
}

function nameColor(rgb: RGB): string {
  const { h, s, l } = toHsl(rgb);
  const warm = rgb[0] - rgb[2] > 6;
  // Use chroma, not HSL saturation, to spot neutrals: saturation is inflated near white/black.
  if (chroma(rgb) < 0.07 || s < 0.12 || l < 0.08) {
    if (l > 0.9) return warm ? "Warm white" : "Bright white";
    if (l > 0.75) return warm ? "Ivory" : "Cool white";
    if (l > 0.58) return warm ? "Greige" : "Light gray";
    if (l > 0.38) return warm ? "Taupe" : "Stone gray";
    if (l > 0.18) return "Charcoal";
    return "Near black";
  }
  if (h < 15 || h >= 345) return l < 0.35 ? "Oxblood" : "Terracotta";
  if (h < 45) {
    if (l < 0.3) return "Walnut brown";
    if (l < 0.65) return s > 0.55 ? "Cognac" : "Natural oak";
    return "Sand beige";
  }
  if (h < 65) return s > 0.4 && l < 0.7 ? "Brass ochre" : "Khaki";
  if (h < 170) return s < 0.35 ? "Sage green" : l < 0.35 ? "Forest green" : "Leaf green";
  if (h < 200) return "Teal";
  if (h < 260) return l < 0.3 ? "Navy" : s < 0.35 ? "Dusty blue" : "Cobalt";
  if (h < 300) return "Plum";
  return "Dusty pink";
}

function buildPalette(clusters: Cluster[]): Swatch[] {
  const used = new Set<string>();
  return clusters.slice(0, 6).map((c, i) => {
    let name = nameColor(c.rgb);
    if (used.has(name)) name = `${toHsl(c.rgb).l > 0.5 ? "Pale" : "Deep"} ${name.toLowerCase()}`;
    used.add(name);
    return {
      hex: toHex(c.rgb),
      name,
      role: i === 0 ? "dominant" : i < 3 ? "secondary" : "accent",
      share: round2(c.share),
    };
  });
}

function measure(clusters: Cluster[]): Features {
  const f: Features = { lightness: 0, white: 0, dark: 0, wood: 0, color: 0, gray: 0, warmth: 0, brass: false };
  for (const { rgb, share } of clusters) {
    const { h, s, l } = toHsl(rgb);
    f.lightness += l * share;
    f.warmth += ((rgb[0] - rgb[2]) / 255) * share;
    const isWood = h >= 15 && h < 45 && s >= 0.2 && s <= 0.75 && l >= 0.2 && l <= 0.65;
    const neutral = chroma(rgb) < 0.08 || s < 0.15;
    if (l > 0.72 && (neutral || s < 0.25)) f.white += share;
    else if (l < 0.25) f.dark += share;
    else if (isWood) f.wood += share;
    else if (neutral) f.gray += share;
    else if (s > 0.35) f.color += share;
    if (h >= 35 && h < 58 && s > 0.35 && l > 0.3 && l < 0.7 && share >= 0.02) f.brass = true;
  }
  return f;
}

/** Small seeded PRNG so the same photo always yields the same confidences. */
function seededRandom(pixels: RGB[]): () => number {
  let seed = 2166136261;
  for (let i = 0; i < pixels.length; i += 7) {
    seed = Math.imul(seed ^ (pixels[i][0] + (pixels[i][1] << 8) + (pixels[i][2] << 16)), 16777619);
  }
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export async function analyzeDemo(imageDataUrl: string): Promise<SpecContent> {
  const pixels = await samplePixels(imageDataUrl);
  if (pixels.length === 0) throw new Error("The image appears to be empty.");

  const clusters = consolidate(kmeans(pixels, 8));
  const palette = buildPalette(clusters);
  const features = measure(clusters);
  const random = seededRandom(pixels);

  const ranked = PROFILES.map((p) => ({ p, score: p.score(features) })).sort((a, b) => b.score - a.score);
  const [top, runnerUp] = ranked;
  // How clearly the photo matches its best profile, 0..1.
  const fit = clamp((top.score - runnerUp.score) / (Math.abs(top.score) + 0.1), 0, 1);
  const confidence = (base: number, boost = 0) =>
    round2(clamp(base * (0.82 + 0.25 * fit) + boost + (random() - 0.5) * 0.08, 0.2, 0.97));

  const lightWord = features.lightness > 0.65 ? "bright" : features.lightness > 0.4 ? "balanced" : "moody";
  const warmWord = features.warmth > 0.04 ? "warm" : features.warmth < -0.02 ? "cool" : "neutral";
  const lead = palette[0];

  // Simulated latency so the demo flow feels like a real model call.
  await new Promise((r) => setTimeout(r, 1800));

  return {
    style: top.p.style,
    styleNotes: `${top.p.notes} The palette reads ${lightWord} and ${warmWord}, led by ${lead.name.toLowerCase()} (${Math.round(lead.share * 100)}% of the frame).`,
    materials: top.p.materials
      .map((m) => ({ name: m.name, element: m.element, confidence: confidence(m.base) }))
      .sort((a, b) => b.confidence - a.confidence),
    palette,
    hardware: top.p.hardware
      .map((h) => ({
        item: h.item,
        finish: h.finish,
        confidence: confidence(h.base, features.brass && /brass/i.test(h.finish) ? 0.08 : 0),
      }))
      .sort((a, b) => b.confidence - a.confidence),
    tier: top.p.tier,
    tierRationale: top.p.tierRationale,
    source: "demo",
  };
}
