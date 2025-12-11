from google import genai
from config.db import db
from datetime import datetime
from dotenv import load_dotenv
import os

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")
print("Loaded GEMINI_API_KEY:", API_KEY)
client = genai.Client(api_key= API_KEY)
MODEL_NAME = "gemma-3-27b-it"

# System prompt for REN
SYSTEM_PROMPT = SYSTEM_PROMPT = "You are REN (Reflective Emotion Navigator), an empathetic and supportive emotional wellness assistant. Your purpose is to help users understand and navigate their emotions with compassion and insight. Use your name naturally when introducing yourself or when asked, but don't repeat it unnecessarily in every response. Respond in plain text only without asterisks or formatting symbols."

async def generateResponse(user_id: str, user_message: str):
    print("Generating response for user_id:", user_id)
    
    # Fetch active conversation from db
    conv = await db.conversations.find_one({
        "user_id": user_id,
        "active": True
    })
    print("Fetched conversation from database:", conv)

    messages_for_gemini = []
    new_conv = False
    
    # Determine which conversation to use
    if conv and conv.get("messages"):
        # Use existing active conversation
        print("Using active conversation")
        for msg in conv["messages"]:
            messages_for_gemini.append({
                "role": msg["role"],
                "parts": [{"text": msg["content"]}]
            })
        
    else:
        # No active conversation - check for last conversation
        print("No active conversation found, checking for last conversation")
        last_conv = await db.conversations.find_one(
            {"user_id": user_id, "active": False},
            sort=[("created_at", -1)]
        )

        if last_conv and last_conv.get("messages"):
            # Use last conversation as context
            print("Using last conversation as context")
            for msg in last_conv["messages"]:
                messages_for_gemini.append({
                    "role": msg["role"],
                    "parts": [{"text": msg["content"]}]
                })
            # Create new active conversation
            conv = {
                "user_id": user_id,
                "active": True,
                "messages": [],
                "updated_at": datetime.now(),
                "created_at": datetime.now()
            }
            conv["messages"].append({
                "role": "model",
                "content": "Hi, I am REN, your emotional wellness assistant. How can I support you today?",
                "created_at": datetime.now(),
                "updated_at": datetime.now()
            })
        else:
            # Brand new user - add system prompt
            print("No previous conversation found, initializing with system prompt")
            new_conv = True
            messages_for_gemini.append({
                "role": "user",
                "parts": [{"text": SYSTEM_PROMPT}]
            })
            messages_for_gemini.append({
                "role": "model",
                "parts": [{"text": "I understand. I'm here to support you with empathy and understanding. How can I help you today?"}]
            })
            # Create new conversation
            conv = {
                "user_id": user_id,
                "active": True,
                "messages": [],
                "updated_at": datetime.now(),
                "created_at": datetime.now()
            }
            conv["messages"].append({
                "role": "model",
                "content": "Hi, I am REN, your emotional wellness assistant. How can I support you today?",
                "created_at": datetime.now(),
                "updated_at": datetime.now()
            })
    
    # Add current user message to conversation
    current_msg = {
        "role": "user",
        "content": user_message,
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }
    conv["messages"].append(current_msg)
    
    # Add current message to Gemini API call
    messages_for_gemini.append({
        "role": "user",
        "parts": [{"text": user_message}]
    })
    
    print("Sending messages to Gemini API:", len(messages_for_gemini), "messages")

    # Send all messages in ONE API call
    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=messages_for_gemini
    )
    print("Received response from Gemini API")
    assistant_reply = response.text
    
    # Store assistant's reply in conversation
    conv["messages"].append({
        "role": "model",
        "content": assistant_reply,
        "updated_at": datetime.now(),
        "created_at": datetime.now()
    })
    
    # Update timestamp
    conv["updated_at"] = datetime.now()
    
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