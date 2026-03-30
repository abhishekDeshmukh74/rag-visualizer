from pydantic import BaseModel, Field


class ChunkModel(BaseModel):
    id: int
    text: str
    start_index: int
    end_index: int


class ChunkEmbeddingModel(BaseModel):
    chunk_id: int
    embedding: list[float]
    dimensions: int


class SimilarityResultModel(BaseModel):
    chunk_id: int
    chunk: ChunkModel
    score: float
    rank: int


class DocumentStatsModel(BaseModel):
    sentence_count: int
    word_count: int
    char_count: int
    estimated_tokens: int


class PipelineRequest(BaseModel):
    document_text: str = Field(..., min_length=1, max_length=50000)
    query: str = Field(..., min_length=1, max_length=1000)
    chunk_size: int = Field(default=200, ge=50, le=500)
    chunk_overlap: int = Field(default=20, ge=0, le=100)
    chunking_strategy: str = Field(default="sentence", pattern="^(sentence|character)$")
    top_k: int = Field(default=3, ge=1, le=10)


class PipelineResponse(BaseModel):
    document_stats: DocumentStatsModel
    chunks: list[ChunkModel]
    chunk_embeddings: list[ChunkEmbeddingModel]
    query_embedding: list[float]
    similarity_results: list[SimilarityResultModel]
    top_chunks: list[SimilarityResultModel]
    prompt: str
    answer: str
