from pydantic import BaseModel
from typing import Optional
from typing import List

class ChunkRequest(BaseModel):
    text: str
    strategy: str = "recursive"
    chunk_size: int = 800
    chunk_overlap: int = 120


class UploadChunkRequest(BaseModel):
    strategy: str = "recursive"
    chunk_size: int = 800
    chunk_overlap: int = 120

class CompareRequest(BaseModel):
    text: str
    strategies: List[str] = [
        "fixed_character",
        "fixed_word",
        "fixed_token",
        "recursive",
        "paragraph",
        "sentence"
    ]
    chunk_size: int = 800
    chunk_overlap: int = 120