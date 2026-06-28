import OpenAI from "openai";

const EMBEDDING_MODEL = "text-embedding-3-small"; // 1536 dims, cheap

let openai: OpenAI | null = null;
function client(): OpenAI {
  if (openai) return openai;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY environment variable.");
  openai = new OpenAI({ apiKey });
  return openai;
}

/** Embed one or more strings. Returns a vector per input, in order. */
export async function embed(inputs: string[]): Promise<number[][]> {
  if (inputs.length === 0) return [];
  const res = await client().embeddings.create({
    model: EMBEDDING_MODEL,
    input: inputs,
  });
  return res.data.map((d) => d.embedding);
}

/** Convenience helper for a single string. */
export async function embedOne(input: string): Promise<number[]> {
  const [vector] = await embed([input]);
  return vector;
}
