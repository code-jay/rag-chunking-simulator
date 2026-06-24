from pydantic import BaseModel
from typing import Optional


class ChunkRequest(BaseModel):
    text: str
    strategy: str = "recursive"
    chunk_size: int = 800
    chunk_overlap: int = 120


class UploadChunkRequest(BaseModel):
    strategy: str = "recursive"
    chunk_size: int = 800
    chunk_overlap: int = 120