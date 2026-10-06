export type Tier = "budget" | "mid" | "upper-mid" | "high" | "luxury";

export const TIERS: { id: Tier; label: string }[] = [
  { id: "budget", label: "Budget" },
  { id: "mid", label: "Mid-range" },
  { id: "upper-mid", label: "Upper mid-range" },
  { id: "high", label: "High-end" },
  { id: "luxury", label: "Luxury" },
];

export interface Material {
  name: string;
  element: string;
  /** 0..1 */
  confidence: number;
}

export interface Swatch {
  hex: string;
  name: string;
  role: "dominant" | "secondary" | "accent";
  /** Share of the image, 0..1 */
  share: number;
}

export interface Hardware {
  item: string;
  finish: string;
  /** 0..1 */
  confidence: number;
}

/** What an analyzer produces from a photo. */
export interface SpecContent {
  style: string;
  styleNotes: string;
  materials: Material[];
  palette: Swatch[];
  hardware: Hardware[];
  tier: Tier;
  tierRationale: string;
  source: "demo" | "claude";
}

export interface Spec extends SpecContent {
  id: string;
  userId: string;
  boardId: string;
  title: string;
  createdAt: string;
}

export interface Board {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
}
