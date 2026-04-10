import type { PipelineConfig, PipelineResult } from './types';
import { SAMPLE_DOCUMENTS } from './constants';

interface RawChunk {
  id: number;
  text: string;
  start_index: number;
  end_index: number;
}

interface RawChunkEmbedding {
  chunk_id: number;
  embedding: number[];
  dimensions: number;
}

interface RawSimilarityResult {
  chunk_id: number;
  chunk: RawChunk;
  score: number;
  rank: number;
}

interface RawQueryEntry {
  query_embedding: number[];
  similarity_results: RawSimilarityResult[];
  top_chunks: RawSimilarityResult[];
  prompt: string;
  answer: string;
}

interface PrecomputedData {
  sample_id: string;
  document_stats: {
    sentence_count: number;
    word_count: number;
    char_count: number;
    estimated_tokens: number;
  };
  chunks: RawChunk[];
  chunk_embeddings: RawChunkEmbedding[];
  queries: Record<string, RawQueryEntry>;
}

function mapChunk(c: RawChunk) {
  return { id: c.id, text: c.text, startIndex: c.start_index, endIndex: c.end_index };
}

function mapSimilarityResult(r: RawSimilarityResult) {
  return { chunkId: r.chunk_id, chunk: mapChunk(r.chunk), score: r.score, rank: r.rank };
}

export async function getPrecomputedResult(
  documentText: string,
  query: string,
  _config: PipelineConfig,
): Promise<PipelineResult> {
  const matchedSample = SAMPLE_DOCUMENTS.find((s) => s.text === documentText);
  if (!matchedSample) {
    throw new Error(
      'No precomputed data for this document. Select one of the sample documents or disable VITE_USE_PRECOMPUTED.',
    );
  }

  const response = await fetch(`/precomputed/${matchedSample.id}.txt`);
  if (!response.ok) {
    throw new Error(`Failed to load precomputed data for "${matchedSample.id}": ${response.status}`);
  }

  const data: PrecomputedData = await response.json();

  const queryEntry = data.queries[query];
  if (!queryEntry) {
    const available = Object.keys(data.queries).map((q) => `• ${q}`).join('\n');
    throw new Error(
      `Query not found in precomputed data for "${matchedSample.title}".\n\nAvailable queries:\n${available}`,
    );
  }

  return {
    documentStats: {
      sentenceCount: data.document_stats.sentence_count,
      wordCount: data.document_stats.word_count,
      charCount: data.document_stats.char_count,
      estimatedTokens: data.document_stats.estimated_tokens,
    },
    chunks: data.chunks.map(mapChunk),
    chunkEmbeddings: data.chunk_embeddings.map((e) => ({
      chunkId: e.chunk_id,
      embedding: e.embedding,
      dimensions: e.dimensions,
    })),
    queryEmbedding: queryEntry.query_embedding,
    similarityResults: queryEntry.similarity_results.map(mapSimilarityResult),
    topChunks: queryEntry.top_chunks.map(mapSimilarityResult),
    prompt: queryEntry.prompt,
    answer: queryEntry.answer,
  };
}
