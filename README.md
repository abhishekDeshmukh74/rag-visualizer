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

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | React, TypeScript, Vite, Tailwind CSS, Framer Motion, Recharts |
| Backend  | Python, FastAPI, OpenAI API         |
| Vectors  | In-memory (NumPy cosine similarity) |

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- OpenAI API key

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
# Edit .env and add your OPENAI_API_KEY
```

### 2. Start the backend

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

### 3. Setup & start the frontend

```bash
cd frontend
npm install
npm run dev
```

### 4. Open the app

Visit **http://localhost:3000** in your browser.

## Sample Documents

The app comes with built-in sample documents so you can try it instantly:

- **Why Redis is Fast** — Technical overview of Redis performance
- **Password Reset FAQ** — Common support questions
- **Machine Learning Basics** — Introduction to ML concepts

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
│   └── app/
│       ├── main.py        # API routes
│       ├── pipeline.py    # RAG pipeline functions
│       └── models.py      # Pydantic models
└── README.md
```

## How It Works

The backend exposes a single `POST /api/pipeline/run` endpoint that:

1. Parses the document and computes stats
2. Chunks the document using the selected strategy
3. Creates embeddings for all chunks (OpenAI `text-embedding-3-small`)
4. Embeds the user's query
5. Computes cosine similarity between query and all chunks
6. Selects the top-k most relevant chunks
7. Builds the augmented prompt with context
8. Generates the final answer (OpenAI `gpt-4o-mini`)

Every intermediate result is returned so the frontend can visualize each step.

## License

MIT
