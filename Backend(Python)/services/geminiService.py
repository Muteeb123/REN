from google import genai
from config.db import db
from datetime import datetime
from dotenv import load_dotenv
from bson import ObjectId
import os

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")
print(f"Loaded Gemini API Key: {API_KEY[:5]}...")
client = genai.Client(api_key=API_KEY)
MODEL_NAME = "gemma-3-27b-it"

BASE_SYSTEM_PROMPT = (
    "You are REN (Reflective Emotion Navigator), an empathetic and supportive "
    "emotional wellness assistant. Your purpose is to help users understand and "
    "navigate their emotions with compassion and insight. Use your name naturally "
    "when introducing yourself or when asked, but don't repeat it unnecessarily "
    "in every response. Respond in plain text only without asterisks or formatting symbols."
)


async def _get_llm_context(user_id: str) -> str:
    """
    Fetch the pre-computed llmContext string from AggregatedEmotion.
    Returns an empty string silently if no record exists or on any DB error,
    so a missing aggregation never breaks the conversation.
    """
    try:
        doc = await db.aggregatedemotions.find_one(
            {"userId": ObjectId(user_id)},
            {"llmContext": 1, "_id": 0},
        )
        return (doc or {}).get("llmContext", "")
    except Exception as exc:
        print(f"[geminiService] Could not fetch llmContext for {user_id}: {exc}")
        return ""


def _build_system_prompt(llm_context: str) -> str:
    """
    Append the emotion context sentence to the base prompt when available.
    """
    if not llm_context:
        return BASE_SYSTEM_PROMPT
    return f"{BASE_SYSTEM_PROMPT} {llm_context}"


async def generateResponse(user_id: str, user_message: str):

    # ── 1. Fetch emotion context (best-effort, never blocks) ─────────────────
    llm_context = await _get_llm_context(user_id)
    system_prompt = _build_system_prompt(llm_context)
    print(f"[geminiService] Using system prompt for {user_id}: {system_prompt}]...")

    # ── 2. Fetch active conversation ─────────────────────────────────────────
    conv = await db.conversations.find_one({
        "user_id": user_id,
        "active": True,
    })

    messages_for_gemini = []

    # ── 3. Build message history ──────────────────────────────────────────────
    if conv and conv.get("messages"):
        # Existing active conversation — replay history
        for msg in conv["messages"]:
            messages_for_gemini.append({
                "role": msg["role"],
                "parts": [{"text": msg["content"]}],
            })

    else:
        # No active conversation — look for most recent closed one
        last_conv = await db.conversations.find_one(
            {"user_id": user_id, "active": False},
            sort=[("created_at", -1)],
        )

        if last_conv and last_conv.get("messages"):
            for msg in last_conv["messages"]:
                messages_for_gemini.append({
                    "role": msg["role"],
                    "parts": [{"text": msg["content"]}],
                })

        else:
            # Brand-new user — seed with system prompt exchange
            messages_for_gemini.append({
                "role": "user",
                "parts": [{"text": system_prompt}],
            })
            messages_for_gemini.append({
                "role": "model",
                "parts": [{"text": "I understand. I'm here to support you with empathy and understanding. How can I help you today?"}],
            })

        # Create a fresh active conversation document
        conv = {
            "user_id": user_id,
            "active": True,
            "messages": [{
                "role": "model",
                "content": "Hi, I am REN, your emotional wellness assistant. How can I support you today?",
                "created_at": datetime.now(),
                "updated_at": datetime.now(),
            }],
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        }

    # ── 4. Append the current user message ───────────────────────────────────
    conv["messages"].append({
        "role": "user",
        "content": user_message,
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
    })
    messages_for_gemini.append({
        "role": "user",
        "parts": [{"text": user_message}],
    })

    # ── 5. Call Gemini ────────────────────────────────────────────────────────
    try:
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=messages_for_gemini,
        )
        assistant_reply = response.text

        conv["messages"].append({
            "role": "model",
            "content": assistant_reply,
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        })
        conv["updated_at"] = datetime.now()

        await db.conversations.update_one(
            {"user_id": user_id, "active": True},
            {"$set": conv},
            upsert=True,
        )

        return {"reply": assistant_reply}

    except Exception as e:
        print(f"[geminiService] Error generating response: {e}")
        error_reply = "I apologize, but I encountered an error while processing your message. Please try again."

        conv["messages"].append({
            "role": "model",
            "content": error_reply,
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        })
        conv["updated_at"] = datetime.now()

        try:
            await db.conversations.update_one(
                {"user_id": user_id, "active": True},
                {"$set": conv},
                upsert=True,
            )
        except Exception as db_error:
            print(f"[geminiService] Error persisting error reply: {db_error}")

        return {"reply": error_reply, "error": str(e)}