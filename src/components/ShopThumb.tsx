import type { ShopCategory } from "@/lib/shopping";

/** Small illustrated product thumbnail, tinted with the item's finish. */
export function ShopThumb({ category, tint }: { category: ShopCategory; tint: string }) {
  const stroke = "#1f1c18";
  const common = { fill: tint, stroke, strokeWidth: 1.5, strokeLinejoin: "round" as const };

  const shapes: Record<ShopCategory, React.ReactNode> = {
    pull: (
      <>
        <rect x="8" y="27" width="48" height="7" rx="3.5" {...common} />
        <rect x="14" y="34" width="5" height="8" {...common} />
        <rect x="45" y="34" width="5" height="8" {...common} />
      </>
    ),
    knob: (
      <>
        <rect x="27" y="36" width="10" height="10" {...common} />
        <circle cx="32" cy="28" r="12" {...common} />
      </>
    ),
    faucet: (
      <>
        <path d="M20 54 V22 a12 12 0 0 1 24 0 v8" fill="none" stroke={tint} strokeWidth="6" strokeLinecap="round" />
        <path d="M20 54 V22 a12 12 0 0 1 24 0 v8" fill="none" stroke={stroke} strokeWidth="1" strokeLinecap="round" opacity="0.35" />
        <rect x="12" y="52" width="16" height="5" rx="2" {...common} />
        <rect x="28" y="30" width="12" height="4" rx="2" {...common} transform="rotate(-25 34 32)" />
      </>
    ),
    pendant: (
      <>
        <line x1="32" y1="4" x2="32" y2="22" stroke={stroke} strokeWidth="1.5" />
        <rect x="29" y="20" width="6" height="5" {...common} />
        <path d="M12 46 a20 20 0 0 1 40 0 Z" {...common} />
        <ellipse cx="32" cy="49" rx="6" ry="2.5" fill="#FFE9A8" />
      </>
    ),
    sink: (
      <>
        <rect x="8" y="22" width="48" height="26" rx="4" {...common} />
        <rect x="14" y="27" width="36" height="16" rx="3" fill="#ffffff" fillOpacity="0.55" stroke={stroke} strokeWidth="1" />
        <circle cx="32" cy="38" r="2" fill={stroke} />
      </>
    ),
    tile: (
      <>
        {[0, 1, 2].map((row) =>
          [0, 1].map((col) => (
            <rect key={`${row}-${col}`} x={8 + col * 25} y={14 + row * 12} width="23" height="10" rx="1.5" {...common} />
          )),
        )}
      </>
    ),
    stone: (
      <>
        <rect x="8" y="14" width="48" height="36" rx="3" {...common} />
        <path d="M12 22 C 22 26, 26 34, 40 36 S 52 44, 54 46" fill="none" stroke="#8d8a85" strokeWidth="1.2" />
        <path d="M24 14 C 26 20, 34 22, 36 30" fill="none" stroke="#8d8a85" strokeWidth="0.9" />
      </>
    ),
    wood: (
      <>
        <rect x="8" y="18" width="48" height="28" rx="2" {...common} />
        <path d="M8 26 C 22 23, 34 30, 56 26 M8 34 C 20 31, 38 38, 56 34 M8 41 C 24 39, 36 44, 56 41" fill="none" stroke={stroke} strokeOpacity="0.35" strokeWidth="1" />
      </>
    ),
    stool: (
      <>
        <ellipse cx="32" cy="16" rx="16" ry="5" {...common} />
        <line x1="20" y1="19" x2="16" y2="56" stroke={stroke} strokeWidth="2.5" />
        <line x1="44" y1="19" x2="48" y2="56" stroke={stroke} strokeWidth="2.5" />
        <line x1="18" y1="42" x2="46" y2="42" stroke={stroke} strokeWidth="1.5" />
      </>
    ),
    shelf: (
      <>
        <rect x="8" y="20" width="48" height="5" {...common} />
        <rect x="8" y="40" width="48" height="5" {...common} />
        <rect x="14" y="10" width="7" height="10" fill="#d9d2c6" stroke={stroke} strokeWidth="1" />
        <rect x="40" y="30" width="9" height="10" rx="4" fill="#d9d2c6" stroke={stroke} strokeWidth="1" />
      </>
    ),
    paint: (
      <>
        <rect x="16" y="20" width="32" height="34" rx="3" {...common} />
        <ellipse cx="32" cy="20" rx="16" ry="4" {...common} />
        <path d="M18 18 Q32 4 46 18" fill="none" stroke={stroke} strokeWidth="1.5" />
      </>
    ),
  };

  return (
    <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden>
      {shapes[category]}
    </svg>
  );
}
