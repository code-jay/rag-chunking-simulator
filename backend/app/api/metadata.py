from fastapi import APIRouter
from pydantic import BaseModel
from typing import Any, Dict, List


router = APIRouter()


class MetadataFilterRequest(BaseModel):
    chunks: List[Dict[str, Any]]
    filters: Dict[str, Any]


@router.post("/metadata-filter")
def metadata_filter(request: MetadataFilterRequest):
    filtered_chunks = []

    for chunk in request.chunks:
        metadata = chunk.get("metadata", {})

        is_match = True

        for key, expected_value in request.filters.items():
            if metadata.get(key) != expected_value:
                is_match = False
                break

        if is_match:
            filtered_chunks.append(chunk)

    return {
        "total_input_chunks": len(request.chunks),
        "total_filtered_chunks": len(filtered_chunks),
        "filters_applied": request.filters,
        "chunks": filtered_chunks
    }