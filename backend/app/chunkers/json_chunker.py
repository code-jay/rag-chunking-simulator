import json
from langchain_text_splitters import RecursiveJsonSplitter


def json_chunk(text: str, max_chunk_size: int):
    data = json.loads(text)

    splitter = RecursiveJsonSplitter(
        max_chunk_size=max_chunk_size
    )

    docs = splitter.create_documents(texts=[data])

    return [
        {
            "text": doc.page_content,
            "metadata": doc.metadata
        }
        for doc in docs
    ]