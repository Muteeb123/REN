from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from pydantic import Field

class Message(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    created_at: datetime = Field(default_factory=datetime.now)  # timestamp for the message
    updated_at: datetime = Field(default_factory=datetime.now)

class Conversation(BaseModel):
    user_id: str
    active: bool = True
    messages: List[Message] = []
    created_at: datetime = Field(default_factory=datetime.now)  # timestamp for the message
    updated_at: datetime = Field(default_factory=datetime.now)
    closed_at: Optional[datetime] = None 
    