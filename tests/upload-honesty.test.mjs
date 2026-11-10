import "./register.mjs";
import test from "node:test";
import assert from "node:assert/strict";

process.env.OPENAI_API_KEY = "test-not-real";
process.env.ANTHROPIC_API_KEY = "test-not-real";
process.env.SUPABASE_URL = "http://supabase.invalid";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-not-real";

// Everything outside this process is a scripted stub. Nothing here reaches a network.
const calls = [];
let anthropicReply = null;
let openaiReply = null;
const json = (body, status = 200) => Response.json(body, { status });
globalThis.fetch = async (input, init = {}) => {
  const url = new URL(typeof input === "string" ? input : (input.url ?? String(input)));
  calls.push(url.hostname + url.pathname);
  if (url.hostname === "api.openai.com") {
    if (openaiReply) return openaiReply();
    const n = JSON.parse(init.body).input.length;
    return json({
      object: "list",
      model: "stub",
      usage: { prompt_tokens: 1, total_tokens: 1 },
      data: Array.from({ length: n }, (_, index) => ({
        object: "embedding",
        index,
        embedding: new Array(1536).fill(0.01),
      })),
    });
  }
  if (url.hostname === "api.anthropic.com") return anthropicReply();
  if (url.pathname.endsWith("/rpc/match_documents")) {
    return json([{ id: 1, content: "passage one", chunk_index: 0, similarity: 0.9 }]);
  }
  if (url.pathname.endsWith("/rest/v1/documents")) return new Response(null, { status: 201 });
  throw new Error("unexpected request " + url.href);
};

const ingest = await import("@/app/api/ingest/route");
const chat = await import("@/app/api/chat/route");
console.error = () => {};

const upload = async (bytes, name) => {
  calls.length = 0;
  const form = new FormData();
  form.append("file", new File([bytes], name));
  const res = await ingest.POST(new Request("http://local.invalid/api/ingest", { method: "POST", body: form }));
  return { status: res.status, body: await res.json(), calls: [...calls] };
};
const ask = async () => {
  const res = await chat.POST(
    new Request("http://local.invalid/api/chat", {
      method: "POST",
      body: JSON.stringify({ docId: "11111111-1111-4111-8111-111111111111", question: "What is the limit?" }),
    }),
  );
  return { status: res.status, body: await res.json() };
};
const message = (text, stop_reason = "end_turn") =>
  json({
    id: "msg_t", type: "message", role: "assistant", model: "stub",
    content: text === null ? [] : [{ type: "text", text }],
    stop_reason, usage: { input_tokens: 1, output_tokens: 1 },
  });
const embeds = () => calls.filter((c) => c.includes("embeddings")).length;

// Windows-1253 bytes for "Η πολιτική επιστροφών είναι 30 ημέρες" (Greek letters are 0xC1-0xFE)
const greek1253 = Uint8Array.from(
  [0xc7, 0x20, 0xf0, 0xef, 0xeb, 0xe9, 0xf4, 0xe9, 0xea, 0xde, 0x20, 0xe5, 0xf0, 0xe9, 0xf3, 0xf4, 0xf1, 0xef, 0xf6, 0xfe, 0xed, 0x20, 0x33, 0x30],
);
const utf8Greek = new TextEncoder().encode("Η πολιτική επιστροφών είναι 30 ημέρες. ".repeat(5));
const utf16le = Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from("Return policy is thirty days.", "utf16le")]);

test("1. Windows-1253 Greek is refused with a clear message, never stored as success", async () => {
  const r = await upload(greek1253, "policy.txt");
  assert.equal(r.status, 400);
  assert.match(r.body.error, /UTF-8/);
  assert.equal(embeds(), 0, "no embedding call for refused content");
  assert.ok(!r.calls.some((c) => c.includes("rest/v1")), "nothing stored");
});

test("1. valid UTF-8 Greek still ingests", async () => {
  const r = await upload(utf8Greek, "policy.txt");
  assert.equal(r.status, 200);
  assert.ok(r.body.docId);
});

test("1. NUL-bearing and UTF-16 content is rejected before any embedding call", async () => {
  for (const [bytes, name] of [
    [utf16le, "u16.txt"],
    [Buffer.from("abc\u0000def ghi"), "nul.md"],
  ]) {
    const r = await upload(bytes, name);
    assert.equal(r.status, 400, name);
    assert.equal(embeds(), 0, name + ": embed must not run");
  }
});

test("3. provider errors never reach the browser (ingest)", async () => {
  openaiReply = () =>
    json({ error: { message: "You exceeded your current quota, org-SECRET, model text-embedding-3-small" } }, 429);
  const r = await upload(utf8Greek, "policy.txt");
  openaiReply = null;
  assert.equal(r.status, 500);
  assert.doesNotMatch(JSON.stringify(r.body), /quota|org-SECRET|embedding|429/i);
});

test("3. provider errors never reach the browser (chat)", async () => {
  anthropicReply = () =>
    json({ type: "error", error: { type: "not_found_error", message: "model: claude-secret-id" }, request_id: "req_SECRET" }, 404);
  const r = await ask();
  assert.equal(r.status, 500);
  assert.doesNotMatch(JSON.stringify(r.body), /claude-secret-id|req_SECRET|not_found/i);
});

test("2. a reply cut at the length limit is flagged to the visitor", async () => {
  anthropicReply = () => message("The limit is thirty and the", "max_tokens");
  const r = await ask();
  assert.equal(r.status, 200);
  assert.equal(r.body.truncated, true);
});

test("2. a complete reply is not flagged", async () => {
  anthropicReply = () => message("The limit is thirty days [1].");
  const r = await ask();
  assert.notEqual(r.body.truncated, true);
});

test("2. an empty reply is not shown as a blank answer", async () => {
  anthropicReply = () => message(null, "max_tokens");
  const r = await ask();
  assert.ok(r.body.answer && r.body.answer.trim().length > 0);
});
