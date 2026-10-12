// Turns a spec into shoppable items with Amazon search links. It works from the spec text alone,
// so it also covers specs saved before this feature existed and future Claude-made specs.
import type { SpecContent } from "./types";

export type ShopCategory =
  | "pull"
  | "knob"
  | "faucet"
  | "pendant"
  | "sink"
  | "tile"
  | "stone"
  | "wood"
  | "stool"
  | "shelf"
  | "paint";

export interface ShopItem {
  name: string;
  detail: string;
  category: ShopCategory;
  /** Thumbnail tint taken from the finish or material. */
  tint: string;
  url: string;
}

const CATEGORY_RULES: [RegExp, ShopCategory][] = [
  [/faucet|\btap\b/i, "faucet"],
  [/knob/i, "knob"],
  // "pulls" but not "pull-down"
  [/\bpulls?\b(?!-)|grip|handle/i, "pull"],
  [/pendant|\blight|\bled\b|\blamp/i, "pendant"],
  [/sink/i, "sink"],
  [/tile|zellige|subway/i, "tile"],
  [/marble|quartz|granite|soapstone|terrazzo|concrete|stone|slab|porcelain/i, "stone"],
  [/stool|rattan|linen/i, "stool"],
  [/shelf|shelving|steel frame/i, "shelf"],
  [/plaster|limewash|microcement/i, "paint"],
  [/oak|walnut|wood|veneer|butcher|timber|parquet|cork/i, "wood"],
];

// Search phrasing that makes Amazon return products rather than raw building materials.
const QUERY_SUFFIX: Partial<Record<ShopCategory, string>> = {
  pull: "cabinet pulls",
  knob: "cabinet knobs",
  faucet: "kitchen faucet",
  pendant: "kitchen pendant light",
  sink: "kitchen sink",
  tile: "tile",
  stone: "sample",
  wood: "sample",
  stool: "counter stool",
  shelf: "kitchen shelf",
  paint: "paint",
};

const TINTS: [RegExp, string][] = [
  [/brass|champagne|gold/i, "#B8935A"],
  [/bronze|gunmetal/i, "#7A5C44"],
  [/black|iron|nero|soapstone|granite/i, "#2B2825"],
  [/stainless|chrome|steel|nickel/i, "#A3A8AD"],
  [/walnut/i, "#6B4A33"],
  [/oak|wood|rattan|linen|butcher|cork/i, "#C29F79"],
  [/concrete|gray|grey|microcement/i, "#9C9893"],
  [/terracotta/i, "#B66A4C"],
  [/marble|calacatta|quartz|white|plaster|limewash|zellige|subway|fireclay|opal|paper/i, "#E7E3DC"],
];

function categorize(text: string): ShopCategory | undefined {
  return CATEGORY_RULES.find(([re]) => re.test(text))?.[1];
}

function tintFor(text: string, fallback: string): string {
  return TINTS.find(([re]) => re.test(text))?.[1] ?? fallback;
}

/** "Calacatta-style marble, honed or polished" -> "Calacatta-style marble" */
function withoutDetails(text: string): string {
  return text.split(/[,(]/)[0].trim();
}

/** Also keeps only the first of "A / B" alternatives: "Matte black / oil-rubbed bronze" -> "Matte black" */
function core(text: string): string {
  return withoutDetails(text).split(" / ")[0].trim();
}

/** Appends the category phrase without repeating words the base already has. */
function buildQuery(base: string, category: ShopCategory): string {
  const words = base.toLowerCase();
  const suffix = (QUERY_SUFFIX[category] ?? "").split(" ").filter((w) => !words.includes(w.replace(/s$/, "")));
  return [base, ...suffix].join(" ").replace(/\s+/g, " ").trim();
}

export function amazonSearchUrl(query: string): string {
  return `https://www.amazon.com/s?k=${encodeURIComponent(query)}`;
}

export function shoppingList(spec: SpecContent, limit = 10): ShopItem[] {
  const fallbackTint = spec.palette[1]?.hex ?? "#C29F79";
  const items: ShopItem[] = [];
  const seen = new Set<string>();

  const add = (name: string, detail: string, queryBase: string, categoryText: string, tintText: string) => {
    const category = categorize(categoryText);
    if (!category) return;
    const query = buildQuery(queryBase, category);
    if (seen.has(query.toLowerCase())) return;
    seen.add(query.toLowerCase());
    items.push({ name, detail, category, tint: tintFor(tintText, fallbackTint), url: amazonSearchUrl(query) });
  };

  for (const h of spec.hardware) {
    const finish = core(h.finish);
    add(h.item, finish, `${finish} ${core(h.item)}`, h.item, h.finish);
  }
  for (const m of spec.materials) {
    const name = withoutDetails(m.name);
    add(name, m.element, name, `${m.name} ${m.element}`, m.name);
  }
  return items.slice(0, limit);
}
