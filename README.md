# RAG Visualizer

> An interactive open source app that shows how Retrieval-Augmented Generation works step by step — from raw text and chunking to embeddings, retrieval, prompt construction, and final LLM answer generation.

## What It Does

RAG Visualizer makes every stage of the RAG pipeline **visible and interactive**:

1. **Document Input** — Paste text or pick a sample document
2. **Chunking** — See how text is split into chunks (adjustable size, overlap, strategy)
3. **Embeddings** — Watch chunks become vector representations
4. **Query** — Enter a question and see it embedded
5. **Retrieval** — Similarity search with ranked results and charts
6. **Prompt Construction** — See the exact prompt sent to the LLM
7. **Answer** — Get the final answer with cited source chunks

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React, TypeScript, Vite, Tailwind CSS, Framer Motion, Recharts |
| Backend    | Python, FastAPI, Groq API           |
| Embeddings | sentence-transformers (`all-MiniLM-L6-v2`, local) |
| Vectors    | In-memory (NumPy cosine similarity) |

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- Groq API key(s)

### 1. Clone & setup backend

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt

# Configure your API key
cp .env.example .env
# Edit .env and add your GROQ_API_KEYS (comma-separated for rotation)
```

### 2. (Optional) Regenerate precomputed sample data

Precomputed embeddings for the built-in sample documents are already included in `backend/precomputed/`. If you change the sample documents or default chunking config, regenerate them:

```bash
cd backend
python precompute.py
```

### 3. Start the backend

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

### 4. Setup & start the frontend

```bash
cd frontend
npm install

# (Optional) copy and edit environment variables
cp .env.example .env

npm run dev
```

The `.env.example` documents two optional variables:
- `VITE_USE_PRECOMPUTED=true` — serve fully offline from precomputed static files (no backend needed)
- `VITE_BACKEND_URL` — override the default backend URL if not using the Vite proxy

### 5. Open the app

Visit **http://localhost:3000** in your browser.

## Sample Documents

The app comes with four built-in sample documents so you can try it instantly (no API key needed when `VITE_USE_PRECOMPUTED=true`):

- **Password Reset FAQ** — Common support questions about password resets
- **Return & Refund Policy** — E-commerce returns and refunds support doc
- **Leave Policy** — Employee leave types, eligibility, and procedures
- **Onboarding Guide** — New-hire FAQ covering first day, benefits, tools, and policies

## Project Structure

```
rag-visualizer/
├── frontend/              # React + TypeScript frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   │   └── steps/     # Pipeline step components
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Types, API client, constants
│   └── ...
├── backend/               # FastAPI backend
│   ├── app/
│   │   ├── main.py        # API routes
│   │   ├── pipeline.py    # RAG pipeline functions
│   │   └── models.py      # Pydantic models
│   ├── precomputed/       # Pre-built embeddings for sample docs
│   └── precompute.py      # Script to regenerate precomputed data
└── README.md
```

## How It Works

The backend exposes a single `POST /api/pipeline/run` endpoint that:

1. Parses the document and computes stats
2. Chunks the document using the selected strategy
3. Creates embeddings for all chunks (local `all-MiniLM-L6-v2`)
4. Embeds the user's query
5. Computes cosine similarity between query and all chunks
6. Selects the top-k most relevant chunks
7. Builds the augmented prompt with context
8. Generates the final answer (Groq `llama-3.1-8b-instant`)

Every intermediate result is returned so the frontend can visualize each step.

**Performance:** For the 4 built-in sample documents, steps 1-3 are precomputed at build time and loaded from `backend/precomputed/*.txt` on startup. Only the query embedding, similarity search, and LLM call run at request time, making sample-doc queries significantly faster. Custom documents still run the full pipeline.

**Offline / demo mode:** Set `VITE_USE_PRECOMPUTED=true` in `frontend/.env` to serve fully precomputed responses from static files in `frontend/public/precomputed/` — no backend or API key required. Only works with the four built-in sample documents.

## License

MIT
