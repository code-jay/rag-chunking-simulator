import os
import json
import re
from dotenv import load_dotenv
from langchain_text_splitters import RecursiveCharacterTextSplitter

load_dotenv()


def fallback_llm_like_chunk(text: str, chunk_size: int, chunk_overlap: int):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", ".", " ", ""],
    )

    chunks = splitter.split_text(text)

    return [
        {
            "text": chunk,
            "metadata": {
                "type": "llm_assisted",
                "mode": "fallback_rule_based",
                "reason": "LLM disabled, used recursive chunking as fallback",
                "chunk_title": f"Chunk {index}",
            },
        }
        for index, chunk in enumerate(chunks, start=1)
    ]


def llm_assisted_chunk(text: str, chunk_size: int, chunk_overlap: int):
    llm_enabled = os.getenv("LLM_CHUNKING_ENABLED", "false").lower() == "true"

    if not llm_enabled:
        return fallback_llm_like_chunk(text, chunk_size, chunk_overlap)

    try:
        from openai import OpenAI

        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

        prompt = f"""
You are a document chunking assistant for RAG systems.

Split the document into coherent chunks for retrieval.

Rules:
- Keep related ideas together.
- Do not split examples from explanations.
- Each chunk should be useful independently.
- Return valid JSON only.
- JSON format:
[
  {{
    "title": "short title",
    "text": "chunk text",
    "reason": "why this boundary was selected"
  }}
]

Document:
{text}
"""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You split documents into retrieval-optimized chunks."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
        )

        content = response.choices[0].message.content.strip()

        content = re.sub(r"^```json", "", content)
        content = re.sub(r"```$", "", content).strip()

        parsed = json.loads(content)

        return [
            {
                "text": item.get("text", ""),
                "metadata": {
                    "type": "llm_assisted",
                    "mode": "openai",
                    "chunk_title": item.get("title", f"Chunk {index}"),
                    "reason": item.get("reason", "LLM selected this boundary"),
                },
            }
            for index, item in enumerate(parsed, start=1)
        ]

    except Exception as e:
        chunks = fallback_llm_like_chunk(text, chunk_size, chunk_overlap)

        for chunk in chunks:
            chunk["metadata"]["llm_error"] = str(e)

        return chunks