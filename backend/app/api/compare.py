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


@router.post("/compare-recursive-semantic")
def compare_recursive_semantic(request: CompareRequest):
    try:
        recursive_result = chunk_text(
            text=request.text,
            strategy="recursive",
            chunk_size=request.chunk_size,
            chunk_overlap=request.chunk_overlap
        )

        semantic_result = chunk_text(
            text=request.text,
            strategy="semantic_similarity",
            chunk_size=request.chunk_size,
            chunk_overlap=request.chunk_overlap
        )

        return {
            "recursive": recursive_result,
            "semantic": semantic_result
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))