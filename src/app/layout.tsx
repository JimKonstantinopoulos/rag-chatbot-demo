import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ask Your Docs — RAG Chatbot",
  description:
    "Upload a document and ask questions. Answers are grounded in the source with citations — built with Next.js, Supabase pgvector, and Claude.",
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
