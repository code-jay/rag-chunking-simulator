from langchain_text_splitters import RecursiveCharacterTextSplitter, Language


def python_code_chunk(text: str, chunk_size: int, chunk_overlap: int):
    splitter = RecursiveCharacterTextSplitter.from_language(
        language=Language.PYTHON,
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap
    )

    chunks = splitter.split_text(text)

    return [
        {
            "text": chunk,
            "metadata": {
                "language": "python",
                "type": "code"
            }
        }
        for chunk in chunks
    ]


def javascript_code_chunk(text: str, chunk_size: int, chunk_overlap: int):
    splitter = RecursiveCharacterTextSplitter.from_language(
        language=Language.JS,
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap
    )

    chunks = splitter.split_text(text)

    return [
        {
            "text": chunk,
            "metadata": {
                "language": "javascript",
                "type": "code"
            }
        }
        for chunk in chunks
    ]