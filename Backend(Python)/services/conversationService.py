from config.db import db
from bson import ObjectId
from datetime import datetime
from typing import List, Dict

# async def getConversationsWithMessages(user_id: str, page: int = 1, max_messages_per_page: int = 100):
    
#     # Smart pagination: Send complete conversations with ALL their messages.
    
#     # Logic:
#     # - If a conversation has < 50 messages, try to fit multiple conversations in one page
#     # - If a conversation has >= 50 messages, send it alone
#     # - Never exceed max_messages_per_page total messages in one response
    
#     # Args:
#     #     user_id: User's ID
#     #     page: Page number (starts from 1)
#     #     max_messages_per_page: Maximum total messages to send per page (default: 100)
    
#     # Returns:
#     #     Dictionary with conversations and pagination info
    
    
#     # Get all user conversations sorted by most recent
#     all_conversations = await db.conversations.find(
#         {"user_id": user_id}
#     ).sort("updated_at", -1).to_list(length=None)
    
#     if not all_conversations:
#         return {
#             "success": True,
#             "conversations": [],
#             "pagination": {
#                 "current_page": 1,
#                 "total_pages": 1,
#                 "has_next_page": False,
#                 "has_previous_page": False,
#                 "total_conversations": 0
#             }
#         }
    
#     # Group conversations into pages based on message count
#     pages = []
#     current_page_conversations = []
#     current_page_message_count = 0
    
#     for conv in all_conversations:
#         message_count = len(conv.get("messages", []))
        
#         # If this conversation alone exceeds or equals 50 messages
#         if message_count >= 10:
#             # If current page has conversations, save it first
#             if current_page_conversations:
#                 pages.append(current_page_conversations)
#                 current_page_conversations = []
#                 current_page_message_count = 0
            
#             # Add this large conversation as its own page
#             pages.append([conv])
        
#         # If adding this conversation keeps us under the limit
#         elif current_page_message_count + message_count <= max_messages_per_page:
#             current_page_conversations.append(conv)
#             current_page_message_count += message_count
        
#         # If adding this would exceed the limit
#         else:
#             # Save current page
#             if current_page_conversations:
#                 pages.append(current_page_conversations)
            
#             # Start new page with this conversation
#             current_page_conversations = [conv]
#             current_page_message_count = message_count
    
#     # Don't forget the last page
#     if current_page_conversations:
#         pages.append(current_page_conversations)
    
#     # Handle invalid page number
#     total_pages = len(pages)
#     if page < 1:
#         page = 1
#     if page > total_pages:
#         page = total_pages if total_pages > 0 else 1
    
#     # Get conversations for requested page
#     page_index = page - 1
#     conversations_to_send = pages[page_index] if page_index < len(pages) else []
    
#     # Format conversations for response
#     formatted_conversations = []
#     for conv in conversations_to_send:
#         formatted_conversations.append({
#             "conversation_id": str(conv["_id"]),
#             "active": conv.get("active", False),
#             "created_at": conv.get("created_at"),
#             "updated_at": conv.get("updated_at"),
#             "message_count": len(conv.get("messages", [])),
#             "messages": conv.get("messages", [])  # ALL messages
#         })
    
#     return {
#         "success": True,
#         "conversations": formatted_conversations,
#         "pagination": {
#             "current_page": page,
#             "total_pages": total_pages,
#             "has_next_page": page < total_pages,
#             "has_previous_page": page > 1,
#             "total_conversations": len(all_conversations),
#             "conversations_in_this_page": len(formatted_conversations)
#         }
#     }

async def getConversationsWithMessages(user_id: str, page: int = 1, messages_per_page: int = 10):
    """
    Paginate through messages across all conversations.
    Returns 10 messages per page, regardless of which conversation they belong to.
    
    Args:
        user_id: User's ID
        page: Page number (starts from 1)
        messages_per_page: Number of messages per page (default: 10)
    
    Returns:
        Dictionary with messages and pagination info
    """
    
    # Get all user conversations sorted by most recent
    all_conversations = await db.conversations.find(
        {"user_id": user_id}
    ).sort("updated_at", -1).to_list(length=None)
    
    if not all_conversations:
        return {
            "success": True,
            "messages": [],
            "pagination": {
                "current_page": 1,
                "total_pages": 1,
                "has_next_page": False,
                "has_previous_page": False,
                "total_messages": 0,
                "messages_per_page": messages_per_page
            }
        }
    
    # Flatten all messages from all conversations with metadata
    all_messages = []
    for conv in all_conversations:
        conversation_id = str(conv["_id"])
        messages = conv.get("messages", [])
        
        for msg in messages:
            all_messages.append({
                "conversation_id": conversation_id,
                "conversation_active": conv.get("active", False),
                "conversation_created_at": conv.get("created_at"),
                "conversation_updated_at": conv.get("updated_at"),
                "role": msg.get("role"),
                "content": msg.get("content"),
                "created_at": msg.get("created_at"),
                "updated_at": msg.get("updated_at")
            })
    
    # Calculate pagination
    all_messages.sort(key=lambda x: x["created_at"], reverse=True)  
    total_messages = len(all_messages)
    total_pages = (total_messages + messages_per_page - 1) // messages_per_page  # Ceiling division
    
    # Handle invalid page number
    if page < 1:
        page = 1
    if page > total_pages and total_pages > 0:
        page = total_pages
    
    # Get messages for the requested page
    start_index = (page - 1) * messages_per_page
    end_index = start_index + messages_per_page
    messages_to_send = all_messages[start_index:end_index]
    
    return {
        "success": True,
        "messages": messages_to_send,
        "pagination": {
            "current_page": page,
            "total_pages": total_pages,
            "has_next_page": page < total_pages,
            "has_previous_page": page > 1,
            "total_messages": total_messages,
            "messages_per_page": messages_per_page,
            "showing": {
                "from": start_index + 1 if total_messages > 0 else 0,
                "to": min(end_index, total_messages),
                "count": len(messages_to_send)
            }
        }
    }



async def closeActiveConversation(user_id: str):
    
    # Close user's active conversation by setting active to False
    
    result = await db.conversations.update_one(
        {
            "user_id": user_id,
            "active": True
        },
        {
            "$set": {
                "active": False,
                "closed_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    print("result of closeActiveConversation:", result)

    if result.modified_count == 0:
        return {
            "success": True,
            "message": "No active conversation found"
        }
    
    return {
        "success": True,
        "message": "Active conversation closed successfully"
    }

