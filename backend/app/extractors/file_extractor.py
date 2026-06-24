import json
import pandas as pd
from pathlib import Path

from app.extractors.pdf_extractor import extract_pdf_text
from app.extractors.docx_extractor import extract_docx_text


TEXT_EXTENSIONS = [".txt", ".md", ".html", ".htm", ".py", ".js", ".ts", ".tsx", ".jsx"]


def extract_text_from_file(file_path: Path) -> str:
    suffix = file_path.suffix.lower()

    if suffix in TEXT_EXTENSIONS:
        return file_path.read_text(encoding="utf-8", errors="ignore")

    if suffix == ".pdf":
        return extract_pdf_text(file_path)

    if suffix == ".docx":
        return extract_docx_text(file_path)

    if suffix == ".json":
        data = json.loads(file_path.read_text(encoding="utf-8", errors="ignore"))
        return json.dumps(data, indent=2)

    if suffix == ".csv":
        df = pd.read_csv(file_path)
        return df.to_csv(index=False)

    raise ValueError(f"Unsupported file type: {suffix}")