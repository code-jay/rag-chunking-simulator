import pytest
from app.chunkers.fixed_chunker import (
    fixed_character_chunk,
    fixed_word_chunk,
    sliding_window_chunk,
)
from app.chunkers.metadata_enhanced_chunker import (
    metadata_enhanced_chunk,
    detect_source_type,
    detect_language,
    has_code_like_content,
    has_table_like_content,
)

from app.chunkers.paragraph_chunker import paragraph_chunk
from app.chunkers.sentence_chunker import sentence_chunk
from app.chunkers.recursive_chunker import recursive_character_chunk
from app.chunkers.markdown_chunker import markdown_header_chunk
from app.chunkers.html_chunker import html_header_chunk
from app.chunkers.json_chunker import json_chunk
from app.chunkers.code_chunker import python_code_chunk, javascript_code_chunk
from app.chunkers.semantic_chunker import semantic_similarity_chunk
from app.chunkers.parent_child_chunker import parent_child_chunk


def test_fixed_character_chunk():
    text = "abcdefghijklmnopqrstuvwxyz"

    chunks = fixed_character_chunk(
        text=text,
        chunk_size=10,
        chunk_overlap=2,
    )

    assert len(chunks) > 1
    assert chunks[0] == "abcdefghij"
    assert chunks[1].startswith("ij")


def test_fixed_word_chunk():
    text = "one two three four five six seven eight nine ten"

    chunks = fixed_word_chunk(
        text=text,
        chunk_size=4,
        chunk_overlap=1,
    )

    assert len(chunks) > 1
    assert chunks[0] == "one two three four"
    assert chunks[1].startswith("four")


def test_sliding_window_chunk():
    text = "one two three four five six seven eight nine ten"

    chunks = sliding_window_chunk(
        text=text,
        chunk_size=4,
        chunk_overlap=2,
    )

    assert len(chunks) > 1
    assert chunks[0] == "one two three four"
    assert chunks[1].startswith("three")


def test_paragraph_chunk():
    text = "Paragraph one.\n\nParagraph two.\n\nParagraph three."

    chunks = paragraph_chunk(text)

    assert len(chunks) == 3
    assert chunks[0] == "Paragraph one."
    assert chunks[1] == "Paragraph two."


def test_sentence_chunk():
    text = "This is sentence one. This is sentence two! Is this sentence three?"

    chunks = sentence_chunk(text)

    assert len(chunks) == 3
    assert chunks[0].endswith(".")
    assert chunks[1].endswith("!")
    assert chunks[2].endswith("?")

def test_recursive_character_chunk():
    text = """
Enterprise AI systems need document processing.

Chunking is important before embeddings.

Recursive chunking preserves paragraph boundaries.
"""

    chunks = recursive_character_chunk(
        text=text,
        chunk_size=80,
        chunk_overlap=10,
    )

    assert len(chunks) > 1
    assert all(len(chunk) <= 100 for chunk in chunks)

def test_markdown_header_chunk():
    text = """
# RAG Pipeline

## Ingestion

Documents are loaded.

## Chunking

Documents are split into chunks.
"""

    chunks = markdown_header_chunk(text)

    assert len(chunks) >= 2
    assert "text" in chunks[0]
    assert "metadata" in chunks[0]

def test_html_header_chunk():
    text = """
<html>
  <body>
    <h1>RAG Pipeline</h1>
    <p>Enterprise AI document processing.</p>

    <h2>Chunking</h2>
    <p>Documents are split into chunks.</p>
  </body>
</html>
"""

    chunks = html_header_chunk(text)

    assert isinstance(chunks, list)
    assert len(chunks) >= 1

    first_chunk = chunks[0]

    assert isinstance(first_chunk, dict)
    assert "text" in first_chunk
    assert "metadata" in first_chunk
    assert len(first_chunk["text"]) > 0

def test_json_chunk_valid_json():
    text = """
{
  "company": "Altmatic",
  "pipeline": {
    "steps": ["extract", "chunk", "embed", "retrieve"]
  }
}
"""

    chunks = json_chunk(text, max_chunk_size=100)

    assert len(chunks) >= 1
    assert "text" in chunks[0]
    assert "metadata" in chunks[0]


def test_json_chunk_invalid_json():
    text = "this is not json"

    with pytest.raises(Exception):
        json_chunk(text, max_chunk_size=100)

def test_python_code_chunk():
    text = """
class ChunkService:
    def split_text(self, text):
        return text.split("\\n\\n")

def calculate_stats(chunks):
    return len(chunks)
"""

    chunks = python_code_chunk(
        text=text,
        chunk_size=80,
        chunk_overlap=10,
    )

    assert len(chunks) >= 1
    assert chunks[0]["metadata"]["language"] == "python"
    assert chunks[0]["metadata"]["type"] == "code"


def test_javascript_code_chunk():
    text = """
function splitText(text) {
  return text.split("\\n\\n");
}

const chunks = splitText("hello");
"""

    chunks = javascript_code_chunk(
        text=text,
        chunk_size=80,
        chunk_overlap=10,
    )

    assert len(chunks) >= 1
    assert chunks[0]["metadata"]["language"] == "javascript"
    assert chunks[0]["metadata"]["type"] == "code"

