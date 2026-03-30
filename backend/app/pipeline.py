"""Core RAG pipeline functions — each step is a separate function for visibility."""

import re
import threading
import numpy as np
from numpy.typing import NDArray
from groq import Groq, RateLimitError

from .models import ChunkModel, ChunkEmbeddingModel, SimilarityResultModel, DocumentStatsModel

# Max embedding dimensions to include in the API response (frontend only uses first ~80).
_EMBED_TRUNCATE = 80


class GroqKeyManager:
    """Manages multiple Groq API keys with automatic rotation on rate limits."""

    def __init__(self, api_keys: list[str]):
        if not api_keys:
            raise ValueError("At least one API key is required")
        self._keys = api_keys
        self._index = 0
        self._lock = threading.Lock()
        self._clients: dict[str, Groq] = {}

    @property
    def total_keys(self) -> int:
        return len(self._keys)

    def _get_client(self, key: str) -> Groq:
        if key not in self._clients:
            self._clients[key] = Groq(api_key=key)
        return self._clients[key]

    def get_client(self) -> Groq:
        with self._lock:
            key = self._keys[self._index]
        return self._get_client(key)

    def rotate(self) -> None:
        with self._lock:
            self._index = (self._index + 1) % len(self._keys)


# Load embedding model once (lazy to avoid slow startup)
_embedding_model = None


def get_embedding_model():
    """Lazy-load the fastembed model."""
    global _embedding_model
    if _embedding_model is None:
        from fastembed import TextEmbedding
        _embedding_model = TextEmbedding("sentence-transformers/all-MiniLM-L6-v2")
    return _embedding_model


def preload_embedding_model() -> None:
    """Eagerly load the model so the first request is fast."""
    get_embedding_model()


def parse_document(text: str) -> DocumentStatsModel:
    """Compute document statistics."""
    sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', text) if s.strip()]
    words = text.split()
    return DocumentStatsModel(
        sentence_count=len(sentences),
        word_count=len(words),
        char_count=len(text),
        estimated_tokens=int(len(words) * 1.3),
    )


def chunk_document(
    text: str,
    chunk_size: int = 200,
    chunk_overlap: int = 20,
    strategy: str = "sentence",
) -> list[ChunkModel]:
    """Split document into chunks using the specified strategy."""
    if strategy == "sentence":
        return _chunk_by_sentence(text, chunk_size, chunk_overlap)
    return _chunk_by_character(text, chunk_size, chunk_overlap)


def _chunk_by_sentence(text: str, chunk_size: int, chunk_overlap: int) -> list[ChunkModel]:
    sentences = re.split(r'(?<=[.!?])\s+', text)
    chunks: list[ChunkModel] = []
    current_chunk = ""
    current_start = 0
    chunk_id = 0
    pos = 0  # track position in original text

    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue

        # Find this sentence's position in the original text
        sent_start = text.find(sentence, pos)
        if sent_start == -1:
            sent_start = pos

        if not current_chunk:
            current_start = sent_start
            current_chunk = sentence
        elif len(current_chunk) + len(sentence) + 1 <= chunk_size:
            current_chunk += " " + sentence
        else:
            # Save current chunk
            end_index = current_start + len(current_chunk)
            chunks.append(ChunkModel(
                id=chunk_id,
                text=current_chunk,
                start_index=current_start,
                end_index=end_index,
            ))
            chunk_id += 1

            # Handle overlap: include tail of previous chunk
            if chunk_overlap > 0 and len(current_chunk) > chunk_overlap:
                overlap_text = current_chunk[-chunk_overlap:]
                # Find a word boundary for cleaner overlap
                space_idx = overlap_text.find(' ')
                if space_idx != -1:
                    overlap_text = overlap_text[space_idx + 1:]
                current_chunk = overlap_text + " " + sentence
                current_start = end_index - len(overlap_text)
            else:
                current_chunk = sentence
                current_start = sent_start

        pos = sent_start + len(sentence)

    # Don't forget the last chunk
    if current_chunk.strip():
        chunks.append(ChunkModel(
            id=chunk_id,
            text=current_chunk,
            start_index=current_start,
            end_index=current_start + len(current_chunk),
        ))

    return chunks


def _chunk_by_character(text: str, chunk_size: int, chunk_overlap: int) -> list[ChunkModel]:
    chunks: list[ChunkModel] = []
    chunk_id = 0
    start = 0

    while start < len(text):
        end = min(start + chunk_size, len(text))
        chunk_text = text[start:end]

        # Try to break at a word boundary
        if end < len(text):
            last_space = chunk_text.rfind(' ')
            if last_space > chunk_size // 2:
                end = start + last_space
                chunk_text = text[start:end]

        chunks.append(ChunkModel(
            id=chunk_id,
            text=chunk_text.strip(),
            start_index=start,
            end_index=end,
        ))
        chunk_id += 1
        start = end - chunk_overlap if chunk_overlap > 0 else end

    return chunks


