from google import genai
from config.db import db
from datetime import datetime
from dotenv import load_dotenv
import os

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")
print(f"Loaded Gemini API Key: {API_KEY[:5]}...")  # Print first 5 characters for verification
client = genai.Client(api_key= API_KEY)
MODEL_NAME = "gemma-3-27b-it"

# System prompt for REN
SYSTEM_PROMPT = SYSTEM_PROMPT = "You are REN (Reflective Emotion Navigator), an empathetic and supportive emotional wellness assistant. Your purpose is to help users understand and navigate their emotions with compassion and insight. Use your name naturally when introducing yourself or when asked, but don't repeat it unnecessarily in every response. Respond in plain text only without asterisks or formatting symbols."

async def generateResponse(user_id: str, user_message: str):
    
    
    
    # Fetch active conversation from db
    conv = await db.conversations.find_one({
        "user_id": user_id,
        "active": True
    })
   

    messages_for_gemini = []
    new_conv = False
    
    # Determine which conversation to use
    if conv and conv.get("messages"):
        # Use existing active conversation
       
        for msg in conv["messages"]:
            messages_for_gemini.append({
                "role": msg["role"],
                "parts": [{"text": msg["content"]}]
            })
        
    else:
        # No active conversation - check for last conversation
    
        last_conv = await db.conversations.find_one(
            {"user_id": user_id, "active": False},
            sort=[("created_at", -1)]
        )

        if last_conv and last_conv.get("messages"):
            # Use last conversation as context
    
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
    
    # Send all messages in ONE API call
    try:
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=messages_for_gemini
        )
        
        print("Gemini response:2 ")
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
       
        return {
            "reply": assistant_reply
        }
    except Exception as e:
        print(f"Error generating response from Gemini: {str(e)}")
        # Return error message to user
        error_reply = "I apologize, but I encountered an error while processing your message. Please try again."
        
        # Store error message in conversation
        conv["messages"].append({
            "role": "model",
            "content": error_reply,
            "updated_at": datetime.now(),
            "created_at": datetime.now()
        })
        
        # Update timestamp
        conv["updated_at"] = datetime.now()
        
        # Update conversation in database
        try:
            await db.conversations.update_one(
                {"user_id": user_id, "active": True},
                {"$set": conv},
                upsert=True
            )
        except Exception as db_error:
            print(f"Error updating conversation in database: {str(db_error)}")
        
        return {
            "reply": error_reply,
            "error": str(e)
        }