@pytest.mark.slow
def test_semantic_similarity_chunk():
    text = """
Enterprise AI systems require strong document processing. Chunking is important for RAG.

Football is a popular sport. Teams need strategy and fitness.

Vector databases store embeddings. Retrieval uses similarity search.
"""

    chunks = semantic_similarity_chunk(
        text=text,
        similarity_threshold=0.7,
    )

    assert len(chunks) >= 1

    first_chunk = chunks[0]

    if isinstance(first_chunk, dict):
        assert "text" in first_chunk
        assert "metadata" in first_chunk


def test_empty_text_fixed_character():
    chunks = fixed_character_chunk("", chunk_size=10, chunk_overlap=2)

    assert chunks == []


def test_short_text_recursive():
    chunks = recursive_character_chunk(
        text="Short text.",
        chunk_size=100,
        chunk_overlap=10,
    )

    assert len(chunks) == 1
    assert chunks[0] == "Short text."


def test_paragraph_chunk_removes_empty_paragraphs():
    text = "Para one.\n\n\n\nPara two."

    chunks = paragraph_chunk(text)

    assert len(chunks) == 2

def test_parent_child_chunk():
    text = """
Enterprise AI systems require scalable document processing.

Chunking is important before embeddings.

Metadata improves retrieval.

Vector databases store chunks.

RAG combines retrieval with generation.
"""

    chunks = parent_child_chunk(
        text=text,
        parent_chunk_size=200,
        parent_chunk_overlap=20,
        child_chunk_size=80,
        child_chunk_overlap=10,
    )

    assert len(chunks) >= 1
    assert chunks[0]["metadata"]["type"] == "parent_child"
    assert "parent_id" in chunks[0]["metadata"]
    assert "child_id" in chunks[0]["metadata"]
    assert chunks[0]["metadata"]["retrieval_role"] == "child"
    assert chunks[0]["metadata"]["context_role"] == "parent"


from app.chunkers.adaptive_hybrid_chunker import (
    adaptive_hybrid_chunk,
    detect_document_type,
)


def test_adaptive_hybrid_detects_json():
    text = '{"company":"Altmatic","type":"rag"}'

    detection = detect_document_type(text)

    assert detection["document_type"] == "json"
    assert detection["recommended_strategy"] == "json_recursive"


def test_adaptive_hybrid_detects_markdown():
    text = "# Title\n\n## Section\n\nContent here."

    detection = detect_document_type(text)

    assert detection["document_type"] == "markdown"
    assert detection["recommended_strategy"] == "markdown_header"


def test_adaptive_hybrid_detects_python():
    text = "class ChunkService:\n    def split(self):\n        pass"

    detection = detect_document_type(text)

    assert detection["document_type"] == "python_code"
    assert detection["recommended_strategy"] == "python_code"


def test_adaptive_hybrid_chunks_general_text():
    text = "Enterprise AI systems need good document chunking. Recursive chunking is a good default."

    chunks = adaptive_hybrid_chunk(
        text=text,
        chunk_size=100,
        chunk_overlap=10,
        similarity_threshold=0.7,
    )

    assert len(chunks) >= 1
    assert chunks[0]["metadata"]["type"] == "adaptive_hybrid"
    assert "selected_strategy" in chunks[0]["metadata"]
    assert "detected_document_type" in chunks[0]["metadata"]


def test_metadata_enhanced_detects_markdown():
    text = "# Title\n\nContent here."

    assert detect_source_type(text) == "markdown"


def test_metadata_enhanced_detects_json():
    text = '{"company":"Altmatic"}'

    assert detect_source_type(text) == "json"


def test_metadata_enhanced_detects_python_code():
    text = "class Chunker:\n    def split(self):\n        pass"

    assert detect_source_type(text) == "python_code"


def test_metadata_enhanced_detects_language_english():
    text = "Enterprise AI systems need document processing."

    assert detect_language(text) == "english"


def test_metadata_enhanced_detects_code_content():
    text = "def split_text(text):\n    return text.split()"

    assert has_code_like_content(text) is True


def test_metadata_enhanced_detects_table_content():
    text = "Name,Age,City,Role\nJay,46,Bangalore,Architect"

    assert has_table_like_content(text) is True


def test_metadata_enhanced_chunk():
    text = """
# Enterprise AI

Enterprise AI systems need document processing.

## RAG Pipeline

Chunking improves retrieval.
"""

    chunks = metadata_enhanced_chunk(
        text=text,
        chunk_size=120,
        chunk_overlap=20,
    )

    assert len(chunks) >= 1
    assert chunks[0]["metadata"]["type"] == "metadata_enhanced"
    assert "source_type" in chunks[0]["metadata"]
    assert "language" in chunks[0]["metadata"]
    assert "section" in chunks[0]["metadata"]
    assert "chunk_index" in chunks[0]["metadata"]
    assert "total_chunks" in chunks[0]["metadata"]