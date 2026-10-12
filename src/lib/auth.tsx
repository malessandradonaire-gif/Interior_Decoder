"use client";

// Demo auth: accounts with hashed passwords live in IndexedDB (see ./accounts); the signed-in
// session is kept in localStorage. Replace with Supabase Auth later; components only use useAuth()/useUser().
import { createContext, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import type { User } from "./types";
import { registerAccount, verifyAccount, type AuthResult } from "./accounts";
import { PageLoading } from "@/components/ui";

const SESSION_KEY = "decoder.session";
// Sessions from the password-less demo had no version and are treated as signed out.
const SESSION_VERSION = 2;
const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  const onStorage = (e: StorageEvent) => {
    if (e.key === SESSION_KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function readSession(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

function writeSession(value: string | null) {
  try {
    if (value === null) localStorage.removeItem(SESSION_KEY);
    else localStorage.setItem(SESSION_KEY, value);
  } catch {
    // Storage blocked (private mode); the session just won't persist.
  }
  listeners.forEach((l) => l());
}

function startSession(result: AuthResult): AuthResult {
  if (result.ok) writeSession(JSON.stringify({ ...result.user, v: SESSION_VERSION }));
  return result;
}

interface AuthState {
  user: User | null;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (name: string, email: string, password: string) => Promise<AuthResult>;
  signOut: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // undefined on the server / first render means "not known yet".
  const raw = useSyncExternalStore<string | null | undefined>(subscribe, readSession, () => undefined);

  const value = useMemo<AuthState>(() => {
    let user: User | null = null;
    if (raw) {
      try {
        const session = JSON.parse(raw) as User & { v?: number };
        if (session.v === SESSION_VERSION) user = { id: session.id, email: session.email, name: session.name };
      } catch {
        user = null;
      }
    }
    return {
      user,
      ready: raw !== undefined,
      signIn: async (email, password) => startSession(await verifyAccount(email, password)),
      signUp: async (name, email, password) => startSession(await registerAccount(name, email, password)),
      signOut: () => writeSession(null),
    };
  }, [raw]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

/** For components rendered inside <RequireAuth>. */
export function useUser(): User {
  const { user } = useAuth();
  if (!user) throw new Error("useUser called without a signed-in user");
  return user;
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  if (!ready || !user) return <PageLoading />;
  return <>{children}</>;
}
