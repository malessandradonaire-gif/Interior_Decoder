// Demo persistence: everything lives in the browser's IndexedDB, scoped per user.
// Swap this module for a Supabase-backed one later; the function signatures stay the same.
import { del, get, set, update } from "idb-keyval";
import type { Board, Spec, SpecContent } from "./types";

const boardsKey = (userId: string) => `boards:${userId}`;
const specsKey = (userId: string) => `specs:${userId}`;
const imageKey = (specId: string) => `image:${specId}`;

export async function listBoards(userId: string): Promise<Board[]> {
  const boards = (await get<Board[]>(boardsKey(userId))) ?? [];
  return [...boards].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getBoard(userId: string, boardId: string): Promise<Board | undefined> {
  return (await listBoards(userId)).find((b) => b.id === boardId);
}

export async function createBoard(userId: string, name: string): Promise<Board> {
  const board: Board = {
    id: crypto.randomUUID(),
    userId,
    name: name.trim(),
    createdAt: new Date().toISOString(),
  };
  await update<Board[]>(boardsKey(userId), (boards = []) => [...boards, board]);
  return board;
}

export async function deleteBoard(userId: string, boardId: string): Promise<void> {
  const specs = await listSpecs(userId, boardId);
  await Promise.all(specs.map((s) => del(imageKey(s.id))));
  await update<Spec[]>(specsKey(userId), (all = []) => all.filter((s) => s.boardId !== boardId));
  await update<Board[]>(boardsKey(userId), (boards = []) => boards.filter((b) => b.id !== boardId));
}

export async function listSpecs(userId: string, boardId?: string): Promise<Spec[]> {
  const specs = (await get<Spec[]>(specsKey(userId))) ?? [];
  return specs
    .filter((s) => !boardId || s.boardId === boardId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getSpec(userId: string, specId: string): Promise<Spec | undefined> {
  return (await listSpecs(userId)).find((s) => s.id === specId);
}

export async function saveSpec(
  userId: string,
  boardId: string,
  title: string,
  content: SpecContent,
  imageDataUrl: string,
): Promise<Spec> {
  const spec: Spec = {
    ...content,
    id: crypto.randomUUID(),
    userId,
    boardId,
    title: title.trim() || content.style,
    createdAt: new Date().toISOString(),
  };
  await set(imageKey(spec.id), imageDataUrl);
  await update<Spec[]>(specsKey(userId), (specs = []) => [...specs, spec]);
  return spec;
}

export async function deleteSpec(userId: string, specId: string): Promise<void> {
  await del(imageKey(specId));
  await update<Spec[]>(specsKey(userId), (specs = []) => specs.filter((s) => s.id !== specId));
}

export async function getImage(specId: string): Promise<string | undefined> {
  return get<string>(imageKey(specId));
}
