import json
import re


def recommend_strategy(text: str):
    text_lower = text.lower()
    length = len(text)
    paragraphs = [p for p in text.split("\n\n") if p.strip()]
    sentences = re.split(r"(?<=[.!?])\s+", text)

    if text.strip().startswith("{") or text.strip().startswith("["):
        try:
            json.loads(text)
            return {
                "recommended_strategy": "json_recursive",
                "confidence": "high",
                "reason": "Input is valid JSON, so Recursive JSON Chunking is best."
            }
        except Exception:
            pass

    if "#" in text[:500]:
        return {
            "recommended_strategy": "markdown_header",
            "confidence": "high",
            "reason": "Document contains Markdown headings."
        }

    if "<h1" in text_lower or "<h2" in text_lower or "<h3" in text_lower:
        return {
            "recommended_strategy": "html_header",
            "confidence": "high",
            "reason": "Document contains HTML heading tags."
        }

    if "def " in text or "class " in text:
        return {
            "recommended_strategy": "python_code",
            "confidence": "medium",
            "reason": "Document looks like Python source code."
        }

    if "function " in text or "const " in text or "let " in text:
        return {
            "recommended_strategy": "javascript_code",
            "confidence": "medium",
            "reason": "Document looks like JavaScript/TypeScript source code."
        }

    if len(paragraphs) >= 3 and len(sentences) >= 8:
        return {
            "recommended_strategy": "semantic_similarity",
            "confidence": "medium",
            "reason": "Document has multiple paragraphs and enough sentences for topic-shift detection."
        }

    if length > 1000:
        return {
            "recommended_strategy": "recursive",
            "confidence": "high",
            "reason": "General long-form text works well with Recursive Character Chunking."
        }

    return {
        "recommended_strategy": "paragraph",
        "confidence": "medium",
        "reason": "Short structured text can be chunked cleanly by paragraphs."
    }