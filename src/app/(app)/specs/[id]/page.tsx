"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@/lib/auth";
import { deleteSpec, getBoard, getImage, getSpec } from "@/lib/db";
import { useLoader } from "@/lib/use-loader";
import { SpecView } from "@/components/SpecView";
import { btn, EmptyState, PageLoading } from "@/components/ui";

export default function SpecPage() {
  const { id } = useParams<{ id: string }>();
  const user = useUser();
  const router = useRouter();
  const { data, loading } = useLoader(async () => {
    const spec = await getSpec(user.id, id);
    if (!spec) return { spec };
    const [board, image] = await Promise.all([getBoard(user.id, spec.boardId), getImage(spec.id)]);
    return { spec, board, image };
  }, [user.id, id]);

  if (loading || !data) return <PageLoading />;
  if (!data.spec) {
    return (
      <EmptyState title="Spec not found">
        <Link href="/boards" className="underline">
          Back to boards
        </Link>
      </EmptyState>
    );
  }

  const { spec, board, image } = data;

  return (
    <div>
      <Link href={board ? `/boards/${board.id}` : "/boards"} className="text-sm text-muted hover:text-ink">
        ← {board?.name ?? "Boards"}
      </Link>
      <div className="mt-2 mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl">{spec.title}</h1>
          <p className="mt-1 text-sm text-muted">
            Saved {new Date(spec.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
            {spec.source === "demo" && " · demo analysis"}
          </p>
        </div>
        <button
          className={btn.danger}
          onClick={async () => {
            if (!confirm("Delete this spec?")) return;
            await deleteSpec(user.id, spec.id);
            router.replace(board ? `/boards/${board.id}` : "/boards");
          }}
        >
          Delete spec
        </button>
      </div>
      <SpecView spec={spec} image={image} />
    </div>
  );
}
