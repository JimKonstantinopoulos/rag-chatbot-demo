/**
 * Split text into overlapping word-based chunks.
 * Overlap preserves context that would otherwise be cut across a boundary.
 */
export function chunkText(
  text: string,
  { chunkSize = 200, overlap = 40 }: { chunkSize?: number; overlap?: number } = {},
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const chunks: string[] = [];
  const step = Math.max(1, chunkSize - overlap);

  for (let start = 0; start < words.length; start += step) {
    const chunk = words.slice(start, start + chunkSize).join(" ").trim();
    if (chunk) chunks.push(chunk);
    if (start + chunkSize >= words.length) break;
  }
  return chunks;
}
