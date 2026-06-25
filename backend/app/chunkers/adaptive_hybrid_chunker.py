import json
import re

from app.chunkers.recursive_chunker import recursive_character_chunk
from app.chunkers.markdown_chunker import markdown_header_chunk
from app.chunkers.html_chunker import html_header_chunk
from app.chunkers.json_chunker import json_chunk
from app.chunkers.code_chunker import python_code_chunk, javascript_code_chunk
from app.chunkers.semantic_chunker import semantic_similarity_chunk
from app.chunkers.parent_child_chunker import parent_child_chunk


def detect_document_type(text: str) -> dict:
    stripped = text.strip()
    lowered = stripped.lower()

    if not stripped:
        return {
            "document_type": "empty",
            "recommended_strategy": "recursive",
            "confidence": "low",
            "reason": "Empty input."
        }

    if stripped.startswith("{") or stripped.startswith("["):
        try:
            json.loads(stripped)
            return {
                "document_type": "json",
                "recommended_strategy": "json_recursive",
                "confidence": "high",
                "reason": "Input is valid JSON."
            }
        except json.JSONDecodeError:
            pass

    if re.search(r"^\s*#{1,6}\s+", text, re.MULTILINE):
        return {
            "document_type": "markdown",
            "recommended_strategy": "markdown_header",
            "confidence": "high",
            "reason": "Markdown headings were detected."
        }

    if any(tag in lowered for tag in ["<html", "<body", "<h1", "<h2", "<h3"]):
        return {
            "document_type": "html",
            "recommended_strategy": "html_header",
            "confidence": "high",
            "reason": "HTML structure and heading tags were detected."
        }

    if re.search(r"\bdef\s+\w+\s*\(", text) or re.search(r"\bclass\s+\w+", text):
        return {
            "document_type": "python_code",
            "recommended_strategy": "python_code",
            "confidence": "high",
            "reason": "Python class/function syntax was detected."
        }

    if re.search(r"\b(function|const|let|var)\s+\w+", text) or "=>" in text:
        return {
            "document_type": "javascript_code",
            "recommended_strategy": "javascript_code",
            "confidence": "medium",
            "reason": "JavaScript/TypeScript syntax was detected."
        }

    paragraphs = [p for p in re.split(r"\n\s*\n", text) if p.strip()]
    sentences = re.split(r"(?<=[.!?])\s+", text)

    has_many_paragraphs = len(paragraphs) >= 4
    has_many_sentences = len([s for s in sentences if s.strip()]) >= 8
    has_topic_shift_words = any(
        word in lowered
        for word in [
            "football",
            "sports",
            "finance",
            "legal",
            "architecture",
            "database",
            "governance",
            "security",
            "policy",
        ]
    )

    if has_many_paragraphs and has_many_sentences and has_topic_shift_words:
        return {
            "document_type": "mixed_topic_text",
            "recommended_strategy": "semantic_similarity",
            "confidence": "medium",
            "reason": "Multiple paragraphs, many sentences, and possible topic shifts were detected."
        }

    if len(stripped) > 2500:
        return {
            "document_type": "long_text",
            "recommended_strategy": "parent_child",
            "confidence": "medium",
            "reason": "Long document detected. Parent-child chunking can preserve broader context."
        }

    return {
        "document_type": "general_text",
        "recommended_strategy": "recursive",
        "confidence": "high",
        "reason": "General text detected. Recursive chunking is the best default."
    }


def adaptive_hybrid_chunk(
    text: str,
    chunk_size: int,
    chunk_overlap: int,
    similarity_threshold: float = 0.70,
):
    detection = detect_document_type(text)
    selected_strategy = detection["recommended_strategy"]

    if selected_strategy == "json_recursive":
        raw_chunks = json_chunk(text, chunk_size)

    elif selected_strategy == "markdown_header":
        raw_chunks = markdown_header_chunk(text)

    elif selected_strategy == "html_header":
        raw_chunks = html_header_chunk(text)

    elif selected_strategy == "python_code":
        raw_chunks = python_code_chunk(text, chunk_size, chunk_overlap)

    elif selected_strategy == "javascript_code":
        raw_chunks = javascript_code_chunk(text, chunk_size, chunk_overlap)

    elif selected_strategy == "semantic_similarity":
        raw_chunks = semantic_similarity_chunk(
            text=text,
            similarity_threshold=similarity_threshold,
        )

    elif selected_strategy == "parent_child":
        raw_chunks = parent_child_chunk(
            text=text,
            parent_chunk_size=chunk_size * 3,
            parent_chunk_overlap=chunk_overlap * 2,
            child_chunk_size=chunk_size,
            child_chunk_overlap=chunk_overlap,
        )

    else:
        raw_text_chunks = recursive_character_chunk(text, chunk_size, chunk_overlap)
        raw_chunks = [
            {
                "text": chunk,
                "metadata": {}
            }
            for chunk in raw_text_chunks
        ]

    enhanced_chunks = []

    for chunk in raw_chunks:
        if isinstance(chunk, dict):
            chunk_text = chunk.get("text", "")
            metadata = chunk.get("metadata", {})
        else:
            chunk_text = chunk
            metadata = {}

        metadata = {
            **metadata,
            "type": "adaptive_hybrid",
            "selected_strategy": selected_strategy,
            "detected_document_type": detection["document_type"],
            "confidence": detection["confidence"],
            "selection_reason": detection["reason"],
        }

        enhanced_chunks.append({
            "text": chunk_text,
            "metadata": metadata
        })

    return enhanced_chunks