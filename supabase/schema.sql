-- Ask Your Docs — Supabase schema
-- Run this once in the Supabase SQL editor for your project.

-- 1. Enable pgvector
create extension if not exists vector;

-- 2. Chunk + embedding store
create table if not exists documents (
  id          bigserial primary key,
  doc_id      text not null,            -- groups chunks from one uploaded document
  content     text not null,            -- the chunk text
  embedding   vector(1536),             -- OpenAI text-embedding-3-small
  chunk_index int  not null,            -- order within the document
  created_at  timestamptz default now()
);

-- Scope lookups to a single document fast
create index if not exists documents_doc_id_idx on documents (doc_id);

-- Approximate nearest-neighbour index for cosine distance
create index if not exists documents_embedding_idx
  on documents using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- 3. Similarity search, scoped to one document
create or replace function match_documents (
  query_embedding vector(1536),
  match_doc_id    text,
  match_count     int
)
returns table (
  id          bigint,
  content     text,
  chunk_index int,
  similarity  float
)
language sql stable
as $$
  select
    documents.id,
    documents.content,
    documents.chunk_index,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where documents.doc_id = match_doc_id
  order by documents.embedding <=> query_embedding
  limit match_count;
$$;
