import os
import re
from functools import lru_cache

os.environ["HF_HUB_DISABLE_XET"] = "1"
os.environ["HF_HOME"] = "./.hf_cache"
os.environ["TRANSFORMERS_CACHE"] = "./.hf_cache"

from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

@lru_cache(maxsize=1)
def get_model():
    return SentenceTransformer(
        "sentence-transformers/all-MiniLM-L6-v2",
        cache_folder="./models"
    )


def split_into_sentences(text: str):
    sentences = re.split(r"(?<=[.!?])\s+", text)
    return [s.strip() for s in sentences if s.strip()]


def semantic_similarity_chunk(
    text: str,
    similarity_threshold: float = 0.70,
    min_sentences: int = 2
):
    sentences = split_into_sentences(text)

    if len(sentences) <= 1:
        return [text]

    model = get_model()
    embeddings = model.encode(sentences)

    chunks = []
    current_chunk = [sentences[0]]

    for i in range(1, len(sentences)):
        similarity = cosine_similarity(
            embeddings[i - 1].reshape(1, -1),
            embeddings[i].reshape(1, -1)
        )[0][0]

        if similarity >= similarity_threshold or len(current_chunk) < min_sentences:
            current_chunk.append(sentences[i])
        else:
            chunks.append({
                "text": " ".join(current_chunk),
                "metadata": {
                    "type": "semantic",
                    "break_reason": "topic_shift",
                    "similarity_score": round(float(similarity), 4)
                }
            })
            current_chunk = [sentences[i]]

    if current_chunk:
        chunks.append({
            "text": " ".join(current_chunk),
            "metadata": {
                "type": "semantic",
                "break_reason": "end_of_document"
            }
        })

    return chunks