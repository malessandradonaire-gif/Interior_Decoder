"use client";

import Link from "next/link";
import { getImage } from "@/lib/db";
import { TIERS, type Spec } from "@/lib/types";
import { useLoader } from "@/lib/use-loader";

export function SpecTile({ spec }: { spec: Spec }) {
  const { data: image } = useLoader(() => getImage(spec.id), [spec.id]);
  const tier = TIERS.find((t) => t.id === spec.tier)?.label;

  return (
    <Link
      href={`/specs/${spec.id}`}
      className="group overflow-hidden rounded-2xl border border-line bg-card transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-ink/5"
    >
      <div className="aspect-[4/3] overflow-hidden bg-line/50">
        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
        )}
      </div>
      <div className="flex h-2">
        {spec.palette.map((s) => (
          <span key={s.hex + s.name} style={{ backgroundColor: s.hex, flexGrow: s.share }} />
        ))}
      </div>
      <div className="p-4">
        <p className="truncate font-medium">{spec.title}</p>
        <p className="mt-0.5 truncate text-sm text-muted">
          {spec.style} · {tier}
        </p>
      </div>
    </Link>
  );
}
