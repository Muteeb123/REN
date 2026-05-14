from fastapi import APIRouter, HTTPException, Query
from controllers.conversationController import getConversations, closeConversation
from pydantic import BaseModel

router = APIRouter()

class CloseConversationRequest(BaseModel):
    user_id: str


@router.get("/conversations")
async def get_conversations(
    user_id: str = Query(..., description="User's unique ID"),
    page: int = Query(1, ge=1, description="Page number (starts from 1)")
):
    
    # Get conversations with smart pagination
    
    # Returns complete conversations with ALL messages.
    # - Small conversations (< 50 msgs) are grouped together
    # - Large conversations (>= 50 msgs) are sent alone
    # - Max 100 total messages per page
    
    # Example: /conversations?user_id=691985d719a05b6423f9f74b&page=1
    
    try:
        response = await getConversations(user_id, page)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/close-conversation")
async def close_active_conversation(request: CloseConversationRequest):
    
    # Close user's active conversation (set active to False)
    
    # Call this when user closes the application
    
    # Example: POST /close-conversation
    # Body: {"user_id": "691985d719a05b6423f9f74b"}
    
    try:
        response = await closeConversation(request.user_id)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))