"use client";

import { useState } from "react";
import { TIERS, type SpecContent, type Swatch } from "@/lib/types";
import { WhereToBuy } from "./WhereToBuy";

export function confidenceLabel(value: number) {
  if (value >= 0.75) return { label: "High", bar: "bg-emerald-600", text: "text-emerald-700" };
  if (value >= 0.5) return { label: "Medium", bar: "bg-amber-500", text: "text-amber-700" };
  return { label: "Low", bar: "bg-stone-400", text: "text-stone-500" };
}

function ConfidenceBar({ value }: { value: number }) {
  const c = confidenceLabel(value);
  return (
    <div className="flex items-center gap-3">
      <div
        className="h-1.5 w-24 overflow-hidden rounded-full bg-line"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value * 100)}
        aria-label="Confidence"
      >
        <div className={`h-full rounded-full ${c.bar}`} style={{ width: `${value * 100}%` }} />
      </div>
      <span className={`w-24 text-xs tabular-nums ${c.text}`}>
        {c.label} · {Math.round(value * 100)}%
      </span>
    </div>
  );
}

export function TierMeter({ tier }: { tier: SpecContent["tier"] }) {
  const index = TIERS.findIndex((t) => t.id === tier);
  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1" aria-hidden>
        {TIERS.map((t, i) => (
          <span key={t.id} className={`h-2 w-6 rounded-full ${i <= index ? "bg-accent" : "bg-line"}`} />
        ))}
      </div>
      <span className="text-sm font-medium">{TIERS[index]?.label}</span>
    </div>
  );
}

function SwatchChip({ swatch }: { swatch: Swatch }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      title="Copy hex"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(swatch.hex);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        } catch {
          // Clipboard unavailable; nothing to do.
        }
      }}
      className="group flex flex-col overflow-hidden rounded-xl border border-line bg-card text-left transition hover:border-ink/30"
    >
      <span className="h-16 w-full" style={{ backgroundColor: swatch.hex }} />
      <span className="px-2.5 py-2">
        <span className="block font-mono text-xs">{copied ? "Copied!" : swatch.hex}</span>
        <span className="block truncate text-xs text-muted">{swatch.name}</span>
        <span className="block text-[11px] capitalize text-muted/80">
          {swatch.role} · {Math.round(swatch.share * 100)}%
        </span>
      </span>
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-card p-5">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted">{title}</h3>
      {children}
    </section>
  );
}

export function SpecView({ spec, image }: { spec: SpecContent; image?: string }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr]">
        <div className="overflow-hidden rounded-2xl border border-line bg-card">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="Inspiration photo" className="h-full max-h-[520px] w-full object-cover" />
          ) : (
            <div className="aspect-[4/3] animate-pulse bg-line/50" />
          )}
        </div>

        <div className="space-y-5">
          <Section title="Style">
            <p className="font-serif text-2xl leading-tight">{spec.style}</p>
            <p className="mt-3 text-sm leading-relaxed text-muted">{spec.styleNotes}</p>
          </Section>
          <Section title="Price tier">
            <TierMeter tier={spec.tier} />
            <p className="mt-3 text-sm leading-relaxed text-muted">{spec.tierRationale}</p>
          </Section>
        </div>
      </div>

      <Section title="Color palette">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
          {spec.palette.map((s) => (
            <SwatchChip key={s.hex + s.name} swatch={s} />
          ))}
        </div>
      </Section>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Section title={`Materials (${spec.materials.length})`}>
          <ul className="divide-y divide-line">
            {spec.materials.map((m) => (
              <li key={m.name} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{m.name}</p>
                  <p className="text-xs text-muted">{m.element}</p>
                </div>
                <ConfidenceBar value={m.confidence} />
              </li>
            ))}
          </ul>
        </Section>
        <Section title="Hardware & fixtures">
          <ul className="divide-y divide-line">
            {spec.hardware.map((h) => (
              <li key={h.item} className="space-y-1.5 py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium">{h.item}</p>
                  <p className="text-xs text-muted">{h.finish}</p>
                </div>
                <ConfidenceBar value={h.confidence} />
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <WhereToBuy spec={spec} />
    </div>
  );
}
