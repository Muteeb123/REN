from pydantic import BaseModel
from typing import List, Optional

class Message(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class Conversation(BaseModel):
    user_id: str
    active: bool = True
    messages: List[Message] = []
    session_id: Optional[str] = None 