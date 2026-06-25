from langchain_text_splitters import RecursiveCharacterTextSplitter


def parent_child_chunk(
    text: str,
    parent_chunk_size: int = 2000,
    parent_chunk_overlap: int = 200,
    child_chunk_size: int = 500,
    child_chunk_overlap: int = 80,
):
    parent_splitter = RecursiveCharacterTextSplitter(
        chunk_size=parent_chunk_size,
        chunk_overlap=parent_chunk_overlap,
        separators=["\n\n", "\n", ".", " ", ""],
    )

    child_splitter = RecursiveCharacterTextSplitter(
        chunk_size=child_chunk_size,
        chunk_overlap=child_chunk_overlap,
        separators=["\n\n", "\n", ".", " ", ""],
    )

    parent_chunks = parent_splitter.split_text(text)

    result = []

    for parent_index, parent_text in enumerate(parent_chunks, start=1):
        child_chunks = child_splitter.split_text(parent_text)

        for child_index, child_text in enumerate(child_chunks, start=1):
            result.append({
                "text": child_text,
                "metadata": {
                    "type": "parent_child",
                    "parent_id": f"parent_{parent_index}",
                    "child_id": f"parent_{parent_index}_child_{child_index}",
                    "parent_index": parent_index,
                    "child_index": child_index,
                    "parent_text_preview": parent_text[:300],
                    "retrieval_role": "child",
                    "context_role": "parent",
                }
            })

    return result