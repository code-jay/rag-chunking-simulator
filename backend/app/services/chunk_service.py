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

from app.chunkers.semantic_chunker import semantic_similarity_chunk
from app.services.validation_service import validate_chunk_request

from app.services.evaluation_service import evaluate_chunks
from app.chunkers.parent_child_chunker import parent_child_chunk
from app.chunkers.adaptive_hybrid_chunker import adaptive_hybrid_chunk
from app.chunkers.metadata_enhanced_chunker import metadata_enhanced_chunk

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
    {"id": "semantic_similarity", "name": "Semantic Similarity Chunking", "category": "semantic"},
    {"id": "parent_child", "name": "Hierarchical Parent-Child Chunking", "category": "hierarchical"},
    {"id": "adaptive_hybrid","name": "Adaptive Hybrid Chunking","category": "hybrid"},
    {"id": "metadata_enhanced", "name": "Metadata Enhanced Chunking", "category": "metadata"}
]


def get_supported_strategies():
    return SUPPORTED_STRATEGIES


def chunk_text(text: str, strategy: str, chunk_size: int, chunk_overlap: int, similarity_threshold: float = 0.70):
    validate_chunk_request(text, strategy, chunk_size, chunk_overlap)

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

    elif strategy == "semantic_similarity":
        raw_chunks = semantic_similarity_chunk(text=text, similarity_threshold=0.70)
    
    elif strategy == "semantic_similarity":
        raw_chunks = semantic_similarity_chunk( text=text, similarity_threshold=similarity_threshold)
    elif strategy == "parent_child":
        raw_chunks = parent_child_chunk(
            text=text,
            parent_chunk_size=chunk_size * 3,
            parent_chunk_overlap=chunk_overlap * 2,
            child_chunk_size=chunk_size,
            child_chunk_overlap=chunk_overlap,
        )
    elif strategy == "adaptive_hybrid":
        raw_chunks = adaptive_hybrid_chunk(
            text=text,
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            similarity_threshold=similarity_threshold,
        )
    elif strategy == "metadata_enhanced":
        raw_chunks = metadata_enhanced_chunk(
            text=text,
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
        )
    else:
        raise ValueError(f"Unsupported chunking strategy: {strategy}")

    chunk_objects = build_chunk_objects(raw_chunks)
    stats = calculate_stats(chunk_objects)
    evaluation = evaluate_chunks(chunk_objects)

    return {
    "strategy": strategy,
    "settings": {
        "chunk_size": chunk_size,
        "chunk_overlap": chunk_overlap,
        "similarity_threshold": similarity_threshold
    },
    "stats": stats,
    "evaluation": evaluation,
    "chunks": chunk_objects
}