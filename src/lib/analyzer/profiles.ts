import type { Tier } from "../types";

/** Image measurements the demo analyzer derives from the photo's color clusters (shares are 0..1). */
export interface Features {
  lightness: number;
  white: number;
  dark: number;
  wood: number;
  color: number;
  gray: number;
  /** roughly -0.2 (cool) .. 0.2 (warm) */
  warmth: number;
  brass: boolean;
}

export interface StyleProfile {
  id: string;
  style: string;
  notes: string;
  tier: Tier;
  tierRationale: string;
  materials: { name: string; element: string; base: number }[];
  hardware: { item: string; finish: string; base: number }[];
  score: (f: Features) => number;
}

export const PROFILES: StyleProfile[] = [
  {
    id: "modern-luxe",
    style: "Modern luxe / transitional",
    notes: "Clean-lined cabinetry anchored by a statement natural stone, with refined metal accents and minimal ornament.",
    tier: "high",
    tierRationale: "Large book-matched stone surfaces, integrated appliances and custom millwork point to a high-end build.",
    materials: [
      { name: "Calacatta-style marble, honed or polished", element: "Island top & waterfall edge", base: 0.88 },
      { name: "Flat-panel lacquered cabinetry (satin MDF)", element: "Perimeter cabinets", base: 0.8 },
      { name: "Full-height stone slab backsplash", element: "Backsplash", base: 0.7 },
      { name: "Engineered white oak, wide plank", element: "Flooring", base: 0.62 },
      { name: "Undermount stainless steel sink", element: "Sink", base: 0.58 },
      { name: "Panel-ready integrated appliances", element: "Fridge & dishwasher", base: 0.55 },
      { name: "Fluted wood or ribbed panel", element: "Island base", base: 0.4 },
    ],
    hardware: [
      { item: "Slim bar pulls", finish: "Brushed brass", base: 0.72 },
      { item: "Gooseneck pull-down faucet", finish: "Champagne bronze / brushed brass", base: 0.66 },
      { item: "Globe pendants", finish: "Opal glass with brass fittings", base: 0.56 },
    ],
    score: (f) => f.white * 2 + f.gray * 1 - f.color * 1.5 - f.dark * 0.5 + (f.lightness > 0.6 ? 0.3 : 0),
  },
  {
    id: "japandi",
    style: "Warm minimalist / Japandi",
    notes: "Natural wood grain and soft plaster textures in a calm, low-contrast composition with hidden storage.",
    tier: "upper-mid",
    tierRationale: "Veneered rift-sawn oak and handmade finishes sit above standard builder grade without bespoke stonework.",
    materials: [
      { name: "Rift-sawn white oak veneer", element: "Cabinet fronts", base: 0.84 },
      { name: "Honed quartz, warm white", element: "Countertops", base: 0.72 },
      { name: "Limewash or microcement plaster", element: "Walls & range hood", base: 0.62 },
      { name: "Large-format porcelain tile, stone look", element: "Flooring", base: 0.58 },
      { name: "Handmade zellige ceramic tile", element: "Backsplash", base: 0.46 },
      { name: "Linen / rattan upholstery", element: "Stools", base: 0.4 },
    ],
    hardware: [
      { item: "Integrated finger pulls / edge grips", finish: "Natural oak", base: 0.7 },
      { item: "Single-lever minimalist faucet", finish: "Matte black", base: 0.6 },
      { item: "Paper or linen drum pendants", finish: "Warm white diffuser", base: 0.5 },
    ],
    score: (f) => f.wood * 2 + f.white * 0.8 + f.warmth * 3 - f.dark * 0.5 - f.color,
  },
  {
    id: "modern-farmhouse",
    style: "Modern farmhouse",
    notes: "Crisp white shaker cabinetry with black accents and warm wood, balancing rustic texture and clean lines.",
    tier: "mid",
    tierRationale: "Stock-style shaker doors, ceramic tile and quartz are common mid-range specifications.",
    materials: [
      { name: "Shaker-style painted cabinetry", element: "Perimeter cabinets", base: 0.82 },
      { name: "White ceramic subway tile", element: "Backsplash", base: 0.74 },
      { name: "Marble-look quartz", element: "Countertops", base: 0.66 },
      { name: "Butcher-block oak", element: "Island top", base: 0.55 },
      { name: "Fireclay apron-front sink", element: "Sink", base: 0.6 },
      { name: "Wide-plank oak or LVP", element: "Flooring", base: 0.52 },
      { name: "Shiplap / timber beams", element: "Walls & ceiling", base: 0.38 },
    ],
    hardware: [
      { item: "Cup pulls and knobs", finish: "Matte black", base: 0.74 },
      { item: "Bridge faucet", finish: "Matte black / oil-rubbed bronze", base: 0.6 },
      { item: "Metal dome pendants", finish: "Black iron", base: 0.58 },
    ],
    score: (f) => f.white * 1.2 + f.dark * 1.2 + f.wood * 0.8 + (f.white > 0.2 && f.dark > 0.1 ? 0.4 : 0),
  },
  {
    id: "dark-contemporary",
    style: "Dark contemporary",
    notes: "Moody, monolithic surfaces with matte finishes and low-sheen metals for a dramatic, architectural feel.",
    tier: "high",
    tierRationale: "Super-matte anti-fingerprint laminates, natural dark stone and specialty glass are premium choices.",
    materials: [
      { name: "Super-matte lacquer / Fenix laminate, black", element: "Cabinet fronts", base: 0.82 },
      { name: "Leathered soapstone or black granite", element: "Countertops", base: 0.72 },
      { name: "Nero Marquina-look porcelain slab", element: "Backsplash", base: 0.58 },
      { name: "Smoked or fluted glass", element: "Upper cabinet doors", base: 0.5 },
      { name: "Dark-stained oak or walnut veneer", element: "Tall units / shelving", base: 0.55 },
      { name: "Dark engineered wood or concrete", element: "Flooring", base: 0.48 },
    ],
    hardware: [
      { item: "Recessed edge pulls", finish: "Brushed bronze", base: 0.66 },
      { item: "Pull-down faucet", finish: "Gunmetal", base: 0.6 },
      { item: "Linear LED pendant", finish: "Black metal", base: 0.55 },
    ],
    score: (f) => f.dark * 2.5 + (1 - f.lightness) * 0.6,
  },
  {
    id: "colour-forward",
    style: "Mid-century / colour-forward",
    notes: "Saturated painted cabinetry with walnut and terrazzo, playful geometry and vintage-inspired lighting.",
    tier: "upper-mid",
    tierRationale: "Custom paint colors, walnut veneer and terrazzo surfaces are a step above standard specs.",
    materials: [
      { name: "Painted cabinetry in a saturated color", element: "Cabinet fronts", base: 0.84 },
      { name: "Walnut veneer", element: "Open shelving / island", base: 0.6 },
      { name: "Terrazzo", element: "Countertops or flooring", base: 0.52 },
      { name: "Glossy stacked ceramic tile", element: "Backsplash", base: 0.62 },
      { name: "Solid-surface countertop", element: "Countertops", base: 0.45 },
      { name: "Cork or oak parquet", element: "Flooring", base: 0.4 },
    ],
    hardware: [
      { item: "Knobs and tab pulls", finish: "Polished brass", base: 0.64 },
      { item: "Two-handle bridge faucet", finish: "Polished brass / chrome", base: 0.52 },
      { item: "Globe or Sputnik pendant", finish: "Brass and glass", base: 0.5 },
    ],
    score: (f) => f.color * 3 + f.wood * 0.5,
  },
  {
    id: "industrial",
    style: "Urban industrial",
    notes: "Raw, utilitarian materials — concrete, steel and reclaimed timber — with exposed structure and open shelving.",
    tier: "mid",
    tierRationale: "Commercial-style stainless and concrete can be done at mid-range cost; finishes are durable rather than precious.",
    materials: [
      { name: "Polished or sealed concrete", element: "Countertops / flooring", base: 0.76 },
      { name: "Brushed stainless steel", element: "Worktops & appliances", base: 0.72 },
      { name: "Flat-panel laminate, gray", element: "Cabinet fronts", base: 0.6 },
      { name: "Reclaimed wood", element: "Open shelving", base: 0.52 },
      { name: "Blackened steel frame", element: "Shelving & supports", base: 0.5 },
      { name: "Exposed brick", element: "Feature wall", base: 0.38 },
    ],
    hardware: [
      { item: "Bar / T-pulls", finish: "Brushed stainless", base: 0.68 },
      { item: "Commercial pre-rinse faucet", finish: "Stainless / chrome", base: 0.62 },
      { item: "Caged pendants with filament bulbs", finish: "Black iron", base: 0.5 },
    ],
    score: (f) => f.gray * 2 + f.dark * 0.5 - f.warmth * 2 - f.white * 0.3,
  },
];
