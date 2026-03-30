export interface DocumentStats {
  sentenceCount: number;
  wordCount: number;
  charCount: number;
  estimatedTokens: number;
}

export interface Chunk {
  id: number;
  text: string;
  startIndex: number;
  endIndex: number;
}

export interface ChunkEmbedding {
  chunkId: number;
  embedding: number[];
  dimensions: number;
}

export interface SimilarityResult {
  chunkId: number;
  chunk: Chunk;
  score: number;
  rank: number;
}

export interface PipelineConfig {
  chunkSize: number;
  chunkOverlap: number;
  chunkingStrategy: 'sentence' | 'character';
  topK: number;
  embeddingModel: string;
  llmModel: string;
}

export interface PipelineResult {
  documentStats: DocumentStats;
  chunks: Chunk[];
  chunkEmbeddings: ChunkEmbedding[];
  queryEmbedding: number[];
  similarityResults: SimilarityResult[];
  topChunks: SimilarityResult[];
  prompt: string;
  answer: string;
}

export type PipelineStep =
  | 'input'
  | 'chunking'
  | 'embedding'
  | 'vectordb'
  | 'query'
  | 'retrieval'
  | 'prompt'
  | 'answer';

export interface StepInfo {
  id: PipelineStep;
  label: string;
  description: string;
  educationalText: string;
  icon: string;
}

export interface SampleDocument {
  id: string;
  title: string;
  description: string;
  text: string;
}
