"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/auth";
import { createBoard, getImage, listBoards, listSpecs } from "@/lib/db";
import type { Board, Spec } from "@/lib/types";
import { useLoader } from "@/lib/use-loader";
import { btn, EmptyState, input, PageLoading } from "@/components/ui";

function BoardCard({ board, specs }: { board: Board; specs: Spec[] }) {
  const coverId = specs[0]?.id;
  const { data: cover } = useLoader(async () => (coverId ? getImage(coverId) : undefined), [coverId]);

  return (
    <Link
      href={`/boards/${board.id}`}
      className="group overflow-hidden rounded-2xl border border-line bg-card transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-ink/5"
    >
      <div className="aspect-[16/10] overflow-hidden bg-accent-soft/70">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
        ) : (
          <div className="flex h-full items-center justify-center font-serif text-4xl text-accent/40">
            {board.name.slice(0, 1).toUpperCase()}
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="font-serif text-xl">{board.name}</p>
        <p className="mt-0.5 text-sm text-muted">
          {specs.length} {specs.length === 1 ? "spec" : "specs"}
        </p>
      </div>
    </Link>
  );
}

export default function BoardsPage() {
  const user = useUser();
  const router = useRouter();
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const { data, loading } = useLoader(
    async () => ({ boards: await listBoards(user.id), specs: await listSpecs(user.id) }),
    [user.id],
  );

  if (loading || !data) return <PageLoading />;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl">Your boards</h1>
          <p className="mt-1 text-muted">One board per project. Decoded photos are saved into them.</p>
        </div>
        <form
          className="flex w-full gap-2 sm:w-auto"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!name.trim()) return;
            setCreating(true);
            const board = await createBoard(user.id, name);
            router.push(`/boards/${board.id}`);
          }}
        >
          <input
            className={`${input} sm:w-64`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New board, e.g. Brickell"
            aria-label="New board name"
          />
          <button className={btn.primary} disabled={!name.trim() || creating} type="submit">
            Create
          </button>
        </form>
      </div>

      <div className="mt-8">
        {data.boards.length === 0 ? (
          <EmptyState title="No boards yet">Create your first board above — name it after the project.</EmptyState>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.boards.map((b) => (
              <BoardCard key={b.id} board={b} specs={data.specs.filter((s) => s.boardId === b.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
