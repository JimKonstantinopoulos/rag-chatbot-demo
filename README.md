# Ask Your Docs | RAG Chatbot

Upload a document, ask questions, and get answers **grounded in the source with citations**, not hallucinations. A small but production-shaped Retrieval-Augmented Generation (RAG) app.

> **Why this exists:** most "AI chatbots" happily invent answers. This one retrieves the relevant passages from *your* document first, answers only from them, cites what it used, and says *"I couldn't find that in the document"* when the answer isn't there.

## How it works

```
Upload (PDF / TXT / MD)
      │
      ▼
 Extract text ──► Chunk (overlapping) ──► Embed (OpenAI) ──► Store in Supabase pgvector
                                                                       │
Ask a question ──► Embed question ──► Vector similarity search (top-k) ─┘
      │                                          │
      ▼                                          ▼
   Claude  ◄───── grounded prompt (only the retrieved passages) ◄── passages
      │
      ▼
 Answer + citations [1][2] + expandable source passages
```

- **Retrieval:** the question is embedded and matched against the document's chunks with cosine similarity (`pgvector`), scoped to the uploaded document.
- **Grounding:** only the top passages are sent to the model, with a system prompt that forbids outside knowledge and requires citations.
- **Honesty:** if retrieval finds nothing relevant, the model is instructed to say so rather than guess.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | **Next.js** (App Router) + **TypeScript** |
| UI | **React** + **Tailwind CSS** |
| Vector store | **Supabase** (`pgvector`) |
| Embeddings | **OpenAI** `text-embedding-3-small` (1536 dims) |
| Answer generation | **Anthropic Claude** (`claude-haiku-4-5` by default, configurable) |
| Deploy | **Vercel** |

> Embeddings use OpenAI because Anthropic doesn't ship an embeddings API. Pairing OpenAI embeddings with Claude generation is the standard RAG setup.

## Run it locally

1. **Install**
   ```bash
   npm install
   ```

2. **Create the database.** In your Supabase project's SQL editor, run [`supabase/schema.sql`](./supabase/schema.sql) (enables `pgvector`, creates the `documents` table + the `match_documents` similarity function).

3. **Configure env.** Copy `.env.example` to `.env.local` and fill in:
   ```bash
   SUPABASE_URL=...
   SUPABASE_SERVICE_ROLE_KEY=...
   OPENAI_API_KEY=...
   ANTHROPIC_API_KEY=...
   ANSWER_MODEL=claude-haiku-4-5   # or claude-sonnet-4-6 for richer answers
   ```

4. **Run**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000, upload a document, and start asking.

## Project layout

```
src/
  app/
    page.tsx              UI orchestration (upload → chat)
    api/
      ingest/route.ts     extract → chunk → embed → store
      chat/route.ts       embed question → retrieve → grounded answer
  components/
    Uploader.tsx          file upload + indexing state
    Chat.tsx              chat UI + citations / source viewer
  lib/
    extract.ts            PDF / text extraction (unpdf)
    chunk.ts              overlapping word-based chunking
    embeddings.ts         OpenAI embeddings
    anthropic.ts          grounded answer generation (Claude)
    supabase.ts           server-side Supabase client
supabase/
  schema.sql              pgvector table + match_documents()
```

## Notes & trade-offs

- **Document scoping:** each upload gets its own `doc_id`; retrieval is scoped to it, so multiple documents don't bleed into each other.
- **Model choice:** Haiku is the default for cost/speed on a demo; set `ANSWER_MODEL=claude-sonnet-4-6` (or `claude-opus-4-8`) for higher-quality answers.
- **Server-only secrets:** all API keys and the Supabase service-role key live in server routes (`runtime = "nodejs"`); nothing sensitive reaches the browser.
- **Next steps if productionised:** streaming answers, auth + per-user document isolation (RLS), reranking, and citation highlight-in-source.

---

Built by Dimitris Konstantinopoulos.
