"use client";

import { useRef, useState } from "react";

interface Source {
  index: number;
  content: string;
  similarity: number;
}

interface Turn {
  question: string;
  answer: string;
  sources: Source[];
}

export function Chat({ docId }: { docId: string }) {
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openSources, setOpenSources] = useState<number | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q || busy) return;

    setBusy(true);
    setError(null);
    setQuestion("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docId, question: q }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed.");
      setTurns((prev) => [
        ...prev,
        { question: q, answer: data.answer, sources: data.sources ?? [] },
      ]);
      requestAnimationFrame(() =>
        endRef.current?.scrollIntoView({ behavior: "smooth" }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4">
        {turns.length === 0 && (
          <p className="text-sm text-slate-400">
            Ask anything about the document. Answers come only from the source,
            with citations.
          </p>
        )}

        {turns.map((turn, i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="self-end rounded-2xl rounded-br-sm bg-indigo-600 px-4 py-2 text-sm text-white">
              {turn.question}
            </div>
            <div className="self-start rounded-2xl rounded-bl-sm bg-slate-800 px-4 py-3 text-sm leading-relaxed text-slate-100">
              <p className="whitespace-pre-wrap">{turn.answer}</p>
              {turn.sources.length > 0 && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenSources((cur) => (cur === i ? null : i))
                    }
                    className="text-xs font-medium text-indigo-300 hover:underline"
                  >
                    {openSources === i ? "Hide sources" : `Sources (${turn.sources.length})`}
                  </button>
                  {openSources === i && (
                    <ul className="mt-2 flex flex-col gap-2">
                      {turn.sources.map((s) => (
                        <li
                          key={s.index}
                          className="rounded-lg bg-slate-900/70 px-3 py-2 text-xs text-slate-300"
                        >
                          <span className="mr-1 font-semibold text-indigo-300">
                            [{s.index}]
                          </span>
                          <span className="text-slate-500">
                            {(s.similarity * 100).toFixed(0)}% match
                          </span>
                          <p className="mt-1 text-slate-300">{s.content}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {busy && (
          <div className="self-start rounded-2xl rounded-bl-sm bg-slate-800 px-4 py-3 text-sm text-slate-400">
            Thinking…
          </div>
        )}
        <div ref={endRef} />
      </div>

      {error && <p className="text-sm text-rose-400">{error}</p>}

      <form onSubmit={ask} className="flex gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question about the document…"
          className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-indigo-400"
          disabled={busy}
        />
        <button
          type="submit"
          disabled={busy || !question.trim()}
          className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-40"
        >
          Ask
        </button>
      </form>
    </div>
  );
}
