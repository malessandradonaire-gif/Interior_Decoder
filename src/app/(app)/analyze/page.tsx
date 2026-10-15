"use client";

import { Suspense, useEffect, useEffectEvent, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/lib/auth";
import { analyzeImage } from "@/lib/analyzer";
import { createBoard, listBoards, saveSpec } from "@/lib/db";
import { fileToResizedDataUrl, MAX_UPLOAD_BYTES } from "@/lib/image";
import { fileFromImageUrl, ImageSourceError, imageFileFrom, imageUrlFrom } from "@/lib/image-source";
import type { SpecContent } from "@/lib/types";
import { useLoader } from "@/lib/use-loader";
import { SpecView } from "@/components/SpecView";
import { btn, input, PageLoading, Spinner } from "@/components/ui";

const NEW_BOARD = "__new";
const STEPS = ["Reading surfaces", "Extracting the color palette", "Matching materials & finishes", "Estimating price tier"];

type Phase =
  | { kind: "idle" }
  | { kind: "fetching" }
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

function Dropzone({ onFile, onTransfer }: { onFile: (file: File) => void; onTransfer: (data: DataTransfer) => void }) {
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
        onTransfer(e.dataTransfer);
      }}
      className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-20 text-center transition ${
        over ? "border-accent bg-accent-soft/60" : "border-line bg-card hover:border-ink/30"
      }`}
    >
      <span className="font-serif text-2xl">Drop a photo of a space you love</span>
      <span className="mt-2 max-w-md text-sm text-muted">
        From your computer, or drag a picture straight from Pinterest or another tab. You can also paste a copied image
        with <kbd className="rounded border border-line bg-paper px-1.5 py-0.5 font-mono text-xs">Ctrl</kbd>+
        <kbd className="rounded border border-line bg-paper px-1.5 py-0.5 font-mono text-xs">V</kbd> (⌘V on Mac).
      </span>
      <span className="mt-1 text-xs text-muted/80">JPG, PNG, WEBP up to 15 MB</span>
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

  const acceptsImage = phase.kind === "idle" || phase.kind === "error";
  const onPaste = useEffectEvent((e: ClipboardEvent) => {
    e.preventDefault();
    handleTransfer(e.clipboardData, "paste");
  });
  useEffect(() => {
    if (!acceptsImage) return;
    const listener = (e: ClipboardEvent) => onPaste(e);
    window.addEventListener("paste", listener);
    return () => window.removeEventListener("paste", listener);
  }, [acceptsImage]);

  async function handleTransfer(data: DataTransfer | null, source: "paste" | "drop") {
    const file = imageFileFrom(data);
    if (file) return handleFile(file);
    const url = imageUrlFrom(data);
    if (!url) {
      setPhase({
        kind: "error",
        message:
          source === "paste"
            ? "There's no image on your clipboard. Right-click a picture, choose “Copy image”, then paste here."
            : "That didn't contain an image. Try dragging the picture itself.",
      });
      return;
    }
    setPhase({ kind: "fetching" });
    try {
      await handleFile(await fileFromImageUrl(url));
    } catch (err) {
      setPhase({
        kind: "error",
        message: err instanceof ImageSourceError ? err.message : "Couldn't get that image. Try saving it and uploading.",
      });
    }
  }

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

  if (loading || !boards) return <PageLoading />;

  const selectedBoard =
    boardChoice ||
    (requestedBoard && boards.some((b) => b.id === requestedBoard) ? requestedBoard : boards[0]?.id) ||
    NEW_BOARD;
  const canSave = selectedBoard !== NEW_BOARD || newBoardName.trim().length > 0;
  const dropzone = <Dropzone onFile={handleFile} onTransfer={(data) => handleTransfer(data, "drop")} />;

  return (
    <div>
      <h1 className="font-serif text-3xl sm:text-4xl">Decode a photo</h1>
      <p className="mt-1 text-muted">Get the style, likely materials, palette, hardware and price tier of any space.</p>

      <div className="mt-8">
        {phase.kind === "idle" && dropzone}

        {phase.kind === "fetching" && (
          <div className="flex items-center justify-center gap-3 rounded-2xl border border-line bg-card px-6 py-24 text-muted">
            <Spinner /> Getting the image…
          </div>
        )}

        {phase.kind === "error" && (
          <div className="space-y-4">
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {phase.message}
            </p>
            {dropzone}
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
