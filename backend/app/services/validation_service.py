import json


def validate_chunk_request(text: str, strategy: str, chunk_size: int, chunk_overlap: int):
    if not text or not text.strip():
        raise ValueError("Input text cannot be empty")

    if chunk_overlap >= chunk_size:
        raise ValueError("chunk_overlap must be smaller than chunk_size")

    if strategy == "json_recursive":
        try:
            json.loads(text)
        except json.JSONDecodeError:
            raise ValueError("json_recursive strategy requires valid JSON input")

    if strategy == "markdown_header":
        if "#" not in text:
            raise ValueError("markdown_header strategy works best with Markdown headings like #, ##, ###")

    if strategy == "html_header":
        if "<h1" not in text and "<h2" not in text and "<h3" not in text:
            raise ValueError("html_header strategy requires HTML heading tags like <h1>, <h2>, or <h3>")