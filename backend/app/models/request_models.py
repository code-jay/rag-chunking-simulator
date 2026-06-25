from pydantic import BaseModel, field_validator
from typing import Optional
from typing import List

class ChunkRequest(BaseModel):
    text: str
    strategy: str = "recursive"
    chunk_size: int = 800
    chunk_overlap: int = 120
    similarity_threshold: float = 0.70

    @field_validator("chunk_size")
    @classmethod
    def validate_chunk_size(cls, value):
        if value <= 0:
            raise ValueError("chunk_size must be greater than 0")
        return value

    @field_validator("chunk_overlap")
    @classmethod
    def validate_chunk_overlap(cls, value):
        if value < 0:
            raise ValueError("chunk_overlap cannot be negative")
        return value



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
        "sliding_window",
        "recursive",
        "paragraph",
        "sentence",
        "markdown_header",
        "html_header",
        "json_recursive",
        "python_code",
        "javascript_code",
        "semantic_similarity",
        "metadata_enhanced",
        "parent_child",
        "adaptive_hybrid",
        "summary_attached"
    ]
    chunk_size: int = 800
    chunk_overlap: int = 120
    similarity_threshold: float = 0.70