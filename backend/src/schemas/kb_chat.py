from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class ChatSessionCreate(BaseModel):
    initial_message: Optional[str] = None


class ChatMessage(BaseModel):
    message: str


class ChatSessionResponse(BaseModel):
    id: str
    title: str
    created_at: str
    updated_at: str
    message_count: int
    is_active: bool
    topics_discussed: List[str]
    satisfaction_rating: Optional[int]
    converted_to_ticket: bool


class ChatMessageResponse(BaseModel):
    id: str
    message: str
    message_type: str
    timestamp: str
    sources: List[Dict[str, Any]]


class ChatResponse(BaseModel):
    response: str
    sources: List[Dict[str, Any]]
    session_id: str
    timestamp: str
    error: Optional[str] = None


class SessionRating(BaseModel):
    rating: int  # 1-5


class TicketConversion(BaseModel):
    title: str
    description: str
    priority: str = "medium"
    category_id: Optional[str] = None
    subcategory_id: Optional[str] = None
