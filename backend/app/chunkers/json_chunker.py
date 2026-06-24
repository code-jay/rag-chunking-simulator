import json
from langchain_text_splitters import RecursiveJsonSplitter


def json_chunk(text: str, max_chunk_size: int):
    try:
        data = json.loads(text)
    except json.JSONDecodeError as e:
        raise ValueError(
            f"Invalid JSON input. Recursive JSON chunking only works with valid JSON. Error: {e.msg}"
        )

    splitter = RecursiveJsonSplitter(max_chunk_size=max_chunk_size)

    json_chunks = splitter.split_json(json_data=data)

    return [
        {
            "text": json.dumps(chunk, indent=2),
            "metadata": {
                "type": "json",
                "chunking": "recursive_json"
            }
        }
        for chunk in json_chunks
    ]