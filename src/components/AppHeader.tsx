"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUser, useAuth } from "@/lib/auth";
import { btn } from "./ui";

export function AppHeader() {
  const user = useUser();
  const { signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const navLink = (href: string, label: string) => {
    const active = pathname === href || (href === "/boards" && pathname.startsWith("/boards"));
    return (
      <Link
        href={href}
        className={`rounded-full px-3 py-1.5 text-sm transition ${active ? "bg-ink/5 text-ink" : "text-muted hover:text-ink"}`}
      >
        {label}
      </Link>
    );
  };

  return (
    <header className="border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
        <Link href="/boards" className="font-serif text-lg tracking-tight">
          Inspiration Decoder
        </Link>
        <nav className="flex items-center gap-1">
          {navLink("/boards", "Boards")}
          {navLink("/analyze", "Decode a photo")}
        </nav>
        <div className="ml-auto flex items-center gap-2 text-sm">
          <span className="hidden text-muted sm:inline">{user.name}</span>
          <button
            className={btn.ghost}
            onClick={() => {
              signOut();
              router.replace("/login");
            }}
          >
            Sign out
          </button>
        </div>
      </div>
      <div className="border-t border-line bg-accent-soft/60 px-4 py-1.5 text-center text-xs text-accent">
        Demo mode — analysis runs locally in your browser with simulated results. No AI API is called.
      </div>
    </header>
  );
}
