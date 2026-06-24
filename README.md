# RAG Chunking Strategy Simulator

A full-stack web-based simulator for testing, comparing, and understanding different chunking strategies used in RAG pipelines, Enterprise AI document processing, semantic search, and LLM applications.

This project helps developers visually understand how different chunking techniques affect document splitting, metadata, retrieval quality, and downstream embedding behavior.

---

## Why This Project?

Chunking is one of the most important steps in a RAG pipeline.

Poor chunking can cause:

- Broken context
- Poor retrieval results
- Duplicate chunks
- Higher embedding cost
- Weak LLM responses
- Missing source traceability

This simulator allows you to test chunking strategies before applying them in a production RAG system.

---

## Key Features

### Text and File Input

- Paste raw text
- Upload documents
- Extract text from supported files
- Chunk uploaded files directly

Supported file types:

- `.txt`
- `.md`
- `.pdf`
- `.docx`
- `.html`
- `.json`
- `.csv`
- `.py`
- `.js`
- `.ts`
- `.tsx`
- `.jsx`

---

## Supported Chunking Strategies

### Basic Chunking

- Fixed Character Chunking
- Fixed Word Chunking
- Fixed Token Chunking
- Sliding Window Chunking
- Paragraph Chunking
- Sentence Chunking

### LangChain-Based Chunking

- RecursiveCharacterTextSplitter
- MarkdownHeaderTextSplitter
- HTMLHeaderTextSplitter
- RecursiveJsonSplitter
- Python Code Chunking
- JavaScript Code Chunking

### Semantic Chunking

- Semantic Similarity Chunking
- Sentence embedding based chunking
- Topic-shift detection
- Similarity threshold control

Semantic chunking uses local embeddings with:

```text
sentence-transformers/all-MiniLM-L6-v2
```

No API key is required.

---

## Current UI Features

- Strategy selector
- Chunk size control
- Chunk overlap control
- Semantic similarity threshold slider
- File upload
- Chunk cards
- Metadata badges
- Similarity score display
- Similarity progress bar
- Strategy comparison table
- Recursive vs Semantic side-by-side comparison
- Recommended strategy card
- Export JSON
- Copy chunks
- Copy generated LangChain code
- Collapsible chunk cards
- Tab-based layout

---

## Architecture

```text
Frontend: Next.js + TypeScript + Tailwind CSS
        |
        v
Backend: FastAPI
        |
        v
Chunk Service
        |
        +--> Basic Chunkers
        +--> LangChain Chunkers
        +--> Semantic Chunker
        +--> Code Chunkers
        +--> JSON / Markdown / HTML Chunkers
        |
        v
Stats Service + Recommendation Service
        |
        v
Frontend Visualization
```

---

## Project Structure

```text
rag-chunking-simulator/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── chunkers/
│   │   ├── extractors/
│   │   ├── models/
│   │   ├── services/
│   │   ├── utils/
│   │   └── main.py
│   ├── uploads/
│   ├── models/
│   └── requirements.txt
│
├── frontend/
│   ├── app/
│   │   └── page.tsx
│   ├── types/
│   │   └── chunking.ts
│   ├── .env.local
│   └── package.json
│
├── README.md
└── .gitignore
```

---

## Backend Setup

```bash
cd backend

python3 -m venv venv
source venv/bin/activate

pip install -r requirements.txt

uvicorn app.main:app --reload
```

Backend:

```text
http://127.0.0.1:8000
```

Swagger docs:

```text
http://127.0.0.1:8000/docs
```

If dependencies are not yet saved, install manually:

```bash
pip install fastapi uvicorn python-multipart
pip install langchain langchain-text-splitters
pip install pypdf python-docx pandas openpyxl
pip install tiktoken
pip install sentence-transformers scikit-learn numpy
```

---

## HuggingFace Cache Fix

Semantic chunking downloads a local embedding model.

If you get HuggingFace permission errors, run:

```bash
export HF_HUB_DISABLE_XET=1
export HF_HOME=$PWD/.hf_cache
export TRANSFORMERS_CACHE=$PWD/.hf_cache
mkdir -p .hf_cache models
uvicorn app.main:app --reload
```

Recommended code-level setup inside `semantic_chunker.py`:

