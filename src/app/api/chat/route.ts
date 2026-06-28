import { NextResponse } from "next/server";
import { embedOne } from "@/lib/embeddings";
import { answerFromContext, type Passage } from "@/lib/anthropic";
import { getSupabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const maxDuration = 60;

const MATCH_COUNT = 5;

interface MatchRow {
  id: number;
  content: string;
  chunk_index: number;
  similarity: number;
}

/**
 * POST /api/chat  { docId, question }
 * Embed the question -> retrieve top passages for that doc -> grounded answer.
 */
export async function POST(req: Request) {
  try {
    const { docId, question } = (await req.json()) as {
      docId?: string;
      question?: string;
    };

    if (!docId || !question?.trim()) {
      return NextResponse.json(
        { error: "docId and question are required." },
        { status: 400 },
      );
    }

    const queryEmbedding = await embedOne(question);

    const { data, error } = await getSupabase().rpc("match_documents", {
      query_embedding: queryEmbedding,
      match_doc_id: docId,
      match_count: MATCH_COUNT,
    });
    if (error) throw error;

    const matches = (data ?? []) as MatchRow[];
    if (matches.length === 0) {
      return NextResponse.json({
        answer: "I couldn't find anything relevant in the document.",
        sources: [],
      });
    }

    const passages: Passage[] = matches.map((m, i) => ({
      index: i + 1,
      content: m.content,
    }));

    const answer = await answerFromContext(question, passages);

    return NextResponse.json({
      answer,
      sources: passages.map((p, i) => ({
        index: p.index,
        content: p.content,
        similarity: matches[i].similarity,
      })),
    });
  } catch (err) {
    console.error("[chat]", err);
    const message = err instanceof Error ? err.message : "Chat failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
