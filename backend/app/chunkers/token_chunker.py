import tiktoken


def fixed_token_chunk(text: str, chunk_size: int, chunk_overlap: int):
    encoding = tiktoken.get_encoding("cl100k_base")
    tokens = encoding.encode(text)

    chunks = []
    start = 0

    while start < len(tokens):
        end = start + chunk_size
        chunk_tokens = tokens[start:end]
        chunk_text = encoding.decode(chunk_tokens).strip()

        if chunk_text:
            chunks.append(chunk_text)

        start = end - chunk_overlap

    return chunks