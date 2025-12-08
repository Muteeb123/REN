from google import genai
from config.db import db

client = genai.Client(api_key="AIzaSyBbhTzOa19M8amMJj-jHzJ4WXsW14SqaQQ")
MODEL_NAME = "gemma-3-27b-it"

async def generateResponse(user_id: str, user_message: str):

    print("Generating response for user_id:", user_id)
    # Fetch active conversation from db
    conv = await db.conversations.find_one({
        "user_id": user_id,
        "active": True
    })
    
    # If no active convo is found, create a new conversation

    print("Current conversation state:", conv)
    if not conv:
        conv = {
            "user_id": user_id,
            "active": True,
            "messages": []
        }
    
    # Add the user's message to conversation
    conv["messages"].append({
        "role": "user",
        "content": user_message
    })
    
    # Prepare messages for Gemini in the correct format
    print("Preparing messages for Gemini API")
    messages_for_gemini = []
    for msg in conv["messages"]:
        messages_for_gemini.append({
            "role": msg["role"],
            "parts": [{"text": msg["content"]}]
        })
    
    print("Messages formatted for Gemini API:", messages_for_gemini)
    # Send all messages in ONE API call
    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=messages_for_gemini
    )
    print("Received response from Gemini API:", response)
    assistant_reply = response.text
    
    # Store assistant's reply in conversation
    conv["messages"].append({
        "role": "model",  # Gemini uses "model" instead of "assistant"
        "content": assistant_reply
    })
    
    # Update conversation in database
    await db.conversations.update_one(
        {"user_id": user_id, "active": True},
        {"$set": conv},
        upsert=True
    )
    print("Updated conversation in database for user_id:", user_id)
    return {
        "reply": assistant_reply
    }