from typing import Any
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from services.sentimentService import analyze_text

router = APIRouter(tags=["Sentiment"])

class AnalyzeRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Text to analyze")

@router.post("/analyze", status_code=status.HTTP_200_OK)
async def analyze(payload: AnalyzeRequest) -> dict[str, Any]:
    try:
        result = analyze_text(payload.text)
        return {"result": result}
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)) from exc
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unexpected error while analyzing text"
        )