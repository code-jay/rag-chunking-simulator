from app.chunkers.fixed_chunker import (
    fixed_character_chunk,
    fixed_word_chunk,
    sliding_window_chunk
)
from app.chunkers.token_chunker import fixed_token_chunk
from app.chunkers.paragraph_chunker import paragraph_chunk
from app.chunkers.sentence_chunker import sentence_chunk
from app.chunkers.recursive_chunker import recursive_character_chunk

from app.chunkers.markdown_chunker import markdown_header_chunk
from app.chunkers.html_chunker import html_header_chunk
from app.chunkers.json_chunker import json_chunk
from app.chunkers.code_chunker import python_code_chunk, javascript_code_chunk

from app.services.stats_service import build_chunk_objects, calculate_stats


SUPPORTED_STRATEGIES = [
    {"id": "fixed_character", "name": "Fixed Character Chunking", "category": "basic"},
    {"id": "fixed_word", "name": "Fixed Word Chunking", "category": "basic"},
    {"id": "fixed_token", "name": "Fixed Token Chunking", "category": "basic"},
    {"id": "sliding_window", "name": "Sliding Window Chunking", "category": "basic"},
    {"id": "paragraph", "name": "Paragraph Chunking", "category": "basic"},
    {"id": "sentence", "name": "Sentence Chunking", "category": "basic"},
    {"id": "recursive", "name": "LangChain Recursive Character Chunking", "category": "langchain"},
    {"id": "markdown_header", "name": "LangChain Markdown Header Chunking", "category": "langchain"},
    {"id": "html_header", "name": "LangChain HTML Header Chunking", "category": "langchain"},
    {"id": "json_recursive", "name": "LangChain Recursive JSON Chunking", "category": "langchain"},
    {"id": "python_code", "name": "Python Code Chunking", "category": "code"},
    {"id": "javascript_code", "name": "JavaScript Code Chunking", "category": "code"},
]


def get_supported_strategies():
    return SUPPORTED_STRATEGIES


def chunk_text(text: str, strategy: str, chunk_size: int, chunk_overlap: int):
    if strategy == "fixed_character":
        raw_chunks = fixed_character_chunk(text, chunk_size, chunk_overlap)

    elif strategy == "fixed_word":
        raw_chunks = fixed_word_chunk(text, chunk_size, chunk_overlap)

    elif strategy == "fixed_token":
        raw_chunks = fixed_token_chunk(text, chunk_size, chunk_overlap)

    elif strategy == "sliding_window":
        raw_chunks = sliding_window_chunk(text, chunk_size, chunk_overlap)

    elif strategy == "paragraph":
        raw_chunks = paragraph_chunk(text)

    elif strategy == "sentence":
        raw_chunks = sentence_chunk(text)

    elif strategy == "recursive":
        raw_chunks = recursive_character_chunk(text, chunk_size, chunk_overlap)

    elif strategy == "markdown_header":
        raw_chunks = markdown_header_chunk(text)

    elif strategy == "html_header":
        raw_chunks = html_header_chunk(text)

    elif strategy == "json_recursive":
        raw_chunks = json_chunk(text, chunk_size)

    elif strategy == "python_code":
        raw_chunks = python_code_chunk(text, chunk_size, chunk_overlap)

    elif strategy == "javascript_code":
        raw_chunks = javascript_code_chunk(text, chunk_size, chunk_overlap)

    else:
        raise ValueError(f"Unsupported chunking strategy: {strategy}")

    chunk_objects = build_chunk_objects(raw_chunks)
    stats = calculate_stats(chunk_objects)

    return {
        "strategy": strategy,
        "settings": {
            "chunk_size": chunk_size,
            "chunk_overlap": chunk_overlap
        },
        "stats": stats,
        "chunks": chunk_objects
    }