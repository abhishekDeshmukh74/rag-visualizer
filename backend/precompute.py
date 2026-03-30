"""Pre-compute document-side pipeline results for sample documents.

Run once (or whenever sample docs / default config change):
    cd backend
    python precompute.py

Generates one .txt file per sample doc in  backend/precomputed/<id>.txt
containing JSON with: document_stats, chunks, chunk_embeddings (truncated),
and raw_embeddings (full numpy arrays as nested lists for similarity math).
"""

import json
import sys
from pathlib import Path

# Ensure app package is importable
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.pipeline import (
    parse_document,
    chunk_document,
    create_all_embeddings,
    build_chunk_embeddings,
    preload_embedding_model,
    _truncate_embedding,
)

OUT_DIR = Path(__file__).resolve().parent / "precomputed"
OUT_DIR.mkdir(exist_ok=True)

# Must match frontend DEFAULT_CONFIG
DEFAULT_CHUNK_SIZE = 200
DEFAULT_CHUNK_OVERLAP = 20
DEFAULT_STRATEGY = "sentence"

# Must match frontend SAMPLE_DOCUMENTS
SAMPLE_DOCUMENTS = {
    "redis": """Redis is an open-source, in-memory data structure store used as a database, cache, message broker, and streaming engine. Redis provides data structures such as strings, hashes, lists, sets, sorted sets with range queries, bitmaps, hyperloglogs, geospatial indexes, and streams.

Redis achieves its remarkable speed primarily because it stores all data in memory (RAM) rather than on disk. Accessing data in memory is orders of magnitude faster than reading from a hard drive or even an SSD. This is the single most important factor behind Redis's performance.

Redis uses a single-threaded event loop model for processing commands. While this might seem like a limitation, it actually eliminates the overhead of context switching and locking that multi-threaded systems face. The single thread processes commands sequentially, which also ensures that operations are atomic without the need for locks.

The event loop in Redis is built on the I/O multiplexing model. It uses system calls like epoll (Linux), kqueue (BSD/macOS), and select to handle many client connections without creating a thread for each connection. This allows Redis to handle tens of thousands of connections simultaneously with very low overhead.

Redis uses optimized data structures internally. For example, small hashes are stored as ziplists instead of full hash tables, and small sets use intsets. These compact representations reduce memory usage and improve cache locality, which helps performance even further.

Redis supports pipelining, which allows a client to send multiple commands without waiting for the response of each one. The server processes all the commands and sends back responses in bulk. This dramatically reduces network round-trip time, especially for batch operations.

Persistence in Redis is handled through RDB snapshots and AOF (Append Only File) logging. RDB creates point-in-time snapshots of the dataset at configurable intervals using a forked child process, so the main thread is never blocked by disk writes. AOF logs every write operation and can be configured with different fsync policies.

Redis Cluster provides horizontal scaling by automatically sharding data across multiple Redis nodes. Each node handles a subset of the hash slot space (16384 slots total). This allows Redis to scale beyond the memory limits of a single machine while maintaining its performance characteristics.

For caching use cases, Redis supports configurable eviction policies like LRU (Least Recently Used), LFU (Least Frequently Used), random eviction, and TTL-based expiry. These policies allow Redis to manage memory effectively when the dataset exceeds available RAM.

Redis also supports Lua scripting, which allows you to execute complex operations atomically on the server side. This reduces network round trips and ensures that multi-step operations are performed without interruption, which is especially useful for distributed locking and rate limiting.""",
    "password-reset": """How do I reset my password?

To reset your password, go to the login page and click "Forgot Password". Enter the email address associated with your account. You will receive a password reset link within 5 minutes. Click the link and enter your new password. Your new password must be at least 8 characters long and include a number and a special character.

What if I don't receive the reset email?

If you don't receive the password reset email, first check your spam or junk folder. Make sure you entered the correct email address. If you still don't see the email after 10 minutes, try requesting a new reset link. If the problem persists, contact our support team at support@example.com.

Can I reset my password using my phone number?

Currently, password reset is only available via email. We are working on adding SMS-based password reset in a future update. In the meantime, make sure your email address is up to date in your account settings.

How often can I request a password reset?

You can request up to 3 password reset links within a 1-hour period. After that, you will need to wait before requesting again. This limit helps protect your account from unauthorized reset attempts.

What are the password requirements?

Your password must be at least 8 characters long. It must contain at least one uppercase letter, one lowercase letter, one number, and one special character (such as !, @, #, $, %). Passwords cannot contain your username or email address. We recommend using a password manager to generate and store strong passwords.

Does resetting my password log me out of other devices?

Yes, resetting your password will automatically log you out of all active sessions on all devices. You will need to log in again with your new password on each device. This is a security measure to ensure that no unauthorized sessions remain active.

Can I reuse an old password?

No, you cannot reuse any of your last 5 passwords. This policy helps maintain account security by ensuring you regularly create new, unique passwords.

What should I do if someone else reset my password?

If you receive a password reset email that you did not request, do not click the link. Instead, log in to your account immediately and change your password. Enable two-factor authentication for additional security. If you cannot access your account, contact our support team immediately.""",
    "ml-basics": """Machine learning is a subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed. Instead of writing rules by hand, machine learning algorithms build models from data and use those models to make predictions or decisions.

There are three main types of machine learning: supervised learning, unsupervised learning, and reinforcement learning. Each type addresses different kinds of problems and uses different approaches to learn from data.

Supervised learning is the most common type. In supervised learning, the algorithm learns from labeled training data. Each training example consists of an input and the corresponding correct output. The algorithm learns to map inputs to outputs by finding patterns in the training data. Common supervised learning tasks include classification (predicting a category) and regression (predicting a number).

Unsupervised learning works with unlabeled data. The algorithm tries to find hidden patterns or structure in the data without being told what to look for. Common unsupervised learning tasks include clustering (grouping similar items), dimensionality reduction (simplifying data while preserving important information), and anomaly detection (finding unusual data points).

Reinforcement learning is inspired by behavioral psychology. An agent learns to make decisions by interacting with an environment. The agent receives rewards or penalties based on its actions and learns to maximize cumulative rewards over time. Reinforcement learning is used in robotics, game playing, and autonomous vehicles.

A machine learning model is trained through a process of optimization. The model starts with random parameters and gradually adjusts them to minimize a loss function, which measures how far the model's predictions are from the correct answers. This process is called training or fitting the model.

Overfitting is a common problem in machine learning. It occurs when a model learns the training data too well, including its noise and random fluctuations. An overfitted model performs well on training data but poorly on new, unseen data. Techniques like regularization, cross-validation, and using more training data help prevent overfitting.

Feature engineering is the process of selecting and transforming the input variables (features) used by a machine learning model. Good features can dramatically improve model performance. Feature engineering often requires domain expertise and is considered one of the most important and time-consuming parts of building a machine learning system.

Neural networks are a class of machine learning models inspired by the structure of the brain. They consist of layers of interconnected nodes (neurons) that process information. Deep learning refers to neural networks with many layers. Deep learning has achieved breakthrough results in image recognition, natural language processing, and speech recognition.

The bias-variance tradeoff is a fundamental concept in machine learning. Bias refers to errors from overly simplistic models that underfit the data. Variance refers to errors from overly complex models that overfit the data. The goal is to find the right balance between bias and variance for optimal model performance.""",
}


