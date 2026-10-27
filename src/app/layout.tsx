import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ask Your Docs | RAG Chatbot",
  description:
    "Upload a document and ask questions. Answers are generated from passages in your document, with the sources shown. Built with Next.js, Supabase pgvector, and Claude.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
