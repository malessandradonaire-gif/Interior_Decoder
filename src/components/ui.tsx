const base =
  "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50";

export const btn = {
  primary: `${base} bg-ink text-paper hover:bg-ink/85`,
  secondary: `${base} border border-line bg-card text-ink hover:border-ink/40`,
  ghost: `${base} px-3 text-muted hover:text-ink`,
  danger: `${base} px-3 text-red-700 hover:bg-red-50`,
};

export const input =
  "w-full rounded-xl border border-line bg-card px-4 py-2.5 text-sm outline-none transition placeholder:text-muted/70 focus:border-ink/50 focus:ring-2 focus:ring-ink/10";

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent ${className}`}
    />
  );
}

export function PageLoading() {
  return (
    <div className="flex flex-1 items-center justify-center py-24 text-muted">
      <Spinner />
      <span className="sr-only">Loading</span>
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-card/60 px-6 py-14 text-center">
      <p className="font-serif text-xl">{title}</p>
      {children && <div className="mt-2 text-sm text-muted">{children}</div>}
    </div>
  );
}
