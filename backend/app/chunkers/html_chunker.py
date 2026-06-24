from langchain_text_splitters import HTMLHeaderTextSplitter


def html_header_chunk(text: str):
    headers_to_split_on = [
        ("h1", "h1"),
        ("h2", "h2"),
        ("h3", "h3"),
    ]

    splitter = HTMLHeaderTextSplitter(
        headers_to_split_on=headers_to_split_on
    )

    docs = splitter.split_text(text)

    return [
        {
            "text": doc.page_content,
            "metadata": doc.metadata
        }
        for doc in docs
    ]