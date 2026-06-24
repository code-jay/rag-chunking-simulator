from fastapi import APIRouter, HTTPException
from app.models.request_models import ChunkRequest
from app.services.chunk_service import chunk_text, get_supported_strategies

router = APIRouter()


@router.get("/strategies")
def strategies():
    return {
        "strategies": get_supported_strategies()
    }


@router.post("/chunk")
def chunk_document(request: ChunkRequest):
    try:
        return chunk_text(
            text=request.text,
            strategy=request.strategy,
            chunk_size=request.chunk_size,
            chunk_overlap=request.chunk_overlap
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))