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
MODEL_NAME = "gemma-4-31b-it"

# ---------------------------------------------------------------------------
# SYSTEM PROMPT BUILDER
# ---------------------------------------------------------------------------
 
def _build_system_prompt(
    llm_context: str = "",
    user_name: str = "",
    user_age: int | None = None,
) -> str:
    """
    Builds a rich, structured system prompt for REN.
 
    The prompt is split into clear sections so Gemini can parse and apply
    each piece of context independently:
 
      1. Identity & Role        – who REN is and its communication style
      2. User Profile           – name and age so responses feel personal
      3. Emotional Context      – aggregated emotion data from Reddit activity
      4. Behavioural Guidelines – exactly how to use the above context
    """
 
    # ── Section 1: Identity ──────────────────────────────────────────────────
    identity = (
        "You are REN (Reflective Emotion Navigator), an empathetic and supportive "
        "emotional wellness assistant. Your purpose is to help users understand and "
        "navigate their emotions with compassion and insight. "
        "Use your name naturally when introducing yourself or when asked, but do not "
        "repeat it unnecessarily. "
        "Respond in plain, warm, conversational text. Never use asterisks, markdown "
        "formatting symbols, bullet points, or headers in your replies."
    )
 
    # ── Section 2: User Profile ──────────────────────────────────────────────
    profile_parts = []
    if user_name:
        profile_parts.append(f"The user's name is {user_name}.")
    if user_age is not None:
        profile_parts.append(
            f"The user is {user_age} years old. "
            "Calibrate the vocabulary, tone, and examples you use to suit "
            "someone of this age."
        )
 
    profile_section = (
        "USER PROFILE:\n" + " ".join(profile_parts)
        if profile_parts
        else ""
    )
 
    # ── Section 3: Emotional Context ─────────────────────────────────────────
    # llm_context is a pre-computed sentence from AggregatedEmotion, e.g.:
    # "The user's dominant emotion is sadness (62%). Other notable emotions
    #  include anxiety (18%) and loneliness (12%), inferred from recent Reddit
    #  activity."
    emotion_section = (
        f"EMOTIONAL CONTEXT (derived from the user's recent Reddit activity):\n{llm_context}"
        if llm_context
        else ""
    )
 
    # ── Section 4: Behavioural Guidelines ────────────────────────────────────
    guidelines = (
        "BEHAVIOURAL GUIDELINES:\n"
        "1. Personalisation: Address the user by their first name occasionally "
        "   (not every message) to create warmth without feeling repetitive.\n"
        "2. Emotion-awareness: The emotional context above reflects patterns "
        "   detected across the user's online activity. Treat it as background "
        "   awareness — let it inform your empathy and the questions you ask, "
        "   but do NOT mention Reddit, the analysis, or any specific percentages "
        "   to the user unless they bring it up themselves.\n"
        "3. Conversation continuity: The conversation history below contains the "
        "   user's previous messages. Build on what has already been said. Avoid "
        "   repeating advice or observations you have already made.\n"
        "4. Age-appropriateness: Adapt your language, cultural references, and "
        "   examples to the user's age. For teenagers use relatable, casual language; "
        "   for adults be more measured and nuanced.\n"
        "5. Tone: Be warm, non-judgmental, and curious. Ask one open-ended follow-up "
        "   question per response to gently encourage the user to explore their "
        "   feelings further. Never be preachy or prescriptive.\n"
        "6. Safety: If the user expresses thoughts of self-harm or a mental health "
        "   crisis, respond with compassion and strongly encourage them to contact a "
        "   professional or a crisis helpline. Do not attempt to handle crises alone.\n"
        "7. Boundaries: You are a wellness companion, not a therapist or medical "
        "   professional. Gently remind the user of this when they ask for clinical "
        "   diagnoses or prescriptions."
    )
 
    # ── Assemble final prompt ─────────────────────────────────────────────────
    sections = [identity]
    if profile_section:
        sections.append(profile_section)
    if emotion_section:
        sections.append(emotion_section)
    sections.append(guidelines)
 
    return "\n\n".join(sections)


async def _get_user_profile(user_id: str) -> dict:
    """
    Fetch the user's name and age from the users collection.
    Returns an empty dict silently on any error.
 
    Assumes your users collection has at minimum:
        { _id: ObjectId, name: str, age: int }
 
    Adjust field names below to match your actual schema.
    """
    try:
        user = await db.users.find_one(
            {"_id": ObjectId(user_id)},
            {"name": 1, "age": 1, "_id": 0},
        )
        return user or {}
    except Exception as exc:
        print(f"[geminiService] Could not fetch user profile for {user_id}: {exc}")
        return {}


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



