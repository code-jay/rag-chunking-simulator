from pathlib import Path
from docx import Document


def extract_docx_text(file_path: Path) -> str:
    doc = Document(str(file_path))
    paragraphs = []

    for para in doc.paragraphs:
        if para.text.strip():
            paragraphs.append(para.text.strip())

    return "\n".join(paragraphs)