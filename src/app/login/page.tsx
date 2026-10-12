"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { MIN_PASSWORD_LENGTH } from "@/lib/accounts";
import { btn, input, Spinner } from "@/components/ui";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const { user, ready, signIn, signUp } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && user) router.replace("/boards");
  }, [ready, user, router]);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setPassword("");
    setConfirm("");
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (mode === "signup" && password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setBusy(true);
    const result = mode === "signup" ? await signUp(name, email, password) : await signIn(email, password);
    if (result.ok) {
      router.replace("/boards");
    } else {
      setError(result.error);
      setBusy(false);
    }
  }

  const tab = (value: Mode, label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={mode === value}
      onClick={() => switchMode(value)}
      className={`flex-1 rounded-full py-2 text-sm font-medium transition ${
        mode === value ? "bg-ink text-paper" : "text-muted hover:text-ink"
      }`}
    >
      {label}
    </button>
  );

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

        <form className="mt-8 space-y-3 rounded-2xl border border-line bg-card p-6" onSubmit={handleSubmit}>
          <div role="tablist" className="mb-2 flex gap-1 rounded-full border border-line p-1">
            {tab("signin", "Sign in")}
            {tab("signup", "Create account")}
          </div>

          {mode === "signup" && (
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium">Name</span>
              <input
                className={input}
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Rivera"
              />
            </label>
          )}
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Email</span>
            <input
              className={input}
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@studio.com"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Password</span>
            <input
              className={input}
              type="password"
              required
              minLength={mode === "signup" ? MIN_PASSWORD_LENGTH : undefined}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {mode === "signup" && (
              <span className="mt-1 block text-xs text-muted">At least {MIN_PASSWORD_LENGTH} characters.</span>
            )}
          </label>
          {mode === "signup" && (
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium">Confirm password</span>
              <input
                className={input}
                type="password"
                required
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </label>
          )}

          {error && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          )}

          <button className={`${btn.primary} mt-2 w-full`} type="submit" disabled={busy}>
            {busy && <Spinner />}
            {mode === "signup" ? "Create account" : "Sign in"}
          </button>
          <p className="pt-1 text-center text-xs text-muted">
            Demo version: your account and boards are stored in this browser only.
          </p>
        </form>
      </div>
    </main>
  );
}