```python
import os

os.environ["HF_HUB_DISABLE_XET"] = "1"
os.environ["HF_HOME"] = "./.hf_cache"
os.environ["TRANSFORMERS_CACHE"] = "./.hf_cache"
```

---

## Frontend Setup

```bash
cd frontend

npm install
```

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

Run frontend:

```bash
npm run dev
```

Frontend:

```text
http://localhost:3000
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Backend health/status |
| GET | `/health` | Health check |
| GET | `/strategies` | List supported chunking strategies |
| POST | `/chunk` | Chunk pasted text |
| POST | `/upload-and-chunk` | Upload file and chunk extracted text |
| POST | `/compare` | Compare multiple chunking strategies |
| POST | `/compare-recursive-semantic` | Side-by-side recursive vs semantic comparison |
| POST | `/recommend-strategy` | Recommend best chunking strategy |

---

## Example `/chunk` Request

```json
{
  "text": "Enterprise AI systems require intelligent document processing. Chunking is important before embeddings.",
  "strategy": "recursive",
  "chunk_size": 800,
  "chunk_overlap": 120,
  "similarity_threshold": 0.7
}
```

---

## Example Semantic Chunking Request

```json
{
  "text": "Enterprise AI needs document processing. Football is a popular sport. Vector databases store embeddings.",
  "strategy": "semantic_similarity",
  "chunk_size": 800,
  "chunk_overlap": 120,
  "similarity_threshold": 0.7
}
```

---

## Choosing the Right Chunking Strategy

| Document Type | Recommended Strategy |
|---|---|
| General PDF/DOCX/TXT | Recursive Character |
| Markdown | Markdown Header |
| HTML | HTML Header |
| JSON | Recursive JSON |
| Python Code | Python Code Chunking |
| JavaScript/TypeScript | JavaScript Code Chunking |
| Short paragraphs | Paragraph Chunking |
| Sentence-level analysis | Sentence Chunking |
| Long mixed-topic content | Semantic Similarity |
| Baseline RAG pipeline | Recursive Character |
| Advanced RAG quality testing | Semantic Similarity |

---

## Recursive vs Semantic Chunking

### Recursive Character Chunking

Best default for most RAG pipelines.

Pros:

- Fast
- Stable
- Simple
- Good baseline
- Preserves paragraphs and sentence boundaries better than fixed chunking

### Semantic Similarity Chunking

Best for meaning-based splitting.

Pros:

- Detects topic shifts
- Useful for mixed-topic documents
- Better for advanced RAG experiments

Trade-offs:

- Slower
- Requires embedding model
- More complex
- May produce different output depending on threshold

---

## Developer Actions

The app supports:

- Export chunks as JSON
- Copy chunks to clipboard
- Copy generated LangChain code
- Compare strategies
- Compare recursive vs semantic
- Recommend best strategy

---

## Validation Rules

The backend validates:

- Empty text
- Invalid JSON for `json_recursive`
- Invalid HTML for `html_header`
- Invalid Markdown for `markdown_header`
- Chunk overlap greater than or equal to chunk size
- Unsupported strategy

---

## Roadmap

Planned improvements:

- LLM-based chunking
- Agentic chunking
- Hybrid chunking
- Table-aware chunking
- Legal clause chunking
- Email thread chunking
- Retrieval simulation
- Embedding similarity visualization
- Chunk quality score
- Context completeness score
- Estimated embedding cost
- Vector database integration
- Docker setup
- Deployment guide
- Screenshot/GIF section for GitHub

---

## Portfolio Positioning

Suggested GitHub description:

```text
A web-based simulator for comparing RAG chunking strategies including LangChain splitters, semantic chunking, metadata visualization, recursive vs semantic comparison, and strategy recommendation.
```

Suggested LinkedIn description:

```text
Built a RAG Chunking Strategy Simulator to understand how different document chunking techniques affect retrieval quality in Enterprise AI systems. The app supports LangChain splitters, semantic chunking, metadata visualization, strategy comparison, and exportable chunks.
```

---

## Learning Outcomes

This project demonstrates:

- Enterprise RAG architecture
- Document preprocessing
- LangChain text splitters
- Semantic chunking
- Embedding-based similarity
- FastAPI API design
- Next.js frontend development
- AI developer tool design
- Chunk evaluation and comparison
- Practical Enterprise AI engineering

---

## License

MIT License
