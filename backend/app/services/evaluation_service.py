def calculate_chunk_quality_score(chunk_objects):
    if not chunk_objects:
        return 0

    scores = []

    for chunk in chunk_objects:
        text = chunk.get("text", "")
        words = chunk.get("word_count", 0)
        chars = chunk.get("character_count", 0)

        score = 100

        if words < 30:
            score -= 25

        if words > 250:
            score -= 20

        if text and text[-1] not in [".", "?", "!", ":", ";", "}", "]"]:
            score -= 15

        if chars < 100:
            score -= 15

        if chars > 2000:
            score -= 15

        scores.append(max(score, 0))

    return round(sum(scores) / len(scores), 2)


def calculate_context_preservation_score(chunk_objects):
    if not chunk_objects:
        return 0

    good_boundaries = 0

    for chunk in chunk_objects:
        text = chunk.get("text", "").strip()

        if not text:
            continue

        starts_well = text[0].isupper() or text.startswith(("#", "{", "[", "-", "*"))
        ends_well = text[-1] in [".", "?", "!", ":", ";", "}", "]"]

        if starts_well and ends_well:
            good_boundaries += 1

    return round((good_boundaries / len(chunk_objects)) * 100, 2)


def calculate_metadata_score(chunk_objects):
    if not chunk_objects:
        return 0

    chunks_with_metadata = [
        chunk for chunk in chunk_objects
        if chunk.get("metadata") and len(chunk.get("metadata", {})) > 0
    ]

    return round((len(chunks_with_metadata) / len(chunk_objects)) * 100, 2)


def evaluate_chunks(chunk_objects):
    return {
        "chunk_quality_score": calculate_chunk_quality_score(chunk_objects),
        "context_preservation_score": calculate_context_preservation_score(chunk_objects),
        "metadata_score": calculate_metadata_score(chunk_objects),
    }