def create_embeddings(
    texts: list[str],
) -> list[list[float]]:
    """Create embeddings for a list of texts using fastembed."""
    model = get_embedding_model()
    embeddings = list(model.embed(texts))
    return [emb.tolist() for emb in embeddings]


def create_all_embeddings(
    chunk_texts: list[str],
    query: str,
) -> tuple[NDArray, NDArray]:
    """Embed chunks and query in a single call.

    Returns raw numpy arrays so downstream code can use them directly
    without list ↔ ndarray round-trips.
    """
    model = get_embedding_model()
    all_texts = chunk_texts + [query]
    all_embeddings = np.array(list(model.embed(all_texts)), dtype=np.float32)
    return all_embeddings[:-1], all_embeddings[-1]


def _truncate_embedding(emb: NDArray) -> list[float]:
    """Truncate and round an embedding for the API response."""
    return [round(float(v), 6) for v in emb[:_EMBED_TRUNCATE]]


def build_chunk_embeddings(
    chunks: list[ChunkModel],
    raw_embeddings: NDArray,
) -> list[ChunkEmbeddingModel]:
    """Build response-ready ChunkEmbeddingModel list with truncated vectors."""
    dims = int(raw_embeddings.shape[1])
    return [
        ChunkEmbeddingModel(
            chunk_id=chunk.id,
            embedding=_truncate_embedding(raw_embeddings[i]),
            dimensions=dims,
        )
        for i, chunk in enumerate(chunks)
    ]


def compute_similarity(
    query_vec: NDArray,
    chunk_matrix: NDArray,
    chunks: list[ChunkModel],
) -> list[SimilarityResultModel]:
    """Compute cosine similarity between query and all chunk embeddings (vectorized).

    Operates directly on numpy arrays — no list conversion needed.
    """
    query_norm = np.linalg.norm(query_vec)

    if query_norm == 0 or len(chunks) == 0:
        return [
            SimilarityResultModel(chunk_id=c.id, chunk=c, score=0.0, rank=i + 1)
            for i, c in enumerate(chunks)
        ]

    chunk_norms = np.linalg.norm(chunk_matrix, axis=1)
    safe_norms = np.where(chunk_norms == 0, 1.0, chunk_norms)
    scores = chunk_matrix @ query_vec / (safe_norms * query_norm)
    scores = np.where(chunk_norms == 0, 0.0, scores)

    ranked_indices = np.argsort(scores)[::-1]
    return [
        SimilarityResultModel(
            chunk_id=chunks[idx].id,
            chunk=chunks[idx],
            score=round(float(scores[idx]), 6),
            rank=rank + 1,
        )
        for rank, idx in enumerate(ranked_indices)
    ]


def retrieve_top_k(
    similarity_results: list[SimilarityResultModel],
    top_k: int = 3,
) -> list[SimilarityResultModel]:
    """Select the top-k most similar chunks."""
    return similarity_results[:top_k]


def build_prompt(query: str, top_chunks: list[SimilarityResultModel]) -> str:
    """Construct the prompt sent to the LLM."""
    context_parts = []
    for result in top_chunks:
        context_parts.append(
            f"[Chunk #{result.chunk_id + 1} | Relevance: {result.score:.1%}]\n{result.chunk.text}"
        )
    context = "\n\n".join(context_parts)

    return f"""INSTRUCTIONS:
You are a helpful assistant. Answer the user's question based ONLY on the provided context.
If the context doesn't contain enough information, say so clearly.
Cite the chunk numbers you used in your answer.

CONTEXT:
{context}

QUESTION:
{query}"""


def generate_answer(key_manager: GroqKeyManager, prompt: str, model: str = "llama-3.1-8b-instant") -> str:
    """Generate an answer using Groq, rotating API keys on rate limit errors."""
    last_error = None
    for _ in range(key_manager.total_keys):
        client = key_manager.get_client()
        try:
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that answers questions based on provided context."},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.3,
                max_tokens=500,
            )
            return response.choices[0].message.content or "No response generated."
        except RateLimitError as e:
            last_error = e
            print(f"Rate limit hit, rotating to next API key...")
            key_manager.rotate()
    raise last_error or RuntimeError("All API keys exhausted due to rate limits.")
