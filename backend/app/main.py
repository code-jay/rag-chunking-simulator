from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import chunking, upload
from app.api import chunking, upload, compare

app = FastAPI(
    title="RAG Chunking Strategy Simulator",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chunking.router, tags=["Chunking"])
app.include_router(upload.router, tags=["Upload"])
app.include_router(compare.router, tags=["Compare"])


@app.get("/")
def home():
    return {
        "application": "RAG Chunking Strategy Simulator",
        "status": "running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }