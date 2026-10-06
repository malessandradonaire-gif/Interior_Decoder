"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { btn, input } from "@/components/ui";

export default function LoginPage() {
  const { user, ready, signIn } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (ready && user) router.replace("/boards");
  }, [ready, user, router]);

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Inspiration Decoder</p>
        <h1 className="mt-3 font-serif text-4xl leading-tight">
          Turn the rooms you love into specs you can build.
        </h1>
        <p className="mt-3 text-muted">
          Upload a photo of an inspiring space and get its style, likely materials, color palette, hardware and price
          tier — saved to project boards.
        </p>

        <form
          className="mt-8 space-y-3 rounded-2xl border border-line bg-card p-6"
          onSubmit={(e) => {
            e.preventDefault();
            signIn(name, email);
            router.replace("/boards");
          }}
        >
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Name</span>
            <input className={input} required value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Rivera" />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Email</span>
            <input
              className={input}
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@studio.com"
            />
          </label>
          <button className={`${btn.primary} mt-2 w-full`} type="submit">
            Sign in
          </button>
          <p className="pt-1 text-center text-xs text-muted">
            Demo sign-in: no password needed. Your boards are stored in this browser only.
          </p>
        </form>
      </div>
    </main>
  );
}
