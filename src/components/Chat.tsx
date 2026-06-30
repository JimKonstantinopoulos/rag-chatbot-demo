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

function UserAvatar() {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white shadow">
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z" />
      </svg>
    </div>
  );
}

function BotAvatar() {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow">
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M12 2 9.9 7.9 4 10l5.9 2.1L12 18l2.1-5.9L20 10l-5.9-2.1L12 2Z" />
      </svg>
    </div>
  );
}

export function Chat({
  docId,
  suggestions,
}: {
  docId: string;
  suggestions?: string[];
}) {
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openSources, setOpenSources] = useState<number | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  async function ask(e?: React.FormEvent, preset?: string) {
    if (e) e.preventDefault();
    const q = (preset ?? question).trim();
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
      <div className="flex flex-col gap-5">
        {turns.length === 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-2">
              <BotAvatar />
              <div className="rounded-2xl rounded-bl-sm bg-slate-800 px-4 py-3 text-sm text-slate-300">
                Ask me anything about the document. I only answer from the
                source, with citations.
              </div>
            </div>
            {suggestions && suggestions.length > 0 && (
              <div className="flex flex-wrap gap-2 pl-10">
                {suggestions.map((q, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => ask(undefined, q)}
                    disabled={busy}
                    className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 transition hover:border-indigo-400 hover:text-white disabled:opacity-50"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {turns.map((turn, i) => (
          <div key={i} className="flex flex-col gap-4">
            {/* user message */}
            <div className="flex items-start justify-end gap-2">
              <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-indigo-600 px-4 py-2.5 text-sm text-white shadow-sm">
                {turn.question}
              </div>
              <UserAvatar />
            </div>

            {/* assistant message */}
            <div className="flex items-start gap-2">
              <BotAvatar />
              <div className="max-w-[80%] rounded-2xl rounded-bl-sm bg-slate-800 px-4 py-3 text-sm leading-relaxed text-slate-100 shadow-sm">
                <p className="whitespace-pre-wrap">{turn.answer}</p>
                {turn.sources.length > 0 && (
                  <div className="mt-2 border-t border-slate-700/60 pt-2">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenSources((cur) => (cur === i ? null : i))
                      }
                      className="text-xs font-medium text-indigo-300 hover:underline"
                    >
                      {openSources === i
                        ? "Hide sources"
                        : `📎 Sources (${turn.sources.length})`}
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
          </div>
        ))}

        {busy && (
          <div className="flex items-start gap-2">
            <BotAvatar />
            <div className="rounded-2xl rounded-bl-sm bg-slate-800 px-4 py-3 text-sm text-slate-400">
              <span className="inline-flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-500 [animation-delay:-0.2s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-500 [animation-delay:-0.1s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-500" />
              </span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {error && <p className="text-sm text-rose-400">{error}</p>}

      <form onSubmit={(e) => ask(e)} className="flex gap-2">
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
