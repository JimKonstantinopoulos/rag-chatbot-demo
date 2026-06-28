import { NextResponse } from "next/server";
import { extractFileText } from "@/lib/extract";
import { chunkText } from "@/lib/chunk";
import { embed } from "@/lib/embeddings";
import { getSupabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/ingest  (multipart form-data, field: "file")
 * Extract text -> chunk -> embed -> store. Returns a docId to chat against.
 */
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    const text = (await extractFileText(file)).trim();
    if (!text) {
      return NextResponse.json(
        { error: "Could not extract any text from that file." },
        { status: 400 },
      );
    }

    const chunks = chunkText(text);
    if (chunks.length === 0) {
      return NextResponse.json({ error: "Document was empty." }, { status: 400 });
    }

    // One document id groups all of this upload's chunks.
    const docId = crypto.randomUUID();
    const vectors = await embed(chunks);

    const rows = chunks.map((content, i) => ({
      doc_id: docId,
      content,
      embedding: vectors[i],
      chunk_index: i,
    }));

    const { error } = await getSupabase().from("documents").insert(rows);
    if (error) throw error;

    return NextResponse.json({
      docId,
      filename: file.name,
      chunks: chunks.length,
    });
  } catch (err) {
    console.error("[ingest]", err);
    const message = err instanceof Error ? err.message : "Ingest failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
