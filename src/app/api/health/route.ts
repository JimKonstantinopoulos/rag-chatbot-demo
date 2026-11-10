import { NextResponse } from "next/server";
import { embedOne } from "@/lib/embeddings";
import { checkAnthropic } from "@/lib/anthropic";
import { getSupabase } from "@/lib/supabase";
import { SAMPLE_DOC } from "@/lib/sample";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// The purge runs every 10 minutes; 30 minutes past expiry means about 3 missed runs.
const RETENTION_GRACE_MINUTES = 30;

interface MatchRow {
  id: number;
}

/** Supabase rejects with a plain object, not an Error, so `.message` needs unwrapping. */
// Public endpoint: details go to the server log, the response says only "failed".
function describe(err: unknown): string {
  console.error("[health]", err);
  return "failed";
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

  // Retention (hosted demo: an expires_at column plus a scheduled purge every 10
  // minutes): uploads past expiry that the purge has not removed. Reads ids and a
  // count only, never content. "off" where retention is not set up (no expires_at
  // column, e.g. a fresh install of supabase/schema.sql); that still passes.
  try {
    const cutoff = new Date(Date.now() - RETENTION_GRACE_MINUTES * 60_000).toISOString();
    const { count, error } = await getSupabase()
      .from("documents")
      .select("id", { count: "exact" })
      .lt("expires_at", cutoff)
      .neq("doc_id", SAMPLE_DOC.docId)
      .limit(1);
    if (error) {
      if (error.code === "42703") checks.retention = "off";
      else throw error;
    } else {
      checks.retention = count ? `${count} expired upload rows not purged` : "ok";
    }
  } catch (err) {
    checks.retention = describe(err);
  }

  const ok = Object.entries(checks).every(
    ([k, v]) => v === "ok" || (k === "retention" && v === "off"),
  );
  return NextResponse.json({ ok, checks }, { status: ok ? 200 : 503 });
}
