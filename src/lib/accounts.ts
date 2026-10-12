// Demo accounts: stored in this browser's IndexedDB with PBKDF2-hashed passwords.
// There is no server, so this protects against casual access only; Supabase Auth replaces it later.
import { get, update } from "idb-keyval";
import type { User } from "./types";

interface Account {
  name: string;
  email: string;
  salt: string;
  hash: string;
  createdAt: string;
}

const ACCOUNTS_KEY = "accounts";
const ITERATIONS = 210_000;
export const MIN_PASSWORD_LENGTH = 8;

const toB64 = (bytes: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)));
const fromB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

async function hashPassword(password: string, salt: Uint8Array): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations: ITERATIONS },
    key,
    256,
  );
  return toB64(bits);
}

function sameHash(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const toUser = (a: Account): User => ({ id: a.email, email: a.email, name: a.name });

export type AuthResult = { ok: true; user: User } | { ok: false; error: string };

export async function registerAccount(name: string, email: string, password: string): Promise<AuthResult> {
  const normalized = normalizeEmail(email);
  if (!name.trim()) return { ok: false, error: "Add your name." };
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, error: `Use at least ${MIN_PASSWORD_LENGTH} characters for your password.` };
  }
  const accounts = (await get<Record<string, Account>>(ACCOUNTS_KEY)) ?? {};
  if (accounts[normalized]) return { ok: false, error: "An account with this email already exists. Sign in instead." };

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const account: Account = {
    name: name.trim(),
    email: normalized,
    salt: toB64(salt),
    hash: await hashPassword(password, salt),
    createdAt: new Date().toISOString(),
  };
  await update<Record<string, Account>>(ACCOUNTS_KEY, (all = {}) => ({ ...all, [normalized]: account }));
  return { ok: true, user: toUser(account) };
}

export async function verifyAccount(email: string, password: string): Promise<AuthResult> {
  const accounts = (await get<Record<string, Account>>(ACCOUNTS_KEY)) ?? {};
  const account = accounts[normalizeEmail(email)];
  // Same message either way so the form doesn't reveal which emails have accounts.
  const failure: AuthResult = { ok: false, error: "Email or password is incorrect." };
  if (!account) return failure;
  const hash = await hashPassword(password, fromB64(account.salt));
  return sameHash(hash, account.hash) ? { ok: true, user: toUser(account) } : failure;
}
