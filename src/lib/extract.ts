import { extractText, getDocumentProxy } from "unpdf";

/** An error whose message is safe and useful to show the visitor. */
export class UserFacingError extends Error {}

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

  // .txt, .md, and anything else must be valid UTF-8. Guessing another encoding
  // (for example Windows-1253 Greek) would store garbage while reporting success,
  // so refuse instead.
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buf);
  } catch {
    throw new UserFacingError(
      "This file is not UTF-8 text, so it cannot be read reliably. Please re-save it as UTF-8 and upload it again.",
    );
  }
}
