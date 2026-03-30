"""FastAPI application — RAG Visualizer backend."""

import asyncio
import json
import logging
import os
import time
from contextlib import asynccontextmanager
from functools import partial
from pathlib import Path

import numpy as np

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .models import (
    PipelineRequest,
    PipelineResponse,
    ChunkEmbeddingModel,
)
from .pipeline import (
    parse_document,
    chunk_document,
    create_all_embeddings,
    build_chunk_embeddings,
    compute_similarity,
    retrieve_top_k,
    build_prompt,
    generate_answer,
    preload_embedding_model,
    GroqKeyManager,
    _truncate_embedding,
    get_embedding_model,
)

load_dotenv()

PRECOMPUTED_DIR = Path(__file__).resolve().parent.parent / "precomputed"
_precomputed_cache: dict[str, dict] = {}

key_manager: GroqKeyManager | None = None


def _load_precomputed() -> None:
    """Load all precomputed sample-doc files into memory at startup."""
    if not PRECOMPUTED_DIR.exists():
        return
    for path in PRECOMPUTED_DIR.glob("*.txt"):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            sid = data["sample_id"]
            # Convert raw embeddings back to numpy once
            data["raw_embeddings_np"] = np.array(data["raw_embeddings"], dtype=np.float32)
            # Reconstruct ChunkModel list
            from .models import ChunkModel, ChunkEmbeddingModel, DocumentStatsModel
            data["chunks_parsed"] = [ChunkModel(**c) for c in data["chunks"]]
            data["chunk_embeddings_parsed"] = [ChunkEmbeddingModel(**e) for e in data["chunk_embeddings"]]
            data["document_stats_parsed"] = DocumentStatsModel(**data["document_stats"])
            _precomputed_cache[sid] = data
            logging.info("Loaded precomputed data for sample '%s'", sid)
        except Exception as exc:
            logging.warning("Failed to load precomputed file %s: %s", path, exc)


@asynccontextmanager
async def lifespan(app: FastAPI):
    global key_manager
    keys_str = os.getenv("GROQ_API_KEYS", "") or os.getenv("GROQ_API_KEY", "")
    keys = [k.strip() for k in keys_str.split(",") if k.strip()]
    if not keys:
        print("WARNING: GROQ_API_KEYS not set. The LLM answer step will fail.")
    key_manager = GroqKeyManager(keys) if keys else None

    # Preload embedding model so the first request is fast
    print("Preloading embedding model...")
    await asyncio.to_thread(preload_embedding_model)
    print("Embedding model ready.")

    # Load precomputed sample-doc data
    _load_precomputed()
    if _precomputed_cache:
        print(f"Loaded precomputed data for {len(_precomputed_cache)} sample doc(s).")

    yield
    key_manager = None


app = FastAPI(
    title="RAG Visualizer API",
    description="Backend API for the RAG Visualizer — shows every step of the RAG pipeline.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health():
    return {"status": "ok", "groq_configured": key_manager is not None}


@app.post("/api/pipeline/run", response_model=PipelineResponse)
async def run_pipeline(req: PipelineRequest):
    if key_manager is None:
        raise HTTPException(
            status_code=503,
            detail="Groq API keys not configured. Set GROQ_API_KEYS in backend/.env",
        )

    # --- Fast path: use precomputed doc-side data for sample documents ---
    precomputed = (
        _precomputed_cache.get(req.sample_id)
        if req.sample_id
        and req.chunk_size == 200
        and req.chunk_overlap == 20
        and req.chunking_strategy == "sentence"
        else None
    )

    try:
        t0 = time.perf_counter()

        if precomputed:
            document_stats = precomputed["document_stats_parsed"]
            chunks = precomputed["chunks_parsed"]
            chunk_embeddings = precomputed["chunk_embeddings_parsed"]
            raw_chunk_embs = precomputed["raw_embeddings_np"]

            # Only embed the user query
            model = get_embedding_model()
            raw_query_emb = await asyncio.to_thread(
                lambda: model.encode(req.query, normalize_embeddings=True)
            )
            query_embedding = _truncate_embedding(raw_query_emb)

            t1 = time.perf_counter()
            logging.info("Precomputed fast-path for sample '%s' — query embed %.2fs", req.sample_id, t1 - t0)
        else:
            # Step 1: Parse document
            document_stats = parse_document(req.document_text)

            # Step 2: Chunk document
            chunks = chunk_document(
                req.document_text,
                chunk_size=req.chunk_size,
                chunk_overlap=req.chunk_overlap,
                strategy=req.chunking_strategy,
            )

            if not chunks:
                raise HTTPException(status_code=400, detail="No chunks generated from the document.")

            t1 = time.perf_counter()

            # Step 3 & 4: Embed chunks + query in a single batched call (off the event loop)
            chunk_texts = [c.text for c in chunks]
            raw_chunk_embs, raw_query_emb = await asyncio.to_thread(
                create_all_embeddings, chunk_texts, req.query
            )

            # Build truncated embeddings for the response (much smaller JSON)
            chunk_embeddings = build_chunk_embeddings(chunks, raw_chunk_embs)
            query_embedding = _truncate_embedding(raw_query_emb)

        t2 = time.perf_counter()

        # Step 5: Compute similarity using raw numpy arrays (no list round-trip)
        similarity_results = await asyncio.to_thread(
            compute_similarity, raw_query_emb, raw_chunk_embs, chunks
        )

        # Step 6: Retrieve top-k
        top_chunks = retrieve_top_k(similarity_results, req.top_k)

        # Step 7: Build prompt
        prompt = build_prompt(req.query, top_chunks)

        t3 = time.perf_counter()

        # Step 8: Generate answer via Groq (off the event loop)
        answer = await asyncio.to_thread(generate_answer, key_manager, prompt)

        t4 = time.perf_counter()
        logging.info(
            "Pipeline timing: chunk=%.2fs  embed=%.2fs  retrieve=%.2fs  llm=%.2fs  total=%.2fs",
            t1 - t0, t2 - t1, t3 - t2, t4 - t3, t4 - t0,
        )

        return PipelineResponse(
            document_stats=document_stats,
            chunks=chunks,
            chunk_embeddings=chunk_embeddings,
            query_embedding=query_embedding,
            similarity_results=similarity_results,
            top_chunks=top_chunks,
            prompt=prompt,
            answer=answer,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
