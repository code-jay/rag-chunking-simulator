from pathlib import Path
from pypdf import PdfReader


def extract_pdf_text(file_path: Path) -> str:
    reader = PdfReader(str(file_path))
    pages = []

    for page_number, page in enumerate(reader.pages, start=1):
        text = page.extract_text()
        if text:
            pages.append(f"\n\n--- Page {page_number} ---\n{text}")

    return "\n".join(pages)