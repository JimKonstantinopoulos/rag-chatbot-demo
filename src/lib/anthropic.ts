import Anthropic from "@anthropic-ai/sdk";

let anthropic: Anthropic | null = null;
function client(): Anthropic {
  if (anthropic) return anthropic;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY environment variable.");
  anthropic = new Anthropic({ apiKey });
  return anthropic;
}

// Cheap + fast by default; override with ANSWER_MODEL (e.g. claude-sonnet-4-6).
const ANSWER_MODEL = process.env.ANSWER_MODEL || "claude-haiku-4-5";

export interface Passage {
  index: number; // 1-based citation number
  content: string;
}

const SYSTEM_PROMPT = `You are a helpful assistant that answers questions using ONLY the numbered context passages provided by the user.

Rules:
- Answer strictly from the passages. Do NOT use outside knowledge.
- Answer directly and naturally, the way a person would. Just give the answer. Do NOT open with preambles like "According to the handbook", "According to the passage", "Based on the context", or "The document says".
- Still cite the passages you used by putting bracketed numbers at the end of the relevant sentence, e.g. [1] or [2][3].
- If the answer is not contained in the passages, say plainly: "I couldn't find that in the document." Do not guess.
- Keep it concise.`;

/** Generate a grounded answer from retrieved passages. */
export async function answerFromContext(
  question: string,
  passages: Passage[],
): Promise<string> {
  const context = passages
    .map((p) => `[${p.index}] ${p.content}`)
    .join("\n\n");

  const userMessage = `Context passages:\n\n${context}\n\n---\n\nQuestion: ${question}`;

  const response = await client().messages.create({
    model: ANSWER_MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  return response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("")
    .trim();
}
