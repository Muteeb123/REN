from fastapi import APIRouter, HTTPException, Request
from controllers.geminiController import generateText
from pydantic import BaseModel

router = APIRouter()

class UserMessage(BaseModel):
    user_id: str
    message: str

@router.post("/generateText")
async def chat(msg: UserMessage):
    try:
        response = await generateText(msg.user_id, msg.message)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))