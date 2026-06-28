import { extractText, getDocumentProxy } from "unpdf";

/**
 * Pull plain text out of an uploaded file.
 * Supports PDF (via unpdf) and plain text / markdown.
 */
export async function extractFileText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  const buf = new Uint8Array(await file.arrayBuffer());

  if (name.endsWith(".pdf")) {
    const pdf = await getDocumentProxy(buf);
    const { text } = await extractText(pdf, { mergePages: true });
    return text;
  }

  // .txt, .md, and anything else we treat as UTF-8 text
  return new TextDecoder("utf-8").decode(buf);
}
