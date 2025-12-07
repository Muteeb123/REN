from services.geminiService import generateResponse
from config.db import db
from fastapi import HTTPException

async def generateText(user_id: str, message: str):
    if not user_id or not message:
        raise HTTPException(status_code=400,
                            detail = "Both user_id and message are required.")
    
    try:
        response = await generateResponse(user_id, message)
        return response
    except Exception as e:
        raise HTTPException(status_code=500,
                            detail = f"Error generating response: {str(e)}")