async def generateResponse(user_id: str, user_message: str):
 
    # ── 1. Gather all context in parallel (best-effort) ──────────────────────
    import asyncio
    llm_context, user_profile = await asyncio.gather(
        _get_llm_context(user_id),
        _get_user_profile(user_id),
    )
 
    user_name: str = user_profile.get("name", "")
    user_age: int | None = user_profile.get("age")  # None if not set
 
    system_prompt = _build_system_prompt(
        llm_context=llm_context,
        user_name=user_name,
        user_age=user_age,
    )
    print(f"[geminiService] System prompt for {user_id}:\n{system_prompt}\n")
 
    # ── 2. Fetch active conversation ─────────────────────────────────────────
    conv = await db.conversations.find_one({
        "user_id": user_id,
        "active": True,
    })
 
    messages_for_gemini = []
    is_brand_new_user = False
 
    # ── 3. Build message history ──────────────────────────────────────────────
    if conv and conv.get("messages"):
        # Active conversation exists — replay its history for Gemini
        for msg in conv["messages"]:
            messages_for_gemini.append({
                "role": msg["role"],          # "user" | "model"
                "parts": [{"text": msg["content"]}],
            })
 
    else:
        # No active conversation — look for the most recent closed one
        last_conv = await db.conversations.find_one(
            {"user_id": user_id, "active": False},
            sort=[("created_at", -1)],
        )
 
        if last_conv and last_conv.get("messages"):
            # Carry forward the previous conversation context
            for msg in last_conv["messages"]:
                messages_for_gemini.append({
                    "role": msg["role"],
                    "parts": [{"text": msg["content"]}],
                })
        else:
            # Truly brand-new user — seed with a system prompt exchange so
            # Gemini understands its role before the first real message.
            # NOTE: Gemini's /generateContent API does not have a dedicated
            # system role, so we use a user/model pair as the standard
            # workaround to inject the system prompt into the context window.
            is_brand_new_user = True
            messages_for_gemini.append({
                "role": "user",
                "parts": [{"text": system_prompt}],
            })
            messages_for_gemini.append({
                "role": "model",
                "parts": [{"text": (
                    "Understood. I'll keep all of that in mind as I support "
                    "this user with empathy and care."
                )}],
            })
 
        # ── Greeting message stored in DB for the new conversation ────────────
        greeting = _build_greeting(user_name)
        conv = {
            "user_id": user_id,
            "active": True,
            "messages": [{
                "role": "model",
                "content": greeting,
                "created_at": datetime.now(),
                "updated_at": datetime.now(),
            }],
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        }
 
    # ── 4. Re-inject system prompt at the START of every request ─────────────
    # This ensures Gemini always has the freshest emotional context and user
    # profile even in ongoing conversations, because the context window is
    # stateless between API calls.
    #
    # We prepend a lightweight "context refresh" pair BEFORE the conversation
    # history so it doesn't pollute the user-visible chat log.
    if not is_brand_new_user:
        context_refresh = [
            {
                "role": "user",
                "parts": [{"text": (
                    f"[CONTEXT REFRESH — not visible to end user]\n{system_prompt}"
                )}],
            },
            {
                "role": "model",
                "parts": [{"text": "Context noted. Continuing the conversation."}],
            },
        ]
        messages_for_gemini = context_refresh + messages_for_gemini
 
    # ── 5. Append the current user message ───────────────────────────────────
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
 
    # ── 6. Call Gemini ────────────────────────────────────────────────────────
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
        error_reply = (
            "I'm sorry, I ran into a problem while processing your message. "
            "Please try again in a moment."
        )
 
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
 
 
# ---------------------------------------------------------------------------
# HELPERS
# ---------------------------------------------------------------------------
 
def _build_greeting(user_name: str) -> str:
    """Returns a personalised opening greeting for a new conversation."""
    if user_name:
        return (
            f"Hi {user_name}, I'm REN, your emotional wellness companion. "
            "I'm here whenever you want to talk about how you're feeling. "
            "What's on your mind today?"
        )
    return (
        "Hi, I'm REN, your emotional wellness companion. "
        "I'm here whenever you want to talk about how you're feeling. "
        "What's on your mind today?"
    )
 