def precompute_one(doc_id: str, text: str) -> None:
    print(f"  [{doc_id}] parsing + chunking ...")
    stats = parse_document(text)
    chunks = chunk_document(text, DEFAULT_CHUNK_SIZE, DEFAULT_CHUNK_OVERLAP, DEFAULT_STRATEGY)

    print(f"  [{doc_id}] embedding {len(chunks)} chunks ...")
    chunk_texts = [c.text for c in chunks]
    # We only need chunk embeddings (no query yet), embed with a dummy query
    # to reuse create_all_embeddings; discard the dummy query embedding.
    raw_chunk_embs, _ = create_all_embeddings(chunk_texts, "dummy")

    # Truncated embeddings for the API response
    trunc_embs = build_chunk_embeddings(chunks, raw_chunk_embs)

    data = {
        "sample_id": doc_id,
        "config": {
            "chunk_size": DEFAULT_CHUNK_SIZE,
            "chunk_overlap": DEFAULT_CHUNK_OVERLAP,
            "chunking_strategy": DEFAULT_STRATEGY,
        },
        "document_stats": stats.model_dump(),
        "chunks": [c.model_dump() for c in chunks],
        "chunk_embeddings": [e.model_dump() for e in trunc_embs],
        # Full-precision raw embeddings for similarity computation at query time
        "raw_embeddings": raw_chunk_embs.tolist(),
    }

    out_path = OUT_DIR / f"{doc_id}.txt"
    out_path.write_text(json.dumps(data), encoding="utf-8")
    print(f"  [{doc_id}] saved → {out_path}")


def main() -> None:
    print("Loading embedding model ...")
    preload_embedding_model()

    print(f"Pre-computing {len(SAMPLE_DOCUMENTS)} sample documents ...\n")
    for doc_id, text in SAMPLE_DOCUMENTS.items():
        precompute_one(doc_id, text)

    print(f"\nDone. Files written to {OUT_DIR}/")


if __name__ == "__main__":
    main()
