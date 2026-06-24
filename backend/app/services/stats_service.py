from app.utils.token_counter import count_words, count_characters


def build_chunk_objects(chunks):
    result = []

    for index, chunk in enumerate(chunks, start=1):
        if isinstance(chunk, dict):
            chunk_text = chunk.get("text", "")
            metadata = chunk.get("metadata", {})
        else:
            chunk_text = chunk
            metadata = {}

        result.append({
            "chunk_id": index,
            "text": chunk_text,
            "metadata": metadata,
            "character_count": count_characters(chunk_text),
            "word_count": count_words(chunk_text)
        })

    return result


def calculate_stats(chunk_objects):
    if not chunk_objects:
        return {
            "total_chunks": 0,
            "avg_characters": 0,
            "min_characters": 0,
            "max_characters": 0,
            "avg_words": 0,
            "metadata_coverage": 0
        }

    char_counts = [c["character_count"] for c in chunk_objects]
    word_counts = [c["word_count"] for c in chunk_objects]

    chunks_with_metadata = [
        c for c in chunk_objects
        if c.get("metadata")
    ]

    return {
        "total_chunks": len(chunk_objects),
        "avg_characters": round(sum(char_counts) / len(char_counts), 2),
        "min_characters": min(char_counts),
        "max_characters": max(char_counts),
        "avg_words": round(sum(word_counts) / len(word_counts), 2),
        "metadata_coverage": round(
            len(chunks_with_metadata) / len(chunk_objects) * 100,
            2
        )
    }