def fixed_character_chunk(text: str, chunk_size: int, chunk_overlap: int):
    chunks = []
    start = 0

    while start < len(text):
        end = start + chunk_size
        chunk_text = text[start:end].strip()

        if chunk_text:
            chunks.append(chunk_text)

        start = end - chunk_overlap

    return chunks


def fixed_word_chunk(text: str, chunk_size: int, chunk_overlap: int):
    words = text.split()
    chunks = []
    start = 0

    while start < len(words):
        end = start + chunk_size
        chunk_text = " ".join(words[start:end]).strip()

        if chunk_text:
            chunks.append(chunk_text)

        start = end - chunk_overlap

    return chunks


def sliding_window_chunk(text: str, chunk_size: int, chunk_overlap: int):
    return fixed_word_chunk(text, chunk_size, chunk_overlap)