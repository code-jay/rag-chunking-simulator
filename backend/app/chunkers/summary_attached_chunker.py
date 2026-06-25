import re
from langchain_text_splitters import RecursiveCharacterTextSplitter


def simple_summary(text: str, max_sentences: int = 2) -> str:
    sentences = re.split(r"(?<=[.!?])\s+", text.strip())
    sentences = [s.strip() for s in sentences if s.strip()]

    if not sentences:
        return text[:200]

    return " ".join(sentences[:max_sentences])[:300]


def extract_keywords(text: str, limit: int = 8):
    words = re.findall(r"\b[a-zA-Z]{4,}\b", text.lower())

    stopwords = {
        "this", "that", "with", "from", "have", "will", "your",
        "about", "into", "their", "there", "where", "when",
        "what", "which", "chunk", "chunks", "chunking"
    }

    freq = {}

    for word in words:
        if word not in stopwords:
            freq[word] = freq.get(word, 0) + 1

    sorted_words = sorted(freq.items(), key=lambda x: x[1], reverse=True)

    return [word for word, _ in sorted_words[:limit]]


def summary_attached_chunk(
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

    result = []

    for index, chunk_text in enumerate(raw_chunks, start=1):
        result.append({
            "text": chunk_text,
            "metadata": {
                "type": "summary_attached",
                "chunk_index": index,
                "summary": simple_summary(chunk_text),
                "keywords": extract_keywords(chunk_text),
                "summary_method": "rule_based_first_sentences",
                "retrieval_use": "summary_plus_chunk",
            }
        })

    return result
