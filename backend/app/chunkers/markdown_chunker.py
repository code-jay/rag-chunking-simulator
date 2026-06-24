from langchain_text_splitters import MarkdownHeaderTextSplitter


def markdown_header_chunk(text: str):
    headers_to_split_on = [
        ("#", "h1"),
        ("##", "h2"),
        ("###", "h3"),
    ]

    splitter = MarkdownHeaderTextSplitter(
        headers_to_split_on=headers_to_split_on,
        strip_headers=False
    )

    docs = splitter.split_text(text)

    return [
        {
            "text": doc.page_content,
            "metadata": doc.metadata
        }
        for doc in docs
    ]