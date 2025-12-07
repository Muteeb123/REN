from google import genai
from config.db import db

client = genai.Client(api_key="AIzaSyBe9DxTBkomRMMRxxi2KJZkdE033QRC1BE")
MODEL_NAME = "gemini-2.5-flash"

async def generateResponse(user_id: str, user_message: str):
    # first lets fetch active conversation from db
    # if any
    conv = await db.conversations.find_one({
        "user_id": user_id,
        "active": True
    })

    # if no active convo is found, then we
    # create a new conversation
    if not conv:
        conv = {
            "user_id": user_id,
            "active": True,
            "messages": []
        }
    
    # now we will add the user's msg to this convo
    conv["messages"].append({
        "role": "user",
        "content": user_message
    })

    # prepare msg for gemini
    messages_for_gemini = [
        {"author": msg["role"],
         "content": msg["content"]}
        for msg in conv["messages"]
    ]

    chat = client.chats.create(
        model=MODEL_NAME
    )

    for msg in messages_for_gemini[:-1]:
        chat.send_message(msg["role"] + ":" + msg["content"])
    
    response = chat.send_message(user_message)
    assistant_reply = response.text

    # store reply of current msg to db as well
    conv["messages"].append({
        "role": "assistant",
        "content": assistant_reply
    })

    # update this reply for the conversation in db
    await db.conversations.update_one(
        {"user_id": user_id, "active": True},
        {"$set": conv},
        upsert=True
    )
    return {
        "reply": assistant_reply
    }
