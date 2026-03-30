import type { PipelineConfig, PipelineResult } from './types';

const API_BASE = '/api';

export async function runPipeline(
  documentText: string,
  query: string,
  config: PipelineConfig
): Promise<PipelineResult> {
  const response = await fetch(`${API_BASE}/pipeline/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      document_text: documentText,
      query,
      chunk_size: config.chunkSize,
      chunk_overlap: config.chunkOverlap,
      chunking_strategy: config.chunkingStrategy,
      top_k: config.topK,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `API error: ${response.status}`);
  }

  const data = await response.json();

  return {
    documentStats: {
      sentenceCount: data.document_stats.sentence_count,
      wordCount: data.document_stats.word_count,
      charCount: data.document_stats.char_count,
      estimatedTokens: data.document_stats.estimated_tokens,
    },
    chunks: data.chunks.map((c: Record<string, unknown>) => ({
      id: c.id,
      text: c.text,
      startIndex: c.start_index,
      endIndex: c.end_index,
    })),
    chunkEmbeddings: data.chunk_embeddings.map((e: Record<string, unknown>) => ({
      chunkId: e.chunk_id,
      embedding: e.embedding,
      dimensions: e.dimensions,
    })),
    queryEmbedding: data.query_embedding,
    similarityResults: data.similarity_results.map((r: Record<string, unknown>) => ({
      chunkId: r.chunk_id,
      chunk: {
        id: (r.chunk as Record<string, unknown>).id,
        text: (r.chunk as Record<string, unknown>).text,
        startIndex: (r.chunk as Record<string, unknown>).start_index,
        endIndex: (r.chunk as Record<string, unknown>).end_index,
      },
      score: r.score,
      rank: r.rank,
    })),
    topChunks: data.top_chunks.map((r: Record<string, unknown>) => ({
      chunkId: r.chunk_id,
      chunk: {
        id: (r.chunk as Record<string, unknown>).id,
        text: (r.chunk as Record<string, unknown>).text,
        startIndex: (r.chunk as Record<string, unknown>).start_index,
        endIndex: (r.chunk as Record<string, unknown>).end_index,
      },
      score: r.score,
      rank: r.rank,
    })),
    prompt: data.prompt,
    answer: data.answer,
  };
}
