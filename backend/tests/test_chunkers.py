import pytest
from app.chunkers.fixed_chunker import (
    fixed_character_chunk,
    fixed_word_chunk,
    sliding_window_chunk,
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