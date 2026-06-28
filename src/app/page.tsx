"use client";

import { useState } from "react";
import { Uploader, type IngestedDoc } from "@/components/Uploader";
import { Chat } from "@/components/Chat";

export default function Home() {
  const [doc, setDoc] = useState<IngestedDoc | null>(null);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Ask Your Docs
        </h1>
        <p className="text-sm text-slate-400">
          Upload a document and ask questions. Answers are grounded in the
          source with citations. No hallucinations. Built with Next.js,
          Supabase pgvector, and Claude.
        </p>
      </header>

      {!doc ? (
        <Uploader onIngested={setDoc} />
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
          <Chat docId={doc.docId} />
        </section>
      )}

      <footer className="mt-auto pt-6 text-center text-xs text-slate-600">
        Retrieval-augmented generation demo · Next.js · Supabase · Claude
      </footer>
    </main>
  );
}
