from fastapi import APIRouter, HTTPException
from app.models.request_models import CompareRequest
from app.services.chunk_service import chunk_text

router = APIRouter()


@router.post("/compare")
def compare_strategies(request: CompareRequest):
    results = []

    for strategy in request.strategies:
        try:
            result = chunk_text(
                text=request.text,
                strategy=strategy,
                chunk_size=request.chunk_size,
                chunk_overlap=request.chunk_overlap
            )

            results.append({
                "strategy": strategy,
                "stats": result["stats"]
            })

        except Exception as e:
            results.append({
                "strategy": strategy,
                "error": str(e)
            })

    return {
        "chunk_size": request.chunk_size,
        "chunk_overlap": request.chunk_overlap,
        "results": results
    }