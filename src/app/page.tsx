"use client";

import { useState } from "react";
import { Uploader, type IngestedDoc } from "@/components/Uploader";
import { Chat } from "@/components/Chat";
import { SAMPLE_DOC } from "@/lib/sample";

type LoadedDoc = IngestedDoc & { suggestions?: string[] };

export default function Home() {
  const [doc, setDoc] = useState<LoadedDoc | null>(null);

  function loadSample() {
    setDoc({
      docId: SAMPLE_DOC.docId,
      filename: SAMPLE_DOC.filename,
      chunks: SAMPLE_DOC.chunks,
      suggestions: SAMPLE_DOC.questions,
    });
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path d="M12 2 9.9 7.9 4 10l5.9 2.1L12 18l2.1-5.9L20 10l-5.9-2.1L12 2Z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Ask Your Docs
          </h1>
        </div>
        <p className="text-sm text-slate-400">
          Upload a document and ask questions. Answers are grounded in the
          source with citations. No hallucinations. Built with Next.js,
          Supabase pgvector, and Claude.
        </p>
      </header>

      {!doc ? (
        <Uploader onIngested={setDoc} onLoadSample={loadSample} />
      ) : (
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3">
            <div className="text-sm">
              <span className="font-medium text-slate-100">{doc.filename}</span>
              <span className="ml-2 text-slate-500">
                {doc.chunks} chunks indexed
              </span>
            </div>
            <button
              type="button"
              onClick={() => setDoc(null)}
              className="text-xs font-medium text-indigo-300 hover:underline"
            >
              New document
            </button>
          </div>
          <Chat docId={doc.docId} suggestions={doc.suggestions} />
        </section>
      )}

      <footer className="mt-auto pt-6 text-center text-xs text-slate-600">
        Retrieval-augmented generation demo · Next.js · Supabase · Claude
      </footer>
    </main>
  );
}
