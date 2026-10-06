// The app talks to analyzers through `analyzeImage`. v1 ships the local demo analyzer;
// a Claude vision analyzer (POST /api/analyze) can replace it without UI changes.
import type { SpecContent } from "../types";
import { analyzeDemo } from "./demo";

export async function analyzeImage(imageDataUrl: string): Promise<SpecContent> {
  return analyzeDemo(imageDataUrl);
}
