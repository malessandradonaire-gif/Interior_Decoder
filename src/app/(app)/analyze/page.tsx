"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/lib/auth";
import { analyzeImage } from "@/lib/analyzer";
import { createBoard, listBoards, saveSpec } from "@/lib/db";
import { fileToResizedDataUrl, MAX_UPLOAD_BYTES } from "@/lib/image";
import type { SpecContent } from "@/lib/types";
import { useLoader } from "@/lib/use-loader";
import { SpecView } from "@/components/SpecView";
import { btn, input, PageLoading, Spinner } from "@/components/ui";

const NEW_BOARD = "__new";
const STEPS = ["Reading surfaces", "Extracting the color palette", "Matching materials & finishes", "Estimating price tier"];

type Phase =
  | { kind: "idle" }
  | { kind: "analyzing"; image: string }
  | { kind: "done"; image: string; spec: SpecContent }
  | { kind: "error"; message: string };

function AnalyzingSteps() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 450);
    return () => clearInterval(t);
  }, []);
  return (
    <ul className="space-y-2 text-sm">
      {STEPS.map((label, i) => (
        <li key={label} className={`flex items-center gap-2 ${i <= step ? "text-ink" : "text-muted/60"}`}>
          {i < step ? <span className="w-4 text-emerald-600">✓</span> : i === step ? <Spinner /> : <span className="w-4">·</span>}
          {label}
        </li>
      ))}
    </ul>
  );
}

function Dropzone({ onFile }: { onFile: (file: File) => void }) {
  const [over, setOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const file = e.dataTransfer.files[0];
        if (file) onFile(file);
      }}
      className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-20 text-center transition ${
        over ? "border-accent bg-accent-soft/60" : "border-line bg-card hover:border-ink/30"
      }`}
    >
      <span className="font-serif text-2xl">Drop a photo of a space you love</span>
      <span className="mt-2 text-sm text-muted">or click to choose a file · JPG, PNG, WEBP up to 15 MB</span>
      <span className={`${btn.secondary} mt-6`}>Choose photo</span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          if (inputRef.current) inputRef.current.value = "";
        }}
      />
    </label>
  );
}

function AnalyzeFlow() {
  const user = useUser();
  const router = useRouter();
  const requestedBoard = useSearchParams().get("board");
  const { data: boards, loading } = useLoader(() => listBoards(user.id), [user.id]);

  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [title, setTitle] = useState("");
  const [boardChoice, setBoardChoice] = useState<string>("");
  const [newBoardName, setNewBoardName] = useState("");
  const [saving, setSaving] = useState(false);

  if (loading || !boards) return <PageLoading />;

  const selectedBoard =
    boardChoice ||
    (requestedBoard && boards.some((b) => b.id === requestedBoard) ? requestedBoard : boards[0]?.id) ||
    NEW_BOARD;

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setPhase({ kind: "error", message: "That file isn't an image. Try a JPG, PNG or WEBP." });
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setPhase({ kind: "error", message: "That photo is over 15 MB. Try a smaller one." });
      return;
    }
    try {
      const image = await fileToResizedDataUrl(file);
      setPhase({ kind: "analyzing", image });
      const spec = await analyzeImage(image);
      setTitle(spec.style);
      setPhase({ kind: "done", image, spec });
    } catch (err) {
      setPhase({ kind: "error", message: err instanceof Error ? err.message : "Could not analyze that photo." });
    }
  }

  async function handleSave() {
    if (phase.kind !== "done") return;
    setSaving(true);
    try {
      const boardId =
        selectedBoard === NEW_BOARD ? (await createBoard(user.id, newBoardName)).id : selectedBoard;
      await saveSpec(user.id, boardId, title, phase.spec, phase.image);
      router.push(`/boards/${boardId}`);
    } catch {
      setSaving(false);
      alert("Could not save the spec. Your browser storage may be full.");
    }
  }

  const canSave = selectedBoard !== NEW_BOARD || newBoardName.trim().length > 0;

  return (
    <div>
      <h1 className="font-serif text-3xl sm:text-4xl">Decode a photo</h1>
      <p className="mt-1 text-muted">Get the style, likely materials, palette, hardware and price tier of any space.</p>

      <div className="mt-8">
        {phase.kind === "idle" && <Dropzone onFile={handleFile} />}

        {phase.kind === "error" && (
          <div className="space-y-4">
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{phase.message}</p>
            <Dropzone onFile={handleFile} />
          </div>
        )}

        {phase.kind === "analyzing" && (
          <div className="grid items-center gap-8 rounded-2xl border border-line bg-card p-6 md:grid-cols-[1.2fr_1fr]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={phase.image} alt="Uploaded photo" className="max-h-[420px] w-full rounded-xl object-cover opacity-80" />
            <div>
              <p className="mb-4 font-serif text-2xl">Decoding…</p>
              <AnalyzingSteps />
            </div>
          </div>
        )}

        {phase.kind === "done" && (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 rounded-2xl border border-ink/10 bg-ink p-5 text-paper lg:flex-row lg:items-end">
              <label className="flex-1 text-sm">
                <span className="mb-1.5 block text-paper/70">Spec title</span>
                <input
                  className={`${input} border-transparent text-ink`}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </label>
              <label className="text-sm lg:w-56">
                <span className="mb-1.5 block text-paper/70">Save to board</span>
                <select
                  className={`${input} border-transparent text-ink`}
                  value={selectedBoard}
                  onChange={(e) => setBoardChoice(e.target.value)}
                >
                  {boards.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                  <option value={NEW_BOARD}>+ New board…</option>
                </select>
              </label>
              {selectedBoard === NEW_BOARD && (
                <label className="text-sm lg:w-48">
                  <span className="mb-1.5 block text-paper/70">New board name</span>
                  <input
                    className={`${input} border-transparent text-ink`}
                    value={newBoardName}
                    onChange={(e) => setNewBoardName(e.target.value)}
                    placeholder="e.g. Brickell"
                  />
                </label>
              )}
              <div className="flex gap-2">
                <button className={`${btn.ghost} text-paper/70 hover:text-paper`} onClick={() => setPhase({ kind: "idle" })}>
                  Discard
                </button>
                <button
                  className={`${btn.primary} bg-paper text-ink hover:bg-paper/90`}
                  disabled={!canSave || saving}
                  onClick={handleSave}
                >
                  {saving && <Spinner />}
                  Save spec
                </button>
              </div>
            </div>
            <SpecView spec={phase.spec} image={phase.image} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function AnalyzePage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <AnalyzeFlow />
    </Suspense>
  );
}
