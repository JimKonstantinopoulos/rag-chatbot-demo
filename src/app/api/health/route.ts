import { NextResponse } from "next/server";
import { embedOne } from "@/lib/embeddings";
import { checkAnthropic } from "@/lib/anthropic";
import { getSupabase } from "@/lib/supabase";
import { SAMPLE_DOC } from "@/lib/sample";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

interface MatchRow {
  id: number;
}

/** Supabase rejects with a plain object, not an Error, so `.message` needs unwrapping. */
function describe(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return String(err);
}

/**
 * GET /api/health
 * Exercises the real chat path (embed -> retrieve -> model) against the sample
 * doc. Returns 200 only when all three dependencies answer. Costs one embedding
 * of two words; the Anthropic check uses the models endpoint, which bills nothing.
 */
export async function GET() {
  const checks: Record<string, string> = {};

  let queryEmbedding: number[] | null = null;
  try {
    queryEmbedding = await embedOne("health check");
    checks.openai = "ok";
  } catch (err) {
    checks.openai = describe(err);
  }

  if (queryEmbedding) {
    try {
      const { data, error } = await getSupabase().rpc("match_documents", {
        query_embedding: queryEmbedding,
        match_doc_id: SAMPLE_DOC.docId,
        match_count: 1,
      });
      if (error) throw error;
      const matches = (data ?? []) as MatchRow[];
      if (matches.length === 0) {
        throw new Error("sample document returned no passages");
      }
      checks.supabase = "ok";
    } catch (err) {
      checks.supabase = describe(err);
    }
  } else {
    checks.supabase = "skipped: no embedding";
  }

  try {
    await checkAnthropic();
    checks.anthropic = "ok";
  } catch (err) {
    checks.anthropic = describe(err);
  }

  const ok = Object.values(checks).every((v) => v === "ok");
  return NextResponse.json({ ok, checks }, { status: ok ? 200 : 503 });
}
