"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@/lib/auth";
import { deleteBoard, getBoard, listSpecs } from "@/lib/db";
import { useLoader } from "@/lib/use-loader";
import { SpecTile } from "@/components/SpecTile";
import { btn, EmptyState, PageLoading } from "@/components/ui";

export default function BoardPage() {
  const { id } = useParams<{ id: string }>();
  const user = useUser();
  const router = useRouter();
  const { data, loading } = useLoader(
    async () => ({ board: await getBoard(user.id, id), specs: await listSpecs(user.id, id) }),
    [user.id, id],
  );

  if (loading || !data) return <PageLoading />;
  if (!data.board) {
    return (
      <EmptyState title="Board not found">
        <Link href="/boards" className="underline">
          Back to boards
        </Link>
      </EmptyState>
    );
  }

  const { board, specs } = data;

  return (
    <div>
      <Link href="/boards" className="text-sm text-muted hover:text-ink">
        ← Boards
      </Link>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl">{board.name}</h1>
          <p className="mt-1 text-muted">
            {specs.length} {specs.length === 1 ? "spec" : "specs"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className={btn.danger}
            onClick={async () => {
              if (!confirm(`Delete "${board.name}" and all its specs?`)) return;
              await deleteBoard(user.id, board.id);
              router.replace("/boards");
            }}
          >
            Delete board
          </button>
          <Link href={`/analyze?board=${board.id}`} className={btn.primary}>
            Decode a photo
          </Link>
        </div>
      </div>

      <div className="mt-8">
        {specs.length === 0 ? (
          <EmptyState title="No specs in this board yet">
            Upload a photo of a space you love and save its spec here.
          </EmptyState>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {specs.map((s) => (
              <SpecTile key={s.id} spec={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
