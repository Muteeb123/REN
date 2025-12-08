from fastapi import HTTPException
from services.conversationService import getConversationsWithMessages, closeActiveConversation

async def getConversations(user_id: str, page: int):
    #Controller for getting conversations with pagination
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")
    
    if page < 1:
        raise HTTPException(status_code=400, detail="page must be >= 1")
    
    try:
        response = await getConversationsWithMessages(user_id, page)
        return response
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching conversations: {str(e)}"
        )


async def closeConversation(user_id: str):
    #Controller for closing active conversation
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")
    
    try:
        response = await closeActiveConversation(user_id)
        return response
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error closing conversation: {str(e)}"
        )

