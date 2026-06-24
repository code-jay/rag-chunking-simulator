from pathlib import Path
from fastapi import APIRouter, UploadFile, File, Form, HTTPException

from app.extractors.file_extractor import extract_text_from_file
from app.services.chunk_service import chunk_text

router = APIRouter()

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


@router.post("/upload-and-chunk")
async def upload_and_chunk(
    file: UploadFile = File(...),
    strategy: str = Form("recursive"),
    chunk_size: int = Form(800),
    chunk_overlap: int = Form(120)
):
    try:
        file_path = UPLOAD_DIR / file.filename

        content = await file.read()
        file_path.write_bytes(content)

        extracted_text = extract_text_from_file(file_path)

        result = chunk_text(
            text=extracted_text,
            strategy=strategy,
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap
        )

        result["file"] = {
            "filename": file.filename,
            "content_type": file.content_type,
            "extracted_characters": len(extracted_text)
        }

        return result

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))