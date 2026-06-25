import re
import json
from langchain_text_splitters import RecursiveCharacterTextSplitter


def detect_source_type(text: str) -> str:
    stripped = text.strip()
    lowered = stripped.lower()

    if stripped.startswith("{") or stripped.startswith("["):
        try:
            json.loads(stripped)
            return "json"
        except Exception:
            pass

    if re.search(r"^\s*#{1,6}\s+", text, re.MULTILINE):
        return "markdown"

    if any(tag in lowered for tag in ["<html", "<body", "<h1", "<h2", "<h3"]):
        return "html"

    if re.search(r"\bdef\s+\w+\s*\(", text) or re.search(r"\bclass\s+\w+", text):
        return "python_code"

    if re.search(r"\b(function|const|let|var)\s+\w+", text) or "=>" in text:
        return "javascript_code"

    return "plain_text"


def detect_language(text: str) -> str:
    # simple baseline; can be improved later with langdetect
    hindi_chars = re.findall(r"[\u0900-\u097F]", text)
    if len(hindi_chars) > 10:
        return "hindi"

    return "english"


def detect_section(chunk_text: str) -> str:
    lines = [line.strip() for line in chunk_text.splitlines() if line.strip()]

    for line in lines[:5]:
        if line.startswith("#"):
            return line.replace("#", "").strip()

        if len(line) < 80 and line.endswith(":"):
            return line.replace(":", "").strip()

        if line.isupper() and len(line) < 80:
            return line.strip()

    return "Unknown"


def has_table_like_content(text: str) -> bool:
    lines = text.splitlines()

    pipe_lines = [line for line in lines if "|" in line]
    comma_lines = [line for line in lines if line.count(",") >= 3]

    return len(pipe_lines) >= 2 or len(comma_lines) >= 2


def has_code_like_content(text: str) -> bool:
    patterns = [
        r"\bdef\s+\w+\s*\(",
        r"\bclass\s+\w+",
        r"\bfunction\s+\w+\s*\(",
        r"=>",
        r"console\.log",
        r"import\s+",
        r"from\s+\w+\s+import",
    ]

    return any(re.search(pattern, text) for pattern in patterns)


def metadata_enhanced_chunk(
    text: str,
    chunk_size: int,
    chunk_overlap: int,
):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", ".", " ", ""],
    )

    raw_chunks = splitter.split_text(text)

    source_type = detect_source_type(text)
    language = detect_language(text)
    document_length = len(text)
    total_chunks = len(raw_chunks)

    enhanced_chunks = []

    for index, chunk_text in enumerate(raw_chunks, start=1):
        metadata = {
            "type": "metadata_enhanced",
            "source_type": source_type,
            "language": language,
            "section": detect_section(chunk_text),
            "chunk_index": index,
            "total_chunks": total_chunks,
            "document_length": document_length,
            "chunk_size": len(chunk_text),
            "has_code": has_code_like_content(chunk_text),
            "has_table": has_table_like_content(chunk_text),
            "retrieval_use": "metadata_filtering",
            "traceability": "enabled",
        }

        enhanced_chunks.append({
            "text": chunk_text,
            "metadata": metadata,
        })

    return enhanced_chunks