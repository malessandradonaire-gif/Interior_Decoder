"use client";

import { useRef } from "react";
import { shoppingList } from "@/lib/shopping";
import type { SpecContent } from "@/lib/types";
import { ShopThumb } from "./ShopThumb";

export function WhereToBuy({ spec }: { spec: SpecContent }) {
  const items = shoppingList(spec);
  const track = useRef<HTMLDivElement>(null);

  if (items.length === 0) return null;

  const scrollBy = (direction: 1 | -1) => {
    const el = track.current;
    if (el) el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  };

  const arrow = (direction: 1 | -1, label: string) => (
    <button
      type="button"
      aria-label={label}
      onClick={() => scrollBy(direction)}
      className="flex size-8 items-center justify-center rounded-full border border-line bg-card text-sm transition hover:border-ink/40"
    >
      {direction === 1 ? "→" : "←"}
    </button>
  );

  return (
    <section className="rounded-2xl border border-line bg-card p-5" aria-label="Where to buy">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Where to buy</h3>
          <p className="mt-1 text-xs text-muted">Search Amazon for each piece of the look. Opens in a new tab.</p>
        </div>
        <div className="flex shrink-0 gap-2">
          {arrow(-1, "Scroll left")}
          {arrow(1, "Scroll right")}
        </div>
      </div>

      <div
        ref={track}
        className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-1 pb-2 [scrollbar-width:thin]"
      >
        {items.map((item) => (
          <a
            key={item.url}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group w-40 shrink-0 snap-start overflow-hidden rounded-xl border border-line bg-paper transition hover:-translate-y-0.5 hover:border-ink/30"
          >
            <div className="aspect-square bg-card p-5 transition group-hover:bg-accent-soft/50">
              <ShopThumb category={item.category} tint={item.tint} />
            </div>
            <div className="border-t border-line p-3">
              <p className="line-clamp-2 text-sm font-medium leading-snug">{item.name}</p>
              <p className="mt-0.5 truncate text-xs text-muted">{item.detail}</p>
              <p className="mt-2 text-xs font-medium text-accent">View on Amazon ↗</p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
