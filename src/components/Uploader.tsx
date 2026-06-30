"use client";

import { useState } from "react";

export interface IngestedDoc {
  docId: string;
  filename: string;
  chunks: number;
}

export function Uploader({
  onIngested,
  onLoadSample,
}: {
  onIngested: (doc: IngestedDoc) => void;
  onLoadSample: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/ingest", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed.");
      onIngested(data as IngestedDoc);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full">
      <label
        className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-600 bg-slate-900/40 px-6 py-10 text-center transition hover:border-indigo-400 hover:bg-slate-900/70 ${
          busy ? "pointer-events-none opacity-60" : "cursor-pointer"
        }`}
      >
        <span className="text-3xl">📄</span>
        <span className="font-medium text-slate-100">
          {busy ? "Reading & indexing…" : "Upload a document"}
        </span>
        <span className="text-sm text-slate-400">PDF, TXT or Markdown</span>
        <input
          type="file"
          accept=".pdf,.txt,.md,text/plain,application/pdf"
          className="hidden"
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = "";
          }}
        />
      </label>
      <button
        type="button"
        onClick={onLoadSample}
        disabled={busy}
        className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-2.5 text-sm font-medium text-indigo-300 transition hover:border-indigo-400 hover:text-white disabled:opacity-50"
      >
        Or try it instantly with a sample document
      </button>
      {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}
    </div>
  );
}
