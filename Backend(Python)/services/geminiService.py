from google import genai
from config.db import db
from datetime import datetime
from dotenv import load_dotenv
import os

load_dotenv()  # loads .env into environment variables

API_KEY = os.getenv("GEMINI_API_KEY")

client = genai.Client(api_key= API_KEY)
MODEL_NAME = "gemini-2.5-flash-lite"

async def generateResponse(user_id: str, user_message: str):
    # Fetch active conversation from db
    conv = await db.conversations.find_one({
        "user_id": user_id,
        "active": True
    })
    
    # If no active convo is found, create a new conversation
    if not conv:
        conv = {
            "user_id": user_id,
            "active": True,
            "messages": [],
            "updated_at": datetime.now(),
            "created_at": datetime.now()
        }
    
    # Add the user's message to conversation
    conv["messages"].append({
        "role": "user",
        "content": user_message,
        "created_at": datetime.now(),  # ADD THIS
        "updated_at": datetime.now()
    })
    
    # Prepare messages for Gemini in the correct format
    messages_for_gemini = []
    for msg in conv["messages"]:
        messages_for_gemini.append({
            "role": msg["role"],
            "parts": [{"text": msg["content"]}]
        })
    

    # Send all messages in ONE API call
    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=messages_for_gemini
    )
    
    assistant_reply = response.text
    
    # Store assistant's reply in conversation
    conv["messages"].append({
        "role": "model",  # Gemini uses "model" instead of "assistant"
        "content": assistant_reply,
        "updated_at": datetime.now(),
        "created_at": datetime.now()
    })
    
    # Update conversation in database
    await db.conversations.update_one(
        {"user_id": user_id, "active": True},
        {"$set": conv},
        upsert=True
    )
    
    return {
        "reply": assistant_reply
    }

