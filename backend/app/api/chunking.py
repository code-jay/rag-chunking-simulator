from fastapi import APIRouter, HTTPException
from app.models.request_models import ChunkRequest
from app.services.chunk_service import chunk_text, get_supported_strategies
from app.services.recommendation_service import recommend_strategy

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
            chunk_overlap=request.chunk_overlap,
            similarity_threshold=request.similarity_threshold
        )
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(
            status_code=400,
            detail=f"{type(e).__name__}: {str(e)}"
        )
    
@router.post("/recommend-strategy")
def recommend_chunking_strategy(request: ChunkRequest):
    try:
        return recommend_strategy(request.text)